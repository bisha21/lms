import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Progress } from '@/database/models/progress.model';
import { getContinueLearning } from '@/app/api/progress/progress.controller';
import { mockGetServerSession } from '../setup';

async function createCourseWithLessons(title: string, lessonCount: number) {
  const category = await Category.create({ name: 'Programming' });
  const course = await Course.create({
    title,
    courseDescription: 'desc',
    duration: '1h',
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
  return { course, lessons };
}

describe('getContinueLearning', () => {
  const studentId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await createConnection();
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });
  });

  it('excludes a never-started course (0%)', async () => {
    const { course } = await createCourseWithLessons('Untouched', 3);
    await Enrollment.create({ student: studentId, course: course._id });

    const response = await getContinueLearning();
    const body = await response.json();

    expect(body.data).toHaveLength(0);
  });

  it('excludes a fully completed course (100%)', async () => {
    const { course, lessons } = await createCourseWithLessons('Done', 2);
    await Enrollment.create({ student: studentId, course: course._id });
    await Progress.create({
      student: studentId,
      course: course._id,
      completedLessons: lessons.map((l) => l._id),
    });

    const response = await getContinueLearning();
    const body = await response.json();

    expect(body.data).toHaveLength(0);
  });

  it('includes an in-progress course with the right percent', async () => {
    const { course, lessons } = await createCourseWithLessons('In Progress', 4);
    await Enrollment.create({ student: studentId, course: course._id });
    await Progress.create({
      student: studentId,
      course: course._id,
      completedLessons: [lessons[0]._id],
    });

    const response = await getContinueLearning();
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].course.title).toBe('In Progress');
    expect(body.data[0].percent).toBe(25);
  });

  it("never includes another student's progress", async () => {
    const { course, lessons } = await createCourseWithLessons('Someone Else', 2);
    const otherStudent = new mongoose.Types.ObjectId();
    await Enrollment.create({ student: otherStudent, course: course._id });
    await Progress.create({ student: otherStudent, course: course._id, completedLessons: [lessons[0]._id] });

    const response = await getContinueLearning();
    const body = await response.json();

    expect(body.data).toHaveLength(0);
  });

  it('orders by most recently updated Progress first', async () => {
    const { course: courseA, lessons: lessonsA } = await createCourseWithLessons('Course A', 4);
    const { course: courseB, lessons: lessonsB } = await createCourseWithLessons('Course B', 4);
    await Enrollment.create([
      { student: studentId, course: courseA._id },
      { student: studentId, course: courseB._id },
    ]);

    // Course A touched first, then Course B touched later — B should sort first.
    await Progress.create({ student: studentId, course: courseA._id, completedLessons: [lessonsA[0]._id] });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await Progress.create({ student: studentId, course: courseB._id, completedLessons: [lessonsB[0]._id] });

    const response = await getContinueLearning();
    const body = await response.json();

    expect(body.data.map((d: { course: { title: string } }) => d.course.title)).toEqual([
      'Course B',
      'Course A',
    ]);
  });
});
