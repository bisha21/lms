import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Cart } from '@/database/models/cart';
import { Coupon, CouponDiscountType } from '@/database/models/coupon';
import { Enrollment } from '@/database/models/enrollment.model';
import { Order } from '@/database/models/order';
import { mockGetServerSession } from '../setup';

const createSession = vi.fn();
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({ checkout: { sessions: { create: (...args: unknown[]) => createSession(...args) } } }),
}));

const { createCheckout } = await import('@/app/api/payments/payment.controller');

async function createPaidCourse(overrides: Partial<Record<string, unknown>> = {}) {
  const category = await Category.create({ name: `Category ${new mongoose.Types.ObjectId()}` });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    coursePrice: 100,
    status: 'published',
    ...overrides,
  });
}

function checkoutRequest(body: unknown) {
  return new Request('http://localhost/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createCheckout — Buy Now and cart-based checkout', () => {
  const studentId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await createConnection();
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });
    createSession.mockReset();
    createSession.mockResolvedValue({ id: 'cs_test_new', url: 'https://checkout.stripe.com/cs_test_new' });
  });

  it('Buy Now: creates a pending order for just the given course, bypassing the cart', async () => {
    const course = await createPaidCourse();
    await Cart.create({ student: studentId, items: [] });

    const response = await createCheckout(checkoutRequest({ courseIds: [course._id.toString()] }));
    const body = await response.json();

    expect(body.url).toBe('https://checkout.stripe.com/cs_test_new');
    const order = await Order.findById(body.orderId);
    expect(order?.status).toBe('pending');
    expect(order?.items).toHaveLength(1);
    expect(order?.total).toBe(100);
    expect(order?.stripeCheckoutSessionId).toBe('cs_test_new');
  });

  it('Buy Now rejects an already-owned course', async () => {
    const course = await createPaidCourse();
    await Enrollment.create({ student: studentId, course: course._id });

    await expect(
      createCheckout(checkoutRequest({ courseIds: [course._id.toString()] })),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('checks out the persisted cart when courseIds is omitted, and clears the cart after', async () => {
    const courseA = await createPaidCourse();
    const courseB = await createPaidCourse();
    await Cart.create({ student: studentId, items: [courseA._id, courseB._id] });

    const response = await createCheckout(checkoutRequest({}));
    const body = await response.json();

    const order = await Order.findById(body.orderId);
    expect(order?.items).toHaveLength(2);
    expect(order?.total).toBe(200);

    const cart = await Cart.findOne({ student: studentId });
    expect(cart?.items).toHaveLength(0);
  });

  it('rejects checkout with an empty cart', async () => {
    await Cart.create({ student: studentId, items: [] });

    await expect(createCheckout(checkoutRequest({}))).rejects.toMatchObject({ statusCode: 400 });
  });

  it('applies the cart-applied coupon automatically and reduces the order total', async () => {
    const course = await createPaidCourse({ coursePrice: 100 });
    const coupon = await Coupon.create({
      code: 'SAVE25',
      discountType: CouponDiscountType.PERCENTAGE,
      value: 25,
    });
    await Cart.create({ student: studentId, items: [course._id], appliedCoupon: coupon._id });

    const response = await createCheckout(checkoutRequest({}));
    const body = await response.json();

    const order = await Order.findById(body.orderId);
    expect(order?.subtotal).toBe(100);
    expect(order?.discount).toBe(25);
    expect(order?.total).toBe(75);

    // Discounted order collapses to a single line item for the discounted total.
    const [[sessionArgs]] = createSession.mock.calls;
    expect(sessionArgs.line_items).toHaveLength(1);
    expect(sessionArgs.line_items[0].price_data.unit_amount).toBe(7500);
  });

  it('an explicit couponCode overrides whatever is applied to the cart', async () => {
    const course = await createPaidCourse({ coursePrice: 100 });
    await Coupon.create({ code: 'CARTCODE', discountType: CouponDiscountType.FIXED, value: 10 });
    const explicitCoupon = await Coupon.create({
      code: 'EXPLICIT',
      discountType: CouponDiscountType.FIXED,
      value: 40,
    });
    const cartCoupon = await Coupon.findOne({ code: 'CARTCODE' });
    await Cart.create({ student: studentId, items: [course._id], appliedCoupon: cartCoupon?._id });

    const response = await createCheckout(checkoutRequest({ couponCode: explicitCoupon.code }));
    const order = await Order.findById((await response.json()).orderId);

    expect(order?.discount).toBe(40);
  });
});
