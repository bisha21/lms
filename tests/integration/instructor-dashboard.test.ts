import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { Progress } from '@/database/models/progress.model';
import { getInstructorDashboard } from '@/app/api/instructor/dashboard.controller';
import { mockGetServerSession } from '../setup';

async function createCourseFor(instructorId: string, overrides: Partial<Record<string, unknown>> = {}) {
  const category = await Category.create({ name: 'Programming' });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    instructor: instructorId,
    status: 'published',
    ...overrides,
  });
}

describe('instructor dashboard controller', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('rejects a student (403)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'student' } });
    await expect(getInstructorDashboard()).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows an instructor and returns the expected shape', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await getInstructorDashboard();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toMatchObject({
      publishedCount: expect.any(Number),
      draftCount: expect.any(Number),
      totalRevenue: expect.any(Number),
      enrolledStudentsCount: expect.any(Number),
      coursePerformance: expect.any(Array),
    });
  });

  it("never includes another instructor's courses or revenue", async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const courseA = await createCourseFor(instructorA, { title: 'A course' });
    const courseB = await createCourseFor(instructorB, { title: 'B course' });
    const student = new mongoose.Types.ObjectId();
    await Payment.create([
      { student, course: courseA._id, amount: 10, status: PaymentStatus.Completed },
      { student, course: courseB._id, amount: 500, status: PaymentStatus.Completed },
    ]);

    mockGetServerSession.mockResolvedValue({ user: { id: instructorA, role: 'instructor' } });
    const response = await getInstructorDashboard();
    const body = await response.json();

    expect(body.data.totalRevenue).toBe(10);
    expect(body.data.coursePerformance).toHaveLength(1);
    expect(body.data.coursePerformance[0].title).toBe('A course');
  });

  it('counts published vs draft courses correctly', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    await createCourseFor(instructorId, { status: 'published' });
    await createCourseFor(instructorId, { status: 'draft' });
    await createCourseFor(instructorId, { status: 'draft' });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });
    const response = await getInstructorDashboard();
    const body = await response.json();

    expect(body.data.publishedCount).toBe(1);
    expect(body.data.draftCount).toBe(2);
  });

  it('counts enrolled students as distinct across the instructor\'s multiple courses', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const courseA = await createCourseFor(instructorId);
    const courseB = await createCourseFor(instructorId);
    const student = new mongoose.Types.ObjectId();

    await Enrollment.create([
      { student, course: courseA._id },
      { student, course: courseB._id },
    ]);

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });
    const response = await getInstructorDashboard();
    const body = await response.json();

    expect(body.data.enrolledStudentsCount).toBe(1);
  });

  it('computes completionRate counting enrolled-but-unstarted students as 0%', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseFor(instructorId);
    const lessons = await Lesson.create([
      { course: course._id, title: 'L1', description: 'd', videoUrl: 'https://x.com/1.mp4', order: 0 },
      { course: course._id, title: 'L2', description: 'd', videoUrl: 'https://x.com/2.mp4', order: 1 },
    ]);

    const studentA = new mongoose.Types.ObjectId();
    const studentB = new mongoose.Types.ObjectId(); // enrolled, never started

    await Enrollment.create([
      { student: studentA, course: course._id },
      { student: studentB, course: course._id },
    ]);
    // studentA completed 1 of 2 lessons (50%); studentB has no Progress doc at all (0%).
    // Average across both enrolled students: (50 + 0) / 2 = 25%.
    await Progress.create({ student: studentA, course: course._id, completedLessons: [lessons[0]._id] });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });
    const response = await getInstructorDashboard();
    const body = await response.json();

    expect(body.data.coursePerformance[0].completionRate).toBe(25);
  });
});
