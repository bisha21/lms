import { createConnection } from '@/database/db';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Progress } from '@/database/models/progress.model';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { requireAuth } from '../../../../middleware/auth.middleware';

async function assertEnrolled(studentId: string, courseId: string) {
  const enrolled = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrolled) {
    throw new AppError('You must be enrolled in this course', 403);
  }
}

export async function getProgress(courseId: string) {
  await createConnection();
  const session = await requireAuth();
  await assertEnrolled(session.user.id, courseId);

  const [progress, totalLessons] = await Promise.all([
    Progress.findOne({ student: session.user.id, course: courseId }),
    Lesson.countDocuments({ course: courseId }),
  ]);

  const completedLessons = progress?.completedLessons ?? [];
  const percent = totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

  return NextResponse.json(
    { data: { completedLessons, totalLessons, percent } },
    { status: 200 }
  );
}

export async function markLessonComplete(courseId: string, lessonId: string) {
  await createConnection();
  const session = await requireAuth();
  await assertEnrolled(session.user.id, courseId);

  const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
  if (!lesson) {
    throw new AppError('Lesson not found in this course', 404);
  }

  const progress = await Progress.findOneAndUpdate(
    { student: session.user.id, course: courseId },
    { $addToSet: { completedLessons: lessonId } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ data: progress }, { status: 200 });
}
