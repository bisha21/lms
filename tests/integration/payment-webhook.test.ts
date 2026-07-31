import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Payment } from '@/database/models/payment.model';

const constructEvent = vi.fn();
vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({ webhooks: { constructEvent } }),
}));

// Imported after the mock so payment.controller.ts picks up the mocked getStripe().
const { handleWebhook } = await import('@/app/api/payments/payment.controller');

function webhookRequest(rawBody: string) {
  return new Request('http://localhost/api/payments/webhook', {
    method: 'POST',
    body: rawBody,
    headers: { 'stripe-signature': 'test-signature' },
  });
}

describe('payment webhook — checkout.session.completed', () => {
  beforeEach(async () => {
    await createConnection();
    constructEvent.mockReset();
  });

  it('upserts a completed Payment and an Enrollment', async () => {
    const category = await Category.create({ name: 'Programming' });
    const course = await Course.create({
      title: 'Paid Course',
      courseDescription: 'desc',
      duration: '3h',
      category: category._id,
      coursePrice: 49,
      status: 'published',
    });
    const studentId = new mongoose.Types.ObjectId().toString();

    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          amount_total: 4900,
          currency: 'usd',
          metadata: { courseId: course._id.toString(), studentId },
        },
      },
    });

    const response = await handleWebhook(webhookRequest('{}'));
    expect(response.status).toBe(200);

    const payment = await Payment.findOne({ transactionId: 'cs_test_123' });
    expect(payment).toMatchObject({ amount: 49, currency: 'usd', status: 'completed' });

    const enrollment = await Enrollment.findOne({ student: studentId, course: course._id });
    expect(enrollment).not.toBeNull();
  });

  it('is idempotent when Stripe redelivers the same event', async () => {
    const category = await Category.create({ name: 'Programming' });
    const course = await Course.create({
      title: 'Paid Course 2',
      courseDescription: 'desc',
      duration: '3h',
      category: category._id,
      coursePrice: 49,
      status: 'published',
    });
    const studentId = new mongoose.Types.ObjectId().toString();

    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_456',
          amount_total: 4900,
          currency: 'usd',
          metadata: { courseId: course._id.toString(), studentId },
        },
      },
    });

    await handleWebhook(webhookRequest('{}'));
    await handleWebhook(webhookRequest('{}'));

    expect(await Payment.countDocuments({ transactionId: 'cs_test_456' })).toBe(1);
    expect(await Enrollment.countDocuments({ student: studentId, course: course._id })).toBe(1);
  });

  it('rejects a request with no stripe-signature header', async () => {
    const request = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      body: '{}',
    });

    await expect(handleWebhook(request)).rejects.toMatchObject({ statusCode: 400 });
  });
});
