import mongoose from 'mongoose';
import { createConnection } from '@/database/db';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Progress } from '@/database/models/progress.model';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { requireAuth } from '../../../../middleware/auth.middleware';

const CONTINUE_LEARNING_LIMIT = 5;

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
    {
      data: {
        completedLessons,
        totalLessons,
        percent,
        lastViewedLesson: progress?.lastViewedLesson ?? null,
      },
    },
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

// "Continue Learning" — in-progress (0% < percent < 100%) courses for the current student,
// most recently active first. A course with no Progress doc at all (never opened) has
// percent 0 and is correctly excluded, same as a fully completed course.
export async function getContinueLearning() {
  await createConnection();
  const session = await requireAuth();
  const studentId = new mongoose.Types.ObjectId(session.user.id);

  const items = await Enrollment.aggregate([
    { $match: { student: studentId } },
    {
      $lookup: {
        from: 'progresses',
        let: { courseId: '$course', studentId: '$student' },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ['$course', '$$courseId'] }, { $eq: ['$student', '$$studentId'] }] },
            },
          },
        ],
        as: 'progress',
      },
    },
    { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'lessons', localField: 'course', foreignField: 'course', as: 'lessons' } },
    {
      $addFields: {
        totalLessons: { $size: '$lessons' },
        completedCount: { $size: { $ifNull: ['$progress.completedLessons', []] } },
      },
    },
    {
      $addFields: {
        percent: {
          $cond: [
            { $gt: ['$totalLessons', 0] },
            { $round: [{ $multiply: [{ $divide: ['$completedCount', '$totalLessons'] }, 100] }, 0] },
            0,
          ],
        },
      },
    },
    { $match: { percent: { $gt: 0, $lt: 100 } } },
    { $sort: { 'progress.updatedAt': -1 } },
    { $limit: CONTINUE_LEARNING_LIMIT },
    { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    {
      $project: {
        _id: 0,
        course: { _id: '$course._id', title: '$course.title', slug: '$course.slug', thumbnail: '$course.thumbnail' },
        percent: 1,
        lastViewedLesson: '$progress.lastViewedLesson',
      },
    },
  ]);

  return NextResponse.json({ data: items }, { status: 200 });
}
