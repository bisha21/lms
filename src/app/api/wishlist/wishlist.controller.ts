import { createConnection } from '@/database/db';
import { Cart } from '@/database/models/cart';
import { Wishlist } from '@/database/models/wishlist';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { addItemSchema } from '@/lib/validate/cart.schema';
import { assertCourseAddable } from '@/lib/commerce/cartEligibility';
import { requireAuth } from '../../../../middleware/auth.middleware';

export async function getWishlist() {
  await createConnection();
  const session = await requireAuth();

  const wishlist = await Wishlist.findOne({ student: session.user.id }).populate('items');

  return NextResponse.json(
    { data: wishlist ?? { student: session.user.id, items: [] } },
    { status: 200 }
  );
}

export async function addToWishlist(req: Request) {
  await createConnection();
  const session = await requireAuth();

  const body = await req.json();
  const { courseId } = addItemSchema.parse(body);

  await assertCourseAddable(courseId, session.user.id);

  const wishlist = await Wishlist.findOneAndUpdate(
    { student: session.user.id },
    { $addToSet: { items: courseId } },
    { upsert: true, new: true }
  ).populate('items');

  return NextResponse.json({ data: wishlist }, { status: 200 });
}

export async function removeFromWishlist(courseId: string) {
  await createConnection();
  const session = await requireAuth();

  const wishlist = await Wishlist.findOneAndUpdate(
    { student: session.user.id },
    { $pull: { items: courseId } },
    { new: true }
  ).populate('items');

  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }
  return NextResponse.json({ data: wishlist }, { status: 200 });
}

export async function moveToCart(courseId: string) {
  await createConnection();
  const session = await requireAuth();

  // Re-validate — time may have passed since this was wishlisted (e.g. bought
  // separately via Buy Now in the meantime).
  await assertCourseAddable(courseId, session.user.id);

  await Wishlist.updateOne({ student: session.user.id }, { $pull: { items: courseId } });
  const cart = await Cart.findOneAndUpdate(
    { student: session.user.id },
    { $addToSet: { items: courseId } },
    { upsert: true, new: true }
  ).populate('items');

  return NextResponse.json({ data: cart }, { status: 200 });
}
