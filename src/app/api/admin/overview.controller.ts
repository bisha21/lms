import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { requireAuth } from '../../../../middleware/auth.middleware';

export async function getOverview() {
  await createConnection();
  const session = await requireAuth();
  if (session.user.role !== 'admin') {
    throw new AppError('You dont have permission to perform this action', 403);
  }

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
