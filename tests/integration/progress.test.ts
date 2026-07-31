import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { getProgress, markLessonComplete } from '@/app/api/progress/progress.controller';
import { getLessonContent } from '@/app/api/lessons/lesson.controller';
import { mockGetServerSession } from '../setup';

describe('progress controller', () => {
  const studentId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await createConnection();
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });
  });

  async function setupCourseWithLessons(lessonCount: number) {
    const category = await Category.create({ name: 'Programming' });
    // A real (distinct) instructor — a course with none is treated by ownsCourse() as
    // "ownerless, anyone may access," which would let the enrolled student bypass the
    // Enrollment check entirely and skip the lastViewedLesson side effect being tested.
    const course = await Course.create({
      title: `Course With Lessons ${new mongoose.Types.ObjectId()}`,
      courseDescription: 'desc',
      duration: '5h',
      category: category._id,
      instructor: new mongoose.Types.ObjectId(),
      status: 'published',
    });
    const lessons = await Lesson.create(
      Array.from({ length: lessonCount }, (_, i) => ({
        course: course._id,
        title: `Lesson ${i + 1}`,
        description: 'desc',
        videoUrl: 'https://example.com/video.mp4',
        order: i,
      })),
    );
    await Enrollment.create({ student: studentId, course: course._id });
    return { course, lessons };
  }

  it('rejects progress access when not enrolled', async () => {
    const category = await Category.create({ name: 'Programming' });
    const course = await Course.create({
      title: 'Not Enrolled Course',
      courseDescription: 'desc',
      duration: '1h',
      category: category._id,
      status: 'published',
    });

    await expect(getProgress(course._id.toString())).rejects.toMatchObject({ statusCode: 403 });
  });

  it('marking the same lesson complete twice does not duplicate it (idempotent $addToSet)', async () => {
    const { course, lessons } = await setupCourseWithLessons(3);
    const lessonId = lessons[0]._id.toString();

    await markLessonComplete(course._id.toString(), lessonId);
    await markLessonComplete(course._id.toString(), lessonId);

    const response = await getProgress(course._id.toString());
    const body = await response.json();

    expect(body.data.completedLessons).toHaveLength(1);
    expect(body.data.totalLessons).toBe(3);
    expect(body.data.percent).toBe(33);
  });

  it('computes percent across multiple completed lessons', async () => {
    const { course, lessons } = await setupCourseWithLessons(4);

    await markLessonComplete(course._id.toString(), lessons[0]._id.toString());
    await markLessonComplete(course._id.toString(), lessons[1]._id.toString());

    const response = await getProgress(course._id.toString());
    const body = await response.json();

    expect(body.data.completedLessons).toHaveLength(2);
    expect(body.data.percent).toBe(50);
  });

  it('lastViewedLesson persists across sessions/devices — a later, independent getProgress call sees it', async () => {
    const { course, lessons } = await setupCourseWithLessons(3);

    // "Session A": views the second lesson.
    await getLessonContent(lessons[1]._id.toString());

    // "Session B": a completely independent later call (no shared in-memory state) —
    // simulates the same user reopening the course on another device.
    const response = await getProgress(course._id.toString());
    const body = await response.json();

    expect(body.data.lastViewedLesson.toString()).toBe(lessons[1]._id.toString());
  });

  it('lastViewedLesson advances as the student views further lessons', async () => {
    const { course, lessons } = await setupCourseWithLessons(3);

    await getLessonContent(lessons[0]._id.toString());
    await getLessonContent(lessons[2]._id.toString());

    const response = await getProgress(course._id.toString());
    const body = await response.json();

    expect(body.data.lastViewedLesson.toString()).toBe(lessons[2]._id.toString());
  });

  it('is null when the student has never viewed a lesson yet', async () => {
    const { course } = await setupCourseWithLessons(2);

    const response = await getProgress(course._id.toString());
    const body = await response.json();

    expect(body.data.lastViewedLesson).toBeNull();
  });
});
