import { createConnection } from '@/database/db';
import { Coupon } from '@/database/models/coupon';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { createCouponSchema, updateCouponSchema } from '@/lib/validate/coupon.schema';
import { requirePermission } from '../../../../middleware/auth.middleware';

export async function createCoupon(req: Request) {
  await createConnection();
  await requirePermission('coupon:manage');

  const body = await req.json();
  const data = createCouponSchema.parse(body);

  const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    throw new AppError('A coupon with that code already exists', 409);
  }

  const coupon = await Coupon.create({ ...data, code: data.code.toUpperCase() });
  return NextResponse.json({ data: coupon }, { status: 201 });
}

export async function getAllCoupons() {
  await createConnection();
  await requirePermission('coupon:manage');

  const coupons = await Coupon.find().sort('-createdAt');
  return NextResponse.json({ data: coupons }, { status: 200 });
}

export async function updateCoupon(req: Request, id: string) {
  await createConnection();
  await requirePermission('coupon:manage');

  const body = await req.json();
  const data = updateCouponSchema.parse(body);
  const update = data.code ? { ...data, code: data.code.toUpperCase() } : data;

  const coupon = await Coupon.findByIdAndUpdate(id, update, { new: true });
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }
  return NextResponse.json({ data: coupon }, { status: 200 });
}

export async function deleteCoupon(id: string) {
  await createConnection();
  await requirePermission('coupon:manage');

  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }
  return NextResponse.json({ message: 'Coupon deleted successfully' }, { status: 200 });
}
