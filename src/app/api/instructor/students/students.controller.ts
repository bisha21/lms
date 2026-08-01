import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Progress } from '@/database/models/progress.model';
import { Payment, PaymentStatus } from '@/database/models/payment.model';
import { requirePermission } from '../../../../../middleware/auth.middleware';

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
    progressDocs.map((p) => [`${p.student.toString()}_${p.course.toString()}`, p.completedLessons.length])
  );

  const studentIds = [...new Set(enrollments.map((e) => e.student._id.toString()))].map(
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

  const byStudent = new Map<
    string,
    {
      _id: string;
      username: string;
      email: string;
      profileImage?: string;
      enrolledCourses: { courseId: string; title: string; enrolledAt: Date; percent: number }[];
      totalSpent: number;
    }
  >();

  for (const enrollment of enrollments) {
    const student = enrollment.student;
    const course = enrollment.course;
    if (!student?._id || !course?._id) continue;
    const studentKey = student._id.toString();
    const courseKey = course._id.toString();

    if (!byStudent.has(studentKey)) {
      byStudent.set(studentKey, {
        _id: studentKey,
        username: student.username ?? 'Unknown',
        email: student.email ?? '',
        profileImage: student.profileImage,
        enrolledCourses: [],
        totalSpent: spentByStudent.get(studentKey) ?? 0,
      });
    }

    const totalLessons = lessonCountByCourse.get(courseKey) ?? 0;
    const completed = progressByKey.get(`${studentKey}_${courseKey}`) ?? 0;
    const percent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

    byStudent.get(studentKey)!.enrolledCourses.push({
      courseId: courseKey,
      title: course.title ?? 'Untitled course',
      enrolledAt: enrollment.enrolledAt,
      percent,
    });
  }

  const students = [...byStudent.values()].sort((a, b) => {
    const aLatest = Math.max(...a.enrolledCourses.map((c) => new Date(c.enrolledAt).getTime()));
    const bLatest = Math.max(...b.enrolledCourses.map((c) => new Date(c.enrolledAt).getTime()));
    return bLatest - aLatest;
  });

  return NextResponse.json({ data: students }, { status: 200 });
}
