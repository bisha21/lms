import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Coupon, CouponDiscountType } from '@/database/models/coupon';
import { Enrollment } from '@/database/models/enrollment.model';
import { Order, OrderStatus } from '@/database/models/order';
import { Payment } from '@/database/models/payment.model';

const constructEvent = vi.fn();
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({ webhooks: { constructEvent } }),
}));

const { handleWebhook } = await import('@/app/api/payments/payment.controller');

function webhookRequest(rawBody: string) {
  return new Request('http://localhost/api/payments/webhook', {
    method: 'POST',
    body: rawBody,
    headers: { 'stripe-signature': 'test-signature' },
  });
}

async function createPaidCourse(price = 49) {
  const category = await Category.create({ name: `Category ${new mongoose.Types.ObjectId()}` });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    coursePrice: price,
    status: 'published',
  });
}

async function createPendingOrder(studentId: string, items: { course: mongoose.Types.ObjectId; title: string; price: number }[], sessionId: string, couponId?: mongoose.Types.ObjectId) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return Order.create({
    student: studentId,
    items,
    coupon: couponId,
    subtotal,
    discount: 0,
    total: subtotal,
    currency: 'usd',
    status: OrderStatus.PENDING,
    stripeCheckoutSessionId: sessionId,
  });
}

function completedEvent(sessionId: string) {
  return {
    type: 'checkout.session.completed',
    data: { object: { id: sessionId, amount_total: 0, currency: 'usd', metadata: {} } },
  };
}

describe('payment webhook — checkout.session.completed (Order-based)', () => {
  beforeEach(async () => {
    await createConnection();
    constructEvent.mockReset();
  });

  it('marks the order paid and creates one Payment + Enrollment per item', async () => {
    const studentId = new mongoose.Types.ObjectId().toString();
    const courseA = await createPaidCourse(49);
    const courseB = await createPaidCourse(29);
    const order = await createPendingOrder(
      studentId,
      [
        { course: courseA._id, title: courseA.title, price: 49 },
        { course: courseB._id, title: courseB.title, price: 29 },
      ],
      'cs_test_multi',
    );
    constructEvent.mockReturnValue(completedEvent('cs_test_multi'));

    const response = await handleWebhook(webhookRequest('{}'));
    expect(response.status).toBe(200);

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder?.status).toBe('paid');
    expect(updatedOrder?.paidAt).not.toBeNull();

    expect(await Payment.countDocuments({ student: studentId })).toBe(2);
    expect(await Enrollment.countDocuments({ student: studentId, course: courseA._id })).toBe(1);
    expect(await Enrollment.countDocuments({ student: studentId, course: courseB._id })).toBe(1);
  });

  it('increments the coupon usedCount exactly once', async () => {
    const studentId = new mongoose.Types.ObjectId().toString();
    const course = await createPaidCourse(100);
    const coupon = await Coupon.create({
      code: 'ONCE',
      discountType: CouponDiscountType.FIXED,
      value: 10,
      usedCount: 0,
    });
    await createPendingOrder(
      studentId,
      [{ course: course._id, title: course.title, price: 100 }],
      'cs_test_coupon',
      coupon._id,
    );
    constructEvent.mockReturnValue(completedEvent('cs_test_coupon'));

    await handleWebhook(webhookRequest('{}'));

    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(1);
  });

  it('is idempotent — replaying the identical event a second time creates no duplicates (acceptance criterion)', async () => {
    const studentId = new mongoose.Types.ObjectId().toString();
    const course = await createPaidCourse(49);
    const coupon = await Coupon.create({
      code: 'REPLAY',
      discountType: CouponDiscountType.FIXED,
      value: 5,
      usedCount: 0,
    });
    await createPendingOrder(
      studentId,
      [{ course: course._id, title: course.title, price: 49 }],
      'cs_test_replay',
      coupon._id,
    );
    constructEvent.mockReturnValue(completedEvent('cs_test_replay'));

    await handleWebhook(webhookRequest('{}'));
    await handleWebhook(webhookRequest('{}')); // Stripe redelivers the same event

    expect(await Payment.countDocuments({ student: studentId })).toBe(1);
    expect(await Enrollment.countDocuments({ student: studentId, course: course._id })).toBe(1);
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(1);
  });

  it('does nothing for an unknown/already-processed session id (no order found)', async () => {
    constructEvent.mockReturnValue(completedEvent('cs_test_does_not_exist'));

    const response = await handleWebhook(webhookRequest('{}'));
    expect(response.status).toBe(200);
    expect(await Payment.countDocuments({})).toBe(0);
    expect(await Enrollment.countDocuments({})).toBe(0);
  });

  it('rejects a request with no stripe-signature header', async () => {
    const request = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      body: '{}',
    });

    await expect(handleWebhook(request)).rejects.toMatchObject({ statusCode: 400 });
  });
});
