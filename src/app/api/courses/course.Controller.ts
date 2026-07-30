import { createConnection } from '@/database/db';
import Course, { CourseStatus } from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { Enrollment } from '@/database/models/enrollment.model';
import { NextResponse } from 'next/server';
// @ts-expect-error - next-auth v4's type declarations don't resolve this named export
// under this project's moduleResolution, though it exists at runtime.
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AppError } from '@/lib/appError';
import { createCourseSchema, updateCourseSchema } from '@/lib/validate/course.schema';
import { requireAuth } from '../../../../middleware/auth.middleware';

async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (session.user.role !== 'admin') {
    throw new AppError('You dont have permission to perform this action', 403);
  }
  return session;
}

function assertOwnership(
  course: { instructor?: { equals: (id: string) => boolean } },
  userId: string
) {
  if (course.instructor && !course.instructor.equals(userId)) {
    throw new AppError('You do not own this course', 403);
  }
}

export async function createCourse(req: Request) {
  await createConnection();
  const session = await requireAdmin();

  const body = await req.json();
  const data = createCourseSchema.parse(body);

  const existingCourse = await Course.findOne({ title: data.title });
  if (existingCourse) {
    throw new AppError('Course already exists', 400);
  }

  const newCourse = await Course.create({
    ...data,
    instructor: session.user.id,
  });
  return NextResponse.json({ data: newCourse }, { status: 201 });
}

export const getAllCourses = async (req: Request) => {
  await createConnection();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin';

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.max(1, Number(searchParams.get('limit')) || 10);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = { isDeleted: false };
  if (!isAdmin) {
    filter.status = CourseStatus.PUBLISHED;
  }
  if (category) {
    filter.category = category;
  }
  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Course.find(filter)
      .populate('category')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Course.countDocuments(filter),
  ]);

  return NextResponse.json({
    message: 'courses fetched!!',
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const getCourseBySlug = async (slug: string) => {
  const course = await Course.findOne({
    slug,
    status: CourseStatus.PUBLISHED,
    isDeleted: false,
  }).populate('category');
  if (!course) {
    throw new AppError('No course found', 404);
  }

  const lessons = await Lesson.find({ course: course._id })
    .select('title order durationSeconds')
    .sort('order');

  return NextResponse.json({ data: { course, lessons } }, { status: 200 });
};

export const getCourseById = async (id: string) => {
  const course = await Course.findOne({ _id: id, isDeleted: false }).populate('category');
  if (!course) {
    throw new AppError('No course found', 404);
  }
  return NextResponse.json({ data: course }, { status: 200 });
};

export const deleteCourse = async (id: string) => {
  const session = await requireAdmin();

  const course = await Course.findById(id);
  if (!course || course.isDeleted) {
    throw new AppError('Course not found', 404);
  }
  assertOwnership(course, session.user.id);

  course.isDeleted = true;
  await course.save();

  return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
};

export const updateCourse = async (req: Request, id: string) => {
  const session = await requireAdmin();

  const course = await Course.findOne({ _id: id, isDeleted: false });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  assertOwnership(course, session.user.id);

  const body = await req.json();
  const data = updateCourseSchema.parse(body);

  Object.assign(course, data);
  await course.save();

  return NextResponse.json({ data: course }, { status: 200 });
};

export const getCourseLessons = async (id: string) => {
  const session = await requireAuth();

  const course = await Course.findOne({ _id: id, isDeleted: false });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const isOwnerAdmin =
    session.user.role === 'admin' &&
    (!course.instructor || course.instructor.equals(session.user.id));

  if (!isOwnerAdmin) {
    const enrolled = await Enrollment.findOne({ student: session.user.id, course: id });
    if (!enrolled) {
      throw new AppError('You must be enrolled to view this content', 403);
    }
  }

  const lessons = await Lesson.find({ course: id }).sort('order');
  return NextResponse.json({ data: lessons }, { status: 200 });
};
