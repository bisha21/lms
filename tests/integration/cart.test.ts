import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Cart } from '@/database/models/cart';
import { Coupon, CouponDiscountType } from '@/database/models/coupon';
import { Enrollment } from '@/database/models/enrollment.model';
import {
  addToCart,
  applyCoupon,
  getCart,
  removeCoupon,
  removeFromCart,
} from '@/app/api/cart/cart.controller';
import { mockGetServerSession } from '../setup';

async function createPaidCourse(overrides: Partial<Record<string, unknown>> = {}) {
  const category = await Category.create({ name: `Category ${new mongoose.Types.ObjectId()}` });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    coursePrice: 49,
    status: 'published',
    ...overrides,
  });
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/cart/items', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('cart controller', () => {
  const studentId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await createConnection();
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });
  });

  it('adds a paid course to the cart', async () => {
    const course = await createPaidCourse();

    const response = await addToCart(jsonRequest({ courseId: course._id.toString() }));
    expect(response.status).toBe(200);

    const cart = await Cart.findOne({ student: studentId });
    expect(cart?.items.map((id: mongoose.Types.ObjectId) => id.toString())).toEqual([
      course._id.toString(),
    ]);
  });

  it('dedupes — adding the same course twice does not duplicate it', async () => {
    const course = await createPaidCourse();

    await addToCart(jsonRequest({ courseId: course._id.toString() }));
    await addToCart(jsonRequest({ courseId: course._id.toString() }));

    const cart = await Cart.findOne({ student: studentId });
    expect(cart?.items).toHaveLength(1);
  });

  it('rejects adding a free course', async () => {
    const course = await createPaidCourse({ coursePrice: 0 });

    await expect(
      addToCart(jsonRequest({ courseId: course._id.toString() })),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(await Cart.countDocuments({ student: studentId })).toBe(0);
  });

  it('rejects adding a course the student already owns (acceptance criterion)', async () => {
    const course = await createPaidCourse();
    await Enrollment.create({ student: studentId, course: course._id });

    await expect(
      addToCart(jsonRequest({ courseId: course._id.toString() })),
    ).rejects.toMatchObject({ statusCode: 400 });

    const cart = await Cart.findOne({ student: studentId });
    expect(cart?.items ?? []).toHaveLength(0);
  });

  it('removes a course from the cart', async () => {
    const course = await createPaidCourse();
    await Cart.create({ student: studentId, items: [course._id] });

    const response = await removeFromCart(course._id.toString());
    expect(response.status).toBe(200);
    expect(await Cart.findOne({ student: studentId }).then((c) => c?.items)).toHaveLength(0);
  });

  it('returns an empty cart shape for a student with no cart yet', async () => {
    const response = await getCart();
    const body = await response.json();
    expect(body.data.items).toEqual([]);
  });

  it('applies a valid percentage coupon and previews the discount', async () => {
    const course = await createPaidCourse({ coursePrice: 100 });
    await Cart.create({ student: studentId, items: [course._id] });
    await Coupon.create({ code: 'SAVE20', discountType: CouponDiscountType.PERCENTAGE, value: 20 });

    const response = await applyCoupon(
      new Request('http://localhost/api/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code: 'save20' }),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const body = await response.json();

    expect(body.data.previewDiscount).toBe(20);
    const cart = await Cart.findOne({ student: studentId });
    expect(cart?.appliedCoupon).not.toBeNull();
  });

  it('rejects an expired coupon', async () => {
    const course = await createPaidCourse({ coursePrice: 100 });
    await Cart.create({ student: studentId, items: [course._id] });
    await Coupon.create({
      code: 'EXPIRED',
      discountType: CouponDiscountType.FIXED,
      value: 10,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      applyCoupon(
        new Request('http://localhost/api/cart/coupon', {
          method: 'POST',
          body: JSON.stringify({ code: 'EXPIRED' }),
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('removes an applied coupon', async () => {
    const course = await createPaidCourse();
    const coupon = await Coupon.create({
      code: 'REMOVE',
      discountType: CouponDiscountType.FIXED,
      value: 5,
    });
    await Cart.create({ student: studentId, items: [course._id], appliedCoupon: coupon._id });

    const response = await removeCoupon();
    expect(response.status).toBe(200);

    const cart = await Cart.findOne({ student: studentId });
    expect(cart?.appliedCoupon).toBeUndefined();
  });
});
