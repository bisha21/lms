import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { requirePermission } from '../../../../../middleware/auth.middleware';

const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

interface PopulatedCourse {
  _id: mongoose.Types.ObjectId;
  title?: string;
}

export async function getInstructorRevenue(req: Request) {
  await createConnection();
  const session = await requirePermission('instructor:overview');
  const instructorId = new mongoose.Types.ObjectId(session.user.id);

  const { searchParams } = new URL(req.url);
  const range = RANGE_DAYS[searchParams.get('range') ?? '30d'] ?? 30;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.max(1, Number(searchParams.get('limit')) || 10);
  const status = searchParams.get('status');

  const courseIds = (await Course.find({ instructor: instructorId, isDeleted: false }).select('_id')).map(
    (c) => c._id
  );

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - range);
  since.setUTCHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const paymentFilter: Record<string, unknown> = { course: { $in: courseIds } };
  if (status && ['completed', 'pending', 'failed'].includes(status)) {
    paymentFilter.status = status;
  }

  const [completedStats, monthStats, revenueByDay, totalCount, payments] = await Promise.all([
    Payment.aggregate([
      { $match: { course: { $in: courseIds }, status: PaymentStatus.Completed } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          status: PaymentStatus.Completed,
          createdAt: { $gte: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
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
    Payment.countDocuments(paymentFilter),
    Payment.find(paymentFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate<{ course: PopulatedCourse }>('course', 'title'),
  ]);

  const revenueByDayMap = new Map(revenueByDay.map((d) => [d._id as string, d.amount as number]));
  const revenueTrend: { date: string; amount: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    revenueTrend.push({ date: key, amount: revenueByDayMap.get(key) ?? 0 });
  }

  const totalEarnings = completedStats[0]?.total ?? 0;
  const transactionCount = completedStats[0]?.count ?? 0;

  return NextResponse.json(
    {
      data: {
        totalEarnings,
        thisMonthEarnings: monthStats[0]?.total ?? 0,
        transactionCount,
        averageOrderValue: transactionCount > 0 ? Math.round((totalEarnings / transactionCount) * 100) / 100 : 0,
        revenueTrend,
        payments: payments.map((p) => ({
          _id: p._id.toString(),
          courseTitle: p.course?.title ?? 'Deleted course',
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          createdAt: p.get('createdAt'),
        })),
      },
      meta: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
    },
    { status: 200 }
  );
}
