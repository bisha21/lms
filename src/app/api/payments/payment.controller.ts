import mongoose from 'mongoose';
import { createConnection } from '@/database/db';
import Course, { CourseStatus } from '@/database/models/course.schema';
import { Cart } from '@/database/models/cart';
import { Coupon } from '@/database/models/coupon';
import { Enrollment } from '@/database/models/enrollment.model';
import { IOrderItem, Order, OrderStatus } from '@/database/models/order';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { checkoutSchema } from '@/lib/validate/payment.schema';
import { computeDiscount } from '@/lib/commerce/coupon';
import { getStripe } from '@/lib/stripe';
import { requireAuth } from '../../../../middleware/auth.middleware';
import type Stripe from 'stripe';

interface CheckoutItem {
  course: string;
  title: string;
  price: number;
}

async function loadCheckoutItems(courseIds: string[], studentId: string): Promise<CheckoutItem[]> {
  const items: CheckoutItem[] = [];
  for (const courseId of courseIds) {
    const course = await Course.findOne({
      _id: courseId,
      status: CourseStatus.PUBLISHED,
      isDeleted: false,
    });
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    if (course.coursePrice <= 0) {
      throw new AppError(`"${course.title}" is free — enroll directly instead`, 400);
    }
    const owned = await Enrollment.findOne({ student: studentId, course: courseId });
    if (owned) {
      throw new AppError(`You already own "${course.title}"`, 400);
    }
    items.push({ course: course._id.toString(), title: course.title, price: course.coursePrice });
  }
  return items;
}

// One unified checkout for both "Buy Now" (explicit courseIds, bypasses the persisted
// cart entirely) and "checkout my cart" (courseIds omitted). Both end up creating exactly
// one pending Order and one Stripe Checkout Session — see handleWebhook for how that Order
// is the sole idempotency gate for granting enrollment.
export async function createCheckout(req: Request) {
  await createConnection();
  const session = await requireAuth();

  const body = await req.json();
  const { courseIds: explicitCourseIds, couponCode } = checkoutSchema.parse(body);
  const isBuyNow = !!explicitCourseIds?.length;

  let items: CheckoutItem[];
  let effectiveCouponCode = couponCode;

  if (isBuyNow) {
    items = await loadCheckoutItems(explicitCourseIds!, session.user.id);
  } else {
    const cart = await Cart.findOne({ student: session.user.id }).populate('appliedCoupon');
    if (!cart || cart.items.length === 0) {
      throw new AppError('Your cart is empty', 400);
    }
    items = await loadCheckoutItems(
      cart.items.map((id: mongoose.Types.ObjectId) => id.toString()),
      session.user.id
    );
    if (!effectiveCouponCode && cart.appliedCoupon) {
      effectiveCouponCode = (cart.appliedCoupon as unknown as { code: string }).code;
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);

  let coupon = null;
  let discount = 0;
  if (effectiveCouponCode) {
    coupon = await Coupon.findOne({ code: effectiveCouponCode.toUpperCase() });
    if (!coupon) {
      throw new AppError('Invalid coupon code', 404);
    }
    discount = computeDiscount(
      coupon,
      items.map((item) => ({ course: item.course, price: item.price }))
    );
  }

  const total = Math.round((subtotal - discount) * 100) / 100;
  if (total <= 0) {
    throw new AppError('Order total must be greater than 0', 400);
  }

  const order = await Order.create({
    student: session.user.id,
    items,
    coupon: coupon?._id,
    subtotal,
    discount,
    total,
    currency: 'usd',
    status: OrderStatus.PENDING,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const stripe = getStripe();

  // With a coupon discount, collapse to a single line item for the discounted total —
  // avoids having to spread the discount proportionally (and re-reconcile rounding) across
  // several per-course Stripe line items. Full-price checkouts keep one line item per
  // course for a nicer itemized Stripe checkout page.
  const lineItems =
    discount > 0
      ? [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: items.length === 1 ? items[0].title : `${items.length} courses`,
              },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ]
      : items.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: { name: item.title },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: 1,
        }));

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: `${appUrl}/checkout/success?orderId=${order._id.toString()}`,
    cancel_url: `${appUrl}/checkout/cancel`,
    metadata: {
      orderId: order._id.toString(),
      studentId: session.user.id,
    },
  });

  order.stripeCheckoutSessionId = checkoutSession.id;
  await order.save();

  if (!isBuyNow) {
    await Cart.updateOne({ student: session.user.id }, { items: [], $unset: { appliedCoupon: 1 } });
  }

  return NextResponse.json(
    { url: checkoutSession.url, orderId: order._id.toString() },
    { status: 200 }
  );
}

export async function handleWebhook(req: Request) {
  await createConnection();
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  if (!signature) {
    throw new AppError('Missing stripe-signature header', 400);
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    throw new AppError('Invalid webhook signature', 400);
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;

    // The sole idempotency gate: an atomic pending->paid transition. If this returns null,
    // either there's no such order or it's already been processed (a webhook replay) — in
    // both cases there is nothing further to do, and in particular no enrollment is created.
    const order = await Order.findOneAndUpdate(
      { stripeCheckoutSessionId: checkoutSession.id, status: OrderStatus.PENDING },
      { status: OrderStatus.PAID, paidAt: new Date() },
      { new: true }
    );

    if (order) {
      await Promise.all(
        order.items.map((item: IOrderItem) => {
          const transactionId = `${checkoutSession.id}_${item.course.toString()}`;
          return Promise.all([
            Payment.findOneAndUpdate(
              { transactionId },
              {
                student: order.student,
                course: item.course,
                amount: item.price,
                currency: order.currency,
                status: PaymentStatus.Completed,
                transactionId,
              },
              { upsert: true, new: true }
            ),
            Enrollment.findOneAndUpdate(
              { student: order.student, course: item.course },
              { student: order.student, course: item.course },
              { upsert: true, new: true }
            ),
          ]);
        })
      );

      if (order.coupon) {
        await Coupon.updateOne({ _id: order.coupon }, { $inc: { usedCount: 1 } });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function getMyPayments() {
  await createConnection();
  const session = await requireAuth();

  const payments = await Payment.find({ student: session.user.id })
    .populate('course')
    .sort('-createdAt');

  return NextResponse.json({ data: payments }, { status: 200 });
}
