import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Cart } from '@/database/models/cart';
import { Enrollment } from '@/database/models/enrollment.model';
import { Wishlist } from '@/database/models/wishlist';
import {
  addToWishlist,
  getWishlist,
  moveToCart,
  removeFromWishlist,
} from '@/app/api/wishlist/wishlist.controller';
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
  return new Request('http://localhost/api/wishlist/items', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('wishlist controller', () => {
  const studentId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await createConnection();
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });
  });

  it('adds a course to the wishlist', async () => {
    const course = await createPaidCourse();

    const response = await addToWishlist(jsonRequest({ courseId: course._id.toString() }));
    expect(response.status).toBe(200);

    const wishlist = await Wishlist.findOne({ student: studentId });
    expect(wishlist?.items.map((id: mongoose.Types.ObjectId) => id.toString())).toEqual([
      course._id.toString(),
    ]);
  });

  it('rejects wishlisting an already-owned course', async () => {
    const course = await createPaidCourse();
    await Enrollment.create({ student: studentId, course: course._id });

    await expect(
      addToWishlist(jsonRequest({ courseId: course._id.toString() })),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('removes a course from the wishlist', async () => {
    const course = await createPaidCourse();
    await Wishlist.create({ student: studentId, items: [course._id] });

    const response = await removeFromWishlist(course._id.toString());
    expect(response.status).toBe(200);
    expect(await Wishlist.findOne({ student: studentId }).then((w) => w?.items)).toHaveLength(0);
  });

  it('returns an empty wishlist shape when none exists yet', async () => {
    const response = await getWishlist();
    const body = await response.json();
    expect(body.data.items).toEqual([]);
  });

  it('moves a wishlisted course into the cart', async () => {
    const course = await createPaidCourse();
    await Wishlist.create({ student: studentId, items: [course._id] });

    const response = await moveToCart(course._id.toString());
    expect(response.status).toBe(200);

    const wishlist = await Wishlist.findOne({ student: studentId });
    expect(wishlist?.items).toHaveLength(0);

    const cart = await Cart.findOne({ student: studentId });
    expect(cart?.items.map((id: mongoose.Types.ObjectId) => id.toString())).toEqual([
      course._id.toString(),
    ]);
  });

  it('re-validates on move-to-cart — rejects if the course was bought in the meantime', async () => {
    const course = await createPaidCourse();
    await Wishlist.create({ student: studentId, items: [course._id] });
    await Enrollment.create({ student: studentId, course: course._id });

    await expect(moveToCart(course._id.toString())).rejects.toMatchObject({ statusCode: 400 });
    // Still sitting in the wishlist since the move was rejected before mutating anything.
    const wishlist = await Wishlist.findOne({ student: studentId });
    expect(wishlist?.items).toHaveLength(1);
  });
});
