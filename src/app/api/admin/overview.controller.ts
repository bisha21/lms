import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { Review } from '@/database/models/review';
import User, { Role } from '@/database/models/user.schema';
import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../middleware/auth.middleware';

const SALES_TREND_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 10;

interface ActivityItem {
  type: 'enrollment' | 'payment' | 'review' | 'course';
  message: string;
  date: Date;
}

export async function getOverview() {
  await createConnection();
  await requirePermission('admin:overview');

  const courses = await Course.find({ isDeleted: false }).select('title coursePrice');

  const [enrollmentCounts, revenueByCourse] = await Promise.all([
    Enrollment.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: PaymentStatus.Completed } },
      { $group: { _id: '$course', revenue: { $sum: '$amount' } } },
    ]),
  ]);

  const enrollmentMap = new Map(
    enrollmentCounts.map((e) => [e._id?.toString(), e.count as number])
  );
  const revenueMap = new Map(
    revenueByCourse.map((r) => [r._id?.toString(), r.revenue as number])
  );

  const data = courses.map((course) => ({
    _id: course._id,
    title: course.title,
    coursePrice: course.coursePrice,
    enrollmentCount: enrollmentMap.get(course._id.toString()) ?? 0,
    revenue: revenueMap.get(course._id.toString()) ?? 0,
  }));

  return NextResponse.json({ data }, { status: 200 });
}

// Powers the /admin dashboard. Kept separate from getOverview() (which still backs
// /admin/students) so that page's existing per-course table isn't touched by this.
export async function getAdminDashboard() {
  await createConnection();
  await requirePermission('admin:overview');

  const since = new Date(Date.now() - SALES_TREND_DAYS * 24 * 60 * 60 * 1000);

  const [
    courseCount,
    studentCount,
    instructorCount,
    [revenueResult],
    salesTrend,
    recentEnrollments,
    recentPayments,
    recentReviews,
    recentCourses,
  ] = await Promise.all([
    Course.countDocuments({ isDeleted: false }),
    User.countDocuments({ role: Role.STUDENT }),
    User.countDocuments({ role: Role.INSTRUCTOR }),
    Payment.aggregate([
      { $match: { status: PaymentStatus.Completed } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: PaymentStatus.Completed, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Enrollment.find()
      .sort('-enrolledAt')
      .limit(RECENT_ACTIVITY_LIMIT)
      .populate('student', 'username')
      .populate('course', 'title'),
    Payment.find({ status: PaymentStatus.Completed })
      .sort('-createdAt')
      .limit(RECENT_ACTIVITY_LIMIT)
      .populate('student', 'username')
      .populate('course', 'title'),
    Review.find()
      .sort('-createdAt')
      .limit(RECENT_ACTIVITY_LIMIT)
      .populate('student', 'username')
      .populate('course', 'title'),
    Course.find({ isDeleted: false })
      .sort('-createdAt')
      .limit(RECENT_ACTIVITY_LIMIT)
      .select('title createdAt'),
  ]);

  const activity: ActivityItem[] = [
    ...recentEnrollments.map((e) => ({
      type: 'enrollment' as const,
      message: `${e.student?.username ?? 'A student'} enrolled in ${e.course?.title ?? 'a course'}`,
      date: e.enrolledAt,
    })),
    ...recentPayments.map((p) => ({
      type: 'payment' as const,
      message: `${p.student?.username ?? 'A student'} purchased ${p.course?.title ?? 'a course'}`,
      date: p.createdAt,
    })),
    ...recentReviews.map((r) => ({
      type: 'review' as const,
      message: `${r.student?.username ?? 'A student'} rated ${r.course?.title ?? 'a course'} ${r.rating}/5`,
      date: r.createdAt,
    })),
    ...recentCourses.map((c) => ({
      type: 'course' as const,
      message: `New course published: ${c.title}`,
      date: c.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);

  return NextResponse.json(
    {
      data: {
        courseCount,
        studentCount,
        instructorCount,
        totalRevenue: revenueResult?.total ?? 0,
        salesTrend: salesTrend.map((s) => ({ date: s._id as string, revenue: s.revenue as number })),
        recentActivity: activity,
      },
    },
    { status: 200 }
  );
}
