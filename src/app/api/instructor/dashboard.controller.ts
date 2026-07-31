import mongoose from 'mongoose';
import { createConnection } from '@/database/db';
import Course, { CourseStatus } from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { NextResponse } from 'next/server';
import { requirePermission } from '../../../../middleware/auth.middleware';

export async function getInstructorDashboard() {
  await createConnection();
  const session = await requirePermission('instructor:overview');
  const instructorId = new mongoose.Types.ObjectId(session.user.id);

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
          status: 1,
          enrollmentCount: 1,
          revenue: 1,
          averageRating: 1,
          completionRate: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]),
  ]);

  const courseIds = courses.map((c) => c._id);
  const publishedCount = courses.filter((c) => c.status === CourseStatus.PUBLISHED).length;
  const draftCount = courses.filter((c) => c.status === CourseStatus.DRAFT).length;

  const [distinctStudents] = await Promise.all([
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$student' } },
      { $count: 'count' },
    ]),
  ]);

  const totalRevenue = coursePerformance.reduce((sum, c) => sum + (c.revenue ?? 0), 0);

  return NextResponse.json(
    {
      data: {
        publishedCount,
        draftCount,
        totalRevenue,
        enrolledStudentsCount: distinctStudents[0]?.count ?? 0,
        coursePerformance,
      },
    },
    { status: 200 }
  );
}
