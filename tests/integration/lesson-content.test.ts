import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Progress } from '@/database/models/progress.model';
import { Section } from '@/database/models/section';
import { getLessonContent } from '@/app/api/lessons/lesson.controller';
import { mockGetServerSession } from '../setup';

async function createCourseWithLesson(instructorId?: string) {
  const category = await Category.create({ name: 'Programming' });
  // Always set a real instructor — a course with none is treated by ownsCourse() as
  // "ownerless, anyone may access" (an intentional accommodation for legacy data), which
  // would make every 403 test below accidentally pass for the wrong reason.
  const course = await Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    status: 'published',
    instructor: instructorId ?? new mongoose.Types.ObjectId().toString(),
  });
  const section = await Section.create({ course: course._id, title: 'Section 1', order: 0 });
  const lesson = await Lesson.create({
    course: course._id,
    section: section._id,
    title: 'Lesson 1',
    description: 'Lesson description',
    videoUrl: 'https://cdn.example.com/secret-lesson.mp4',
    order: 0,
  });
  return { course, lesson };
}

describe('GET /api/lessons/:id — getLessonContent', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('rejects a non-enrolled, non-owner user with 403 (acceptance criterion)', async () => {
    const { lesson } = await createCourseWithLesson();
    mockGetServerSession.mockResolvedValue({
      user: { id: new mongoose.Types.ObjectId().toString(), role: 'student' },
    });

    await expect(getLessonContent(lesson._id.toString())).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('allows an enrolled student and returns the full lesson content', async () => {
    const { course, lesson } = await createCourseWithLesson();
    const studentId = new mongoose.Types.ObjectId().toString();
    await Enrollment.create({ student: studentId, course: course._id });
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });

    const response = await getLessonContent(lesson._id.toString());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.videoUrl).toBe('https://cdn.example.com/secret-lesson.mp4');
    expect(body.data.description).toBe('Lesson description');
  });

  it('updates the student\'s lastViewedLesson as a side effect', async () => {
    const { course, lesson } = await createCourseWithLesson();
    const studentId = new mongoose.Types.ObjectId().toString();
    await Enrollment.create({ student: studentId, course: course._id });
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });

    await getLessonContent(lesson._id.toString());

    const progress = await Progress.findOne({ student: studentId, course: course._id });
    expect(progress?.lastViewedLesson?.toString()).toBe(lesson._id.toString());
  });

  it('allows the owning instructor without any Enrollment record, and does not touch Progress for them', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const { lesson } = await createCourseWithLesson(instructorId);
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await getLessonContent(lesson._id.toString());
    expect(response.status).toBe(200);

    expect(await Progress.countDocuments({ student: instructorId })).toBe(0);
  });

  it.each([['super_admin'], ['admin']])('allows %s to preview without an Enrollment record', async (role) => {
    const { lesson } = await createCourseWithLesson();
    mockGetServerSession.mockResolvedValue({
      user: { id: new mongoose.Types.ObjectId().toString(), role },
    });

    const response = await getLessonContent(lesson._id.toString());
    expect(response.status).toBe(200);
  });

  it('rejects a different instructor who neither owns nor is enrolled in the course', async () => {
    const ownerInstructorId = new mongoose.Types.ObjectId().toString();
    const { lesson } = await createCourseWithLesson(ownerInstructorId);
    mockGetServerSession.mockResolvedValue({
      user: { id: new mongoose.Types.ObjectId().toString(), role: 'instructor' },
    });

    await expect(getLessonContent(lesson._id.toString())).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('404s for a non-existent lesson id', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'someone', role: 'student' } });

    await expect(
      getLessonContent(new mongoose.Types.ObjectId().toString()),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
