import { createConnection } from '@/database/db';
import Course, { CourseStatus } from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { checkoutSchema } from '@/lib/validate/payment.schema';
import { stripe } from '@/lib/stripe';
import { requireAuth } from '../../../../middleware/auth.middleware';
import type Stripe from 'stripe';

export async function createCheckoutSession(req: Request) {
  await createConnection();
  const session = await requireAuth();

  const body = await req.json();
  const { courseId } = checkoutSchema.parse(body);

  const course = await Course.findOne({
    _id: courseId,
    status: CourseStatus.PUBLISHED,
    isDeleted: false,
  });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  if (course.coursePrice <= 0) {
    throw new AppError('This course is free — enroll directly instead', 400);
  }

  const alreadyEnrolled = await Enrollment.findOne({
    student: session.user.id,
    course: courseId,
  });
  if (alreadyEnrolled) {
    throw new AppError('You are already enrolled in this course', 400);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: course.title },
          unit_amount: Math.round(course.coursePrice * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/courses/${course.slug}?payment=success`,
    cancel_url: `${appUrl}/courses/${course.slug}?payment=cancelled`,
    metadata: {
      courseId: course._id.toString(),
      studentId: session.user.id,
    },
  });

  return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
}

export async function handleWebhook(req: Request) {
  await createConnection();
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  if (!signature) {
    throw new AppError('Missing stripe-signature header', 400);
  }

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
    const { courseId, studentId } = checkoutSession.metadata ?? {};

    if (courseId && studentId) {
      await Payment.findOneAndUpdate(
        { transactionId: checkoutSession.id },
        {
          student: studentId,
          course: courseId,
          amount: (checkoutSession.amount_total ?? 0) / 100,
          currency: checkoutSession.currency ?? 'usd',
          status: PaymentStatus.Completed,
          transactionId: checkoutSession.id,
        },
        { upsert: true, new: true }
      );

      await Enrollment.findOneAndUpdate(
        { student: studentId, course: courseId },
        { student: studentId, course: courseId },
        { upsert: true, new: true }
      );
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
