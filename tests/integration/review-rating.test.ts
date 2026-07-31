import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Review } from '@/database/models/review';

async function createCourse() {
  const category = await Category.create({ name: 'Programming' });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    status: 'published',
  });
}

describe('Review model', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('computes a correct average across multiple reviews', async () => {
    const course = await createCourse();
    await Review.create([
      { student: new mongoose.Types.ObjectId(), course: course._id, rating: 5 },
      { student: new mongoose.Types.ObjectId(), course: course._id, rating: 3 },
      { student: new mongoose.Types.ObjectId(), course: course._id, rating: 4 },
    ]);

    const [summary] = await Review.aggregate([
      { $match: { course: course._id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);

    expect(summary.reviewCount).toBe(3);
    expect(summary.averageRating).toBeCloseTo(4, 5);
  });

  it('returns no group result for a course with zero reviews (caller must handle this, not throw)', async () => {
    const course = await createCourse();

    const result = await Review.aggregate([
      { $match: { course: course._id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);

    expect(result).toEqual([]);
  });

  it('rejects a duplicate (student, course) review via the unique index', async () => {
    const course = await createCourse();
    const studentId = new mongoose.Types.ObjectId();

    await Review.create({ student: studentId, course: course._id, rating: 5 });

    await expect(Review.create({ student: studentId, course: course._id, rating: 2 })).rejects.toMatchObject({
      code: 11000,
    });
  });

  it('rejects a rating outside the 1-5 range', async () => {
    const course = await createCourse();

    await expect(
      Review.create({ student: new mongoose.Types.ObjectId(), course: course._id, rating: 6 }),
    ).rejects.toThrow();
    await expect(
      Review.create({ student: new mongoose.Types.ObjectId(), course: course._id, rating: 0 }),
    ).rejects.toThrow();
  });
});
