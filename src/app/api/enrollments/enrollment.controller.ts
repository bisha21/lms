import { createConnection } from '@/database/db';
import Course, { CourseStatus } from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { requireAuth } from '../../../../middleware/auth.middleware';

export async function enrollInCourse(req: Request) {
  await createConnection();
  const session = await requireAuth();

  const { courseId } = await req.json();
  if (!courseId) {
    throw new AppError('courseId is required', 400);
  }

  const course = await Course.findOne({
    _id: courseId,
    status: CourseStatus.PUBLISHED,
    isDeleted: false,
  });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  if (course.coursePrice > 0) {
    throw new AppError('This course requires payment — use the checkout endpoint', 400);
  }

  const existing = await Enrollment.findOne({ student: session.user.id, course: courseId });
  if (existing) {
    return NextResponse.json({ message: 'Already enrolled', data: existing }, { status: 200 });
  }

  const enrollment = await Enrollment.create({ student: session.user.id, course: courseId });
  return NextResponse.json({ message: 'Enrolled successfully', data: enrollment }, { status: 201 });
}

export async function getMyEnrollments() {
  await createConnection();
  const session = await requireAuth();

  const enrollments = await Enrollment.find({ student: session.user.id }).populate({
    path: 'course',
    populate: { path: 'category' },
  });

  return NextResponse.json({ data: enrollments }, { status: 200 });
}
