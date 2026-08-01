import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Progress } from '@/database/models/progress.model';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { requirePermission } from '../../../../../middleware/auth.middleware';

const ACTIVE_WINDOW_DAYS = 7;

interface PopulatedStudent {
  _id: mongoose.Types.ObjectId;
  username?: string;
  email?: string;
  profileImage?: string;
}
interface PopulatedCourse {
  _id: mongoose.Types.ObjectId;
  title?: string;
}
interface PopulatedEnrollment {
  _id: mongoose.Types.ObjectId;
  student: PopulatedStudent;
  course: PopulatedCourse;
  enrolledAt: Date;
}

export async function getInstructorStudents() {
  await createConnection();
  const session = await requirePermission('instructor:overview');
  const instructorId = new mongoose.Types.ObjectId(session.user.id);

  const courseIds = (await Course.find({ instructor: instructorId, isDeleted: false }).select('_id')).map(
    (c) => c._id
  );

  const [enrollmentDocs, lessonCounts, progressDocs] = await Promise.all([
    Enrollment.find({ course: { $in: courseIds } })
      .sort({ enrolledAt: -1 })
      .populate('student', 'username email profileImage')
      .populate('course', 'title'),
    Lesson.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]),
    Progress.find({ course: { $in: courseIds } }),
  ]);
  const enrollments = enrollmentDocs as unknown as PopulatedEnrollment[];

  const lessonCountByCourse = new Map(lessonCounts.map((l) => [l._id.toString(), l.count as number]));
  const progressByKey = new Map(
    progressDocs.map((p) => [
      `${p.student.toString()}_${p.course.toString()}`,
      { completed: p.completedLessons.length, updatedAt: p.get('updatedAt') as Date | undefined },
    ])
  );

  const studentIds = [...new Set(enrollments.map((e) => e.student?._id?.toString()).filter(Boolean))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  const payments = await Payment.find({
    student: { $in: studentIds },
    course: { $in: courseIds },
    status: PaymentStatus.Completed,
  });
  const spentByStudent = new Map<string, number>();
  for (const payment of payments) {
    const key = payment.student.toString();
    spentByStudent.set(key, (spentByStudent.get(key) ?? 0) + payment.amount);
  }

  const activeSince = new Date();
  activeSince.setUTCDate(activeSince.getUTCDate() - ACTIVE_WINDOW_DAYS);

  const rows = enrollments
    .filter((e) => e.student?._id && e.course?._id)
    .map((enrollment) => {
      const studentKey = enrollment.student._id.toString();
      const courseKey = enrollment.course._id.toString();
      const totalLessons = lessonCountByCourse.get(courseKey) ?? 0;
      const progress = progressByKey.get(`${studentKey}_${courseKey}`);
      const percent = totalLessons > 0 ? Math.round(((progress?.completed ?? 0) / totalLessons) * 100) : 0;
      const lastActive = progress?.updatedAt ?? enrollment.enrolledAt;

      return {
        enrollmentId: enrollment._id.toString(),
        studentId: studentKey,
        username: enrollment.student.username ?? 'Unknown',
        email: enrollment.student.email ?? '',
        profileImage: enrollment.student.profileImage,
        courseId: courseKey,
        courseTitle: enrollment.course.title ?? 'Untitled course',
        percent,
        lastActive,
        enrolledAt: enrollment.enrolledAt,
        totalSpent: spentByStudent.get(studentKey) ?? 0,
      };
    });

  const totalStudents = new Set(rows.map((r) => r.studentId)).size;
  const activeThisWeek = new Set(
    rows.filter((r) => new Date(r.lastActive) >= activeSince).map((r) => r.studentId)
  ).size;
  const averageProgress =
    rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.percent, 0) / rows.length) : 0;
  const completionRate =
    rows.length > 0 ? Math.round((rows.filter((r) => r.percent === 100).length / rows.length) * 100) : 0;

  return NextResponse.json(
    {
      data: {
        students: rows,
        totalStudents,
        activeThisWeek,
        averageProgress,
        completionRate,
      },
    },
    { status: 200 }
  );
}
