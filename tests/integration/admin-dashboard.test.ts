import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { Review } from '@/database/models/review';
import User, { Role } from '@/database/models/user.schema';
import { getAdminDashboard } from '@/app/api/admin/overview.controller';
import { mockGetServerSession } from '../setup';

async function createCourse(overrides: Partial<Record<string, unknown>> = {}) {
  const category = await Category.create({ name: `Programming ${new mongoose.Types.ObjectId()}` });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    instructor: new mongoose.Types.ObjectId(),
    status: 'published',
    ...overrides,
  });
}

describe('admin dashboard controller', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it.each([['instructor'], ['student']])('rejects an authenticated %s (403)', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role } });
    await expect(getAdminDashboard()).rejects.toMatchObject({ statusCode: 403 });
  });

  it.each([['super_admin'], ['admin']])('allows %s and returns the expected shape', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role } });

    const response = await getAdminDashboard();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toMatchObject({
      courseCount: expect.any(Number),
      studentCount: expect.any(Number),
      instructorCount: expect.any(Number),
      totalRevenue: expect.any(Number),
      salesTrend: expect.any(Array),
      recentActivity: expect.any(Array),
    });
  });

  it('sums totalRevenue from completed payments only', async () => {
    const course = await createCourse();
    const student = await User.create({ username: 'S', email: 's@example.com', password: 'x' });
    await Payment.create([
      { student: student._id, course: course._id, amount: 10, status: PaymentStatus.Completed },
      { student: student._id, course: course._id, amount: 20, status: PaymentStatus.Completed },
      { student: student._id, course: course._id, amount: 999, status: PaymentStatus.Pending },
    ]);

    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    const response = await getAdminDashboard();
    const body = await response.json();

    expect(body.data.totalRevenue).toBe(30);
  });

  it('counts students, instructors, and non-deleted courses correctly', async () => {
    await User.create([
      { username: 'S1', email: 's1@example.com', password: 'x', role: Role.STUDENT },
      { username: 'S2', email: 's2@example.com', password: 'x', role: Role.STUDENT },
      { username: 'I1', email: 'i1@example.com', password: 'x', role: Role.INSTRUCTOR },
    ]);
    await createCourse();
    const deleted = await createCourse();
    deleted.isDeleted = true;
    await deleted.save();

    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    const response = await getAdminDashboard();
    const body = await response.json();

    expect(body.data.studentCount).toBe(2);
    expect(body.data.instructorCount).toBe(1);
    expect(body.data.courseCount).toBe(1);
  });

  it('merges enrollments, payments, and reviews into recentActivity sorted newest-first', async () => {
    const course = await createCourse({ title: 'Activity Course' });
    const student = await User.create({ username: 'Ann', email: 'ann@example.com', password: 'x' });

    await Enrollment.create({ student: student._id, course: course._id });
    await Review.create({ student: student._id, course: course._id, rating: 5 });
    await Payment.create({
      student: student._id,
      course: course._id,
      amount: 15,
      status: PaymentStatus.Completed,
    });

    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    const response = await getAdminDashboard();
    const body = await response.json();

    const types = body.data.recentActivity.map((a: { type: string }) => a.type);
    expect(types).toEqual(expect.arrayContaining(['enrollment', 'payment', 'review']));

    const dates = body.data.recentActivity.map((a: { date: string }) => new Date(a.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
});
