import { expect, test } from '@playwright/test';
import Stripe from 'stripe';
import { PAID_COURSE_PRICE, PAID_COURSE_SLUG } from './global-setup';
import { registerUser } from './helpers';

// Exercises the real checkout-session creation against Stripe's test-mode API, then
// simulates Stripe's webhook delivery (rather than driving Stripe's hosted checkout UI,
// which would need a live card flow) using stripe.webhooks.generateTestHeaderString —
// the SDK's own helper for producing a validly-signed test event.
test('paid checkout creates a Stripe session, and a completed-webhook grants enrollment', async ({
  page,
}) => {
  test.skip(
    !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET,
    'Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET (test-mode) to be configured',
  );

  await registerUser(page);

  const sessionRes = await page.request.get('/api/auth/session');
  const { user } = await sessionRes.json();

  const courseRes = await page.request.get(`/api/courses/slug/${PAID_COURSE_SLUG}`);
  const { data } = await courseRes.json();
  const courseId = data.course._id as string;

  const checkoutRes = await page.request.post('/api/payments/checkout', {
    data: { courseId },
  });
  expect(checkoutRes.ok()).toBeTruthy();
  const { url } = await checkoutRes.json();
  expect(url).toContain('checkout.stripe.com');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const payload = JSON.stringify({
    id: 'evt_test_e2e',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_test_e2e_${Date.now()}`,
        amount_total: PAID_COURSE_PRICE * 100,
        currency: 'usd',
        metadata: { courseId, studentId: user.id },
      },
    },
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET as string,
  });

  const webhookRes = await page.request.post('/api/payments/webhook', {
    data: payload,
    headers: { 'stripe-signature': signature, 'Content-Type': 'application/json' },
  });
  expect(webhookRes.ok()).toBeTruthy();

  await page.goto('/my-courses');
  await expect(page.getByRole('heading', { name: 'E2E Paid Advanced Course' })).toBeVisible();

  await page.goto('/payments');
  await expect(page.getByText('E2E Paid Advanced Course')).toBeVisible();
});
