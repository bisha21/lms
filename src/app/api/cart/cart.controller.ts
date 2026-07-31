import mongoose from 'mongoose';
import { createConnection } from '@/database/db';
import { Cart } from '@/database/models/cart';
import { Coupon } from '@/database/models/coupon';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { addItemSchema, applyCouponSchema } from '@/lib/validate/cart.schema';
import { assertCourseAddable } from '@/lib/commerce/cartEligibility';
import { computeDiscount } from '@/lib/commerce/coupon';
import { requireAuth } from '../../../../middleware/auth.middleware';

export async function getCart() {
  await createConnection();
  const session = await requireAuth();

  const cart = await Cart.findOne({ student: session.user.id })
    .populate('items')
    .populate('appliedCoupon');

  return NextResponse.json(
    { data: cart ?? { student: session.user.id, items: [], appliedCoupon: null } },
    { status: 200 }
  );
}

export async function addToCart(req: Request) {
  await createConnection();
  const session = await requireAuth();

  const body = await req.json();
  const { courseId } = addItemSchema.parse(body);

  await assertCourseAddable(courseId, session.user.id);

  const cart = await Cart.findOneAndUpdate(
    { student: session.user.id },
    { $addToSet: { items: courseId } },
    { upsert: true, new: true }
  ).populate('items');

  return NextResponse.json({ data: cart }, { status: 200 });
}

export async function removeFromCart(courseId: string) {
  await createConnection();
  const session = await requireAuth();

  const cart = await Cart.findOneAndUpdate(
    { student: session.user.id },
    { $pull: { items: courseId } },
    { new: true }
  ).populate('items');

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }
  return NextResponse.json({ data: cart }, { status: 200 });
}

export async function applyCoupon(req: Request) {
  await createConnection();
  const session = await requireAuth();

  const body = await req.json();
  const { code } = applyCouponSchema.parse(body);

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    throw new AppError('Invalid coupon code', 404);
  }

  const cart = await Cart.findOne({ student: session.user.id }).populate<{
    items: { _id: mongoose.Types.ObjectId; coursePrice: number }[];
  }>('items');
  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400);
  }

  const discount = computeDiscount(
    coupon,
    cart.items.map((course: { _id: mongoose.Types.ObjectId; coursePrice: number }) => ({
      course: course._id.toString(),
      price: course.coursePrice,
    }))
  );

  cart.appliedCoupon = coupon._id;
  await cart.save();

  return NextResponse.json({ data: { cart, previewDiscount: discount } }, { status: 200 });
}

export async function removeCoupon() {
  await createConnection();
  const session = await requireAuth();

  const cart = await Cart.findOneAndUpdate(
    { student: session.user.id },
    { $unset: { appliedCoupon: 1 } },
    { new: true }
  ).populate('items');

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }
  return NextResponse.json({ data: cart }, { status: 200 });
}
