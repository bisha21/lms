import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { Review } from '@/database/models/review';
import { getAllCourses } from '@/app/api/courses/course.Controller';
import { mockGetServerSession } from '../setup';

function catalogRequest(query: Record<string, string> = {}) {
  const params = new URLSearchParams(query).toString();
  return new Request(`http://localhost/api/courses${params ? `?${params}` : ''}`);
}

async function createPublishedCourse(overrides: Partial<Record<string, unknown>> = {}) {
  const category = await Category.create({ name: `Category ${new mongoose.Types.ObjectId()}` });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    status: 'published',
    ...overrides,
  });
}

describe('getAllCourses — filters, sorting, pagination', () => {
  beforeEach(async () => {
    await createConnection();
    mockGetServerSession.mockResolvedValue(null); // anonymous catalog visitor
  });

  it('filters by category', async () => {
    const categoryA = await Category.create({ name: 'Category A' });
    const categoryB = await Category.create({ name: 'Category B' });
    await createPublishedCourse({ title: 'In A', category: categoryA._id });
    await createPublishedCourse({ title: 'In B', category: categoryB._id });

    const response = await getAllCourses(catalogRequest({ category: categoryA._id.toString() }));
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('In A');
  });

  it('filters by level', async () => {
    await createPublishedCourse({ title: 'Beginner Course', level: 'beginner' });
    await createPublishedCourse({ title: 'Advanced Course', level: 'advanced' });

    const response = await getAllCourses(catalogRequest({ level: 'advanced' }));
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Advanced Course');
  });

  it('filters by language, case-insensitively', async () => {
    await createPublishedCourse({ title: 'Spanish Course', language: 'Spanish' });
    await createPublishedCourse({ title: 'English Course', language: 'English' });

    const response = await getAllCourses(catalogRequest({ language: 'spanish' }));
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Spanish Course');
  });

  it('filters by price range', async () => {
    await createPublishedCourse({ title: 'Cheap', coursePrice: 10 });
    await createPublishedCourse({ title: 'Mid', coursePrice: 50 });
    await createPublishedCourse({ title: 'Expensive', coursePrice: 200 });

    const response = await getAllCourses(catalogRequest({ minPrice: '20', maxPrice: '100' }));
    const body = await response.json();

    expect(body.data.map((c: { title: string }) => c.title)).toEqual(['Mid']);
  });

  it('filters by instructor', async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    await createPublishedCourse({ title: 'By A', instructor: instructorA });
    await createPublishedCourse({ title: 'By B', instructor: instructorB });

    const response = await getAllCourses(catalogRequest({ instructor: instructorA }));
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('By A');
  });

  it('filters by minimum rating, excluding courses with no reviews', async () => {
    const highRated = await createPublishedCourse({ title: 'High Rated' });
    const lowRated = await createPublishedCourse({ title: 'Low Rated' });
    await createPublishedCourse({ title: 'Unrated' });

    await Review.create({ student: new mongoose.Types.ObjectId(), course: highRated._id, rating: 5 });
    await Review.create({ student: new mongoose.Types.ObjectId(), course: lowRated._id, rating: 2 });

    const response = await getAllCourses(catalogRequest({ minRating: '4' }));
    const body = await response.json();

    expect(body.data.map((c: { title: string }) => c.title)).toEqual(['High Rated']);
  });

  it('excludes draft and soft-deleted courses from the public catalog', async () => {
    await createPublishedCourse({ title: 'Published' });
    await createPublishedCourse({ title: 'Draft', status: 'draft' });
    await createPublishedCourse({ title: 'Deleted', isDeleted: true });

    const response = await getAllCourses(catalogRequest());
    const body = await response.json();

    expect(body.data.map((c: { title: string }) => c.title)).toEqual(['Published']);
  });

  it('sorts by price ascending', async () => {
    await createPublishedCourse({ title: 'Mid', coursePrice: 50 });
    await createPublishedCourse({ title: 'Cheap', coursePrice: 10 });
    await createPublishedCourse({ title: 'Expensive', coursePrice: 200 });

    const response = await getAllCourses(catalogRequest({ sort: 'price' }));
    const body = await response.json();

    expect(body.data.map((c: { title: string }) => c.title)).toEqual(['Cheap', 'Mid', 'Expensive']);
  });

  it('sorts by rating descending, unrated courses last', async () => {
    const high = await createPublishedCourse({ title: 'High' });
    const mid = await createPublishedCourse({ title: 'Mid' });
    await createPublishedCourse({ title: 'Unrated' });

    await Review.create({ student: new mongoose.Types.ObjectId(), course: high._id, rating: 5 });
    await Review.create({ student: new mongoose.Types.ObjectId(), course: mid._id, rating: 3 });

    const response = await getAllCourses(catalogRequest({ sort: 'rating' }));
    const body = await response.json();

    expect(body.data.map((c: { title: string }) => c.title)).toEqual(['High', 'Mid', 'Unrated']);
  });

  it('sorts by popular (enrollment count) descending', async () => {
    const popular = await createPublishedCourse({ title: 'Popular' });
    const quiet = await createPublishedCourse({ title: 'Quiet' });

    await Enrollment.create([
      { student: new mongoose.Types.ObjectId(), course: popular._id },
      { student: new mongoose.Types.ObjectId(), course: popular._id },
      { student: new mongoose.Types.ObjectId(), course: quiet._id },
    ]);

    const response = await getAllCourses(catalogRequest({ sort: 'popular' }));
    const body = await response.json();

    expect(body.data.map((c: { title: string }) => c.title)).toEqual(['Popular', 'Quiet']);
  });

  it('sorts by best-selling (completed payment count) descending, ignoring pending payments', async () => {
    const bestSeller = await createPublishedCourse({ title: 'Best Seller', coursePrice: 20 });
    const fewSales = await createPublishedCourse({ title: 'Few Sales', coursePrice: 20 });

    await Payment.create([
      {
        student: new mongoose.Types.ObjectId(),
        course: bestSeller._id,
        amount: 20,
        status: PaymentStatus.Completed,
      },
      {
        student: new mongoose.Types.ObjectId(),
        course: bestSeller._id,
        amount: 20,
        status: PaymentStatus.Completed,
      },
      {
        student: new mongoose.Types.ObjectId(),
        course: fewSales._id,
        amount: 20,
        status: PaymentStatus.Completed,
      },
      {
        student: new mongoose.Types.ObjectId(),
        course: fewSales._id,
        amount: 20,
        status: PaymentStatus.Pending,
      },
    ]);

    const response = await getAllCourses(catalogRequest({ sort: 'best-selling' }));
    const body = await response.json();

    expect(body.data.map((c: { title: string }) => c.title)).toEqual(['Best Seller', 'Few Sales']);
  });

  it('paginates correctly on top of a non-default sort', async () => {
    await Promise.all(
      [30, 10, 50, 20, 40].map((price) => createPublishedCourse({ title: `Course ${price}`, coursePrice: price })),
    );

    const page1 = await (await getAllCourses(catalogRequest({ sort: 'price', page: '1', limit: '2' }))).json();
    const page2 = await (await getAllCourses(catalogRequest({ sort: 'price', page: '2', limit: '2' }))).json();

    expect(page1.data.map((c: { coursePrice: number }) => c.coursePrice)).toEqual([10, 20]);
    expect(page2.data.map((c: { coursePrice: number }) => c.coursePrice)).toEqual([30, 40]);
    expect(page1.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
  });

  it('does not leak instructor password/email in the joined instructor summary', async () => {
    const instructor = new mongoose.Types.ObjectId();
    await createPublishedCourse({ title: 'Has Instructor', instructor });

    const response = await getAllCourses(catalogRequest());
    const body = await response.json();

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('password');
    expect(serialized).not.toMatch(/"email"/);
  });
});
