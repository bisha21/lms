import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Progress } from '@/database/models/progress.model';
import User from '@/database/models/user.schema';
import { getInstructorStudents } from '@/app/api/instructor/students/students.controller';
import { mockGetServerSession } from '../setup';

async function createCourseFor(instructorId: string, overrides: Partial<Record<string, unknown>> = {}) {
  const category = await Category.create({ name: `Programming ${new mongoose.Types.ObjectId()}` });
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

async function createStudent(overrides: Partial<Record<string, unknown>> = {}) {
  return User.create({
    username: `student-${new mongoose.Types.ObjectId()}`,
    email: `${new mongoose.Types.ObjectId()}@example.com`,
    role: 'student',
    ...overrides,
  });
}

describe('instructor students controller', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('rejects a student (403)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'student' } });
    await expect(getInstructorStudents()).rejects.toMatchObject({ statusCode: 403 });
  });

  it('returns one row per enrollment, not grouped by student', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const courseA = await createCourseFor(instructorId, { title: 'Course A' });
    const courseB = await createCourseFor(instructorId, { title: 'Course B' });
    const student = await createStudent();

    await Enrollment.create([
      { student: student._id, course: courseA._id },
      { student: student._id, course: courseB._id },
    ]);

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });
    const response = await getInstructorStudents();
    const body = await response.json();

    expect(body.data.students).toHaveLength(2);
    expect(body.data.totalStudents).toBe(1);
    expect(body.data.students.map((s: { courseTitle: string }) => s.courseTitle).sort()).toEqual([
      'Course A',
      'Course B',
    ]);
  });

  it("never includes another instructor's students", async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const courseA = await createCourseFor(instructorA);
    const courseB = await createCourseFor(instructorB);
    const studentA = await createStudent();
    const studentB = await createStudent();

    await Enrollment.create([
      { student: studentA._id, course: courseA._id },
      { student: studentB._id, course: courseB._id },
    ]);

    mockGetServerSession.mockResolvedValue({ user: { id: instructorA, role: 'instructor' } });
    const response = await getInstructorStudents();
    const body = await response.json();

    expect(body.data.students).toHaveLength(1);
    expect(body.data.students[0].studentId).toBe(studentA._id.toString());
  });

  it('counts a student as active this week only if their Progress was updated in the last 7 days', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseFor(instructorId);
    const lesson = await Lesson.create({
      course: course._id,
      title: 'L1',
      description: 'd',
      videoUrl: 'https://x.com/1.mp4',
      order: 0,
    });
    const activeStudent = await createStudent();
    const staleStudent = await createStudent();

    await Enrollment.create([
      { student: activeStudent._id, course: course._id },
      { student: staleStudent._id, course: course._id },
    ]);
    await Progress.create({
      student: activeStudent._id,
      course: course._id,
      completedLessons: [lesson._id],
    });
    const staleProgress = await Progress.create({
      student: staleStudent._id,
      course: course._id,
      completedLessons: [],
    });
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setUTCDate(twentyDaysAgo.getUTCDate() - 20);
    // { timestamps: false } is required here — mongoose's timestamps plugin otherwise
    // overwrites updatedAt back to "now" on every update, defeating this backfill.
    await Progress.updateOne(
      { _id: staleProgress._id },
      { updatedAt: twentyDaysAgo },
      { timestamps: false }
    );

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });
    const response = await getInstructorStudents();
    const body = await response.json();

    expect(body.data.activeThisWeek).toBe(1);
  });

  it('computes completionRate as the share of enrollments at 100% progress', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseFor(instructorId);
    const lesson = await Lesson.create({
      course: course._id,
      title: 'L1',
      description: 'd',
      videoUrl: 'https://x.com/1.mp4',
      order: 0,
    });
    const doneStudent = await createStudent();
    const inProgressStudent = await createStudent();

    await Enrollment.create([
      { student: doneStudent._id, course: course._id },
      { student: inProgressStudent._id, course: course._id },
    ]);
    await Progress.create({
      student: doneStudent._id,
      course: course._id,
      completedLessons: [lesson._id],
    });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });
    const response = await getInstructorStudents();
    const body = await response.json();

    expect(body.data.completionRate).toBe(50);
  });
});
