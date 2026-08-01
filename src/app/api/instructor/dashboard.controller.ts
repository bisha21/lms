import mongoose from 'mongoose';
import { createConnection } from '@/database/db';
import Course, { CourseStatus } from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Review } from '@/database/models/review';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../middleware/auth.middleware';

const TREND_DAYS = 30;
const ACTIVITY_LIMIT = 8;

function last30DaysSkeleton() {
  const days: string[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export async function getInstructorDashboard() {
  await createConnection();
  const session = await requirePermission('instructor:overview');
  const instructorId = new mongoose.Types.ObjectId(session.user.id);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - TREND_DAYS);
  since.setUTCHours(0, 0, 0, 0);

  const [courses, coursePerformance] = await Promise.all([
    Course.find({ instructor: instructorId, isDeleted: false }).select('status'),
    Course.aggregate([
      { $match: { instructor: instructorId, isDeleted: false } },
      {
        $lookup: { from: 'enrollments', localField: '_id', foreignField: 'course', as: 'enrollments' },
      },
      {
        $lookup: {
          from: 'payments',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $and: [{ $eq: ['$course', '$$courseId'] }, { $eq: ['$status', 'completed'] }] },
              },
            },
          ],
          as: 'completedPayments',
        },
      },
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'course', as: 'reviews' } },
      { $lookup: { from: 'lessons', localField: '_id', foreignField: 'course', as: 'lessons' } },
      { $lookup: { from: 'progresses', localField: '_id', foreignField: 'course', as: 'progressDocs' } },
      {
        $addFields: {
          enrollmentCount: { $size: '$enrollments' },
          revenue: { $sum: '$completedPayments.amount' },
          averageRating: {
            $cond: [
              { $gt: [{ $size: '$reviews' }, 0] },
              { $round: [{ $avg: '$reviews.rating' }, 1] },
              null,
            ],
          },
          totalLessons: { $size: '$lessons' },
          completedLessonsSum: {
            $sum: { $map: { input: '$progressDocs', as: 'p', in: { $size: '$$p.completedLessons' } } },
          },
        },
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $and: [{ $gt: ['$enrollmentCount', 0] }, { $gt: ['$totalLessons', 0] }] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$completedLessonsSum', { $multiply: ['$enrollmentCount', '$totalLessons'] }] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $project: {
          title: 1,
          slug: 1,
          thumbnail: 1,
          status: 1,
          enrollmentCount: 1,
          revenue: 1,
          averageRating: 1,
          completionRate: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]),
  ]);

  const courseIds = courses.map((c) => c._id);
  const publishedCount = courses.filter((c) => c.status === CourseStatus.PUBLISHED).length;
  const draftCount = courses.filter((c) => c.status === CourseStatus.DRAFT).length;

  const [distinctStudents, revenueByDay, enrollmentsByDay, recentEnrollments, recentReviews] = await Promise.all([
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$student' } },
      { $count: 'count' },
    ]),
    Payment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          status: PaymentStatus.Completed,
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
        },
      },
    ]),
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, enrolledAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Enrollment.find({ course: { $in: courseIds } })
      .sort({ enrolledAt: -1 })
      .limit(ACTIVITY_LIMIT)
      .populate('student', 'username')
      .populate('course', 'title'),
    Review.find({ course: { $in: courseIds } })
      .sort({ createdAt: -1 })
      .limit(ACTIVITY_LIMIT)
      .populate('student', 'username')
      .populate('course', 'title'),
  ]);

  const revenueByDayMap = new Map(revenueByDay.map((d) => [d._id as string, d.amount as number]));
  const enrollmentsByDayMap = new Map(enrollmentsByDay.map((d) => [d._id as string, d.count as number]));
  const days = last30DaysSkeleton();
  const revenueTrend = days.map((date) => ({ date, amount: revenueByDayMap.get(date) ?? 0 }));
  const enrollmentTrend = days.map((date) => ({ date, count: enrollmentsByDayMap.get(date) ?? 0 }));

  const ratedCourses = coursePerformance.filter((c) => typeof c.averageRating === 'number');
  const averageRating =
    ratedCourses.length > 0
      ? Math.round((ratedCourses.reduce((sum, c) => sum + c.averageRating, 0) / ratedCourses.length) * 10) / 10
      : null;
  const completedCourses = coursePerformance.filter((c) => typeof c.completionRate === 'number');
  const averageCompletionRate =
    completedCourses.length > 0
      ? Math.round(completedCourses.reduce((sum, c) => sum + c.completionRate, 0) / completedCourses.length)
      : null;

  const totalRevenue = coursePerformance.reduce((sum, c) => sum + (c.revenue ?? 0), 0);

  type Activity = { type: 'enrollment' | 'review'; courseTitle: string; actor: string; date: Date; rating?: number };
  const activity: Activity[] = [
    ...recentEnrollments.map((e) => ({
      type: 'enrollment' as const,
      courseTitle: (e.course as unknown as { title?: string })?.title ?? 'a course',
      actor: (e.student as unknown as { username?: string })?.username ?? 'A student',
      date: e.enrolledAt,
    })),
    ...recentReviews.map((r) => ({
      type: 'review' as const,
      courseTitle: (r.course as unknown as { title?: string })?.title ?? 'a course',
      actor: (r.student as unknown as { username?: string })?.username ?? 'A student',
      date: r.createdAt,
      rating: r.rating,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, ACTIVITY_LIMIT);

  return NextResponse.json(
    {
      data: {
        publishedCount,
        draftCount,
        totalRevenue,
        enrolledStudentsCount: distinctStudents[0]?.count ?? 0,
        averageRating,
        averageCompletionRate,
        revenueTrend,
        enrollmentTrend,
        recentActivity: activity,
        coursePerformance,
      },
    },
    { status: 200 }
  );
}
