import { createConnection } from '@/database/db';
import Course, { CourseStatus } from '@/database/models/course.schema';
// Registers the "Category" model so `.populate('category')` below can resolve
// it — Mongoose needs the schema registered before populate runs, regardless
// of whether anything else in this request touched the Category module first.
import '@/database/models/category';
import { Lesson } from '@/database/models/lesson';
import { Enrollment } from '@/database/models/enrollment.model';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/appError';
import { createCourseSchema, updateCourseSchema } from '@/lib/validate/course.schema';
import { requireAuth, requirePermission } from '../../../../middleware/auth.middleware';
import { assertCourseOwnership, ownsCourse } from '@/lib/rbac/ownership';
import { bypassesOwnership } from '@/lib/rbac/permissions';

export async function createCourse(req: Request) {
  await createConnection();
  const session = await requirePermission('course:create');

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
  // Super Admin/Admin see every course (draft or published); everyone else — including
  // Instructor — only sees the published catalog here. Scoping this to "my own drafts"
  // for instructors is a listing/dashboard change, out of scope for this phase.
  const canSeeAllCourses = bypassesOwnership(session?.user?.role);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.max(1, Number(searchParams.get('limit')) || 10);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const filter: Record<string, unknown> = { isDeleted: false };
  if (!canSeeAllCourses) {
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
  const session = await requirePermission('course:delete');

  const course = await Course.findById(id);
  if (!course || course.isDeleted) {
    throw new AppError('Course not found', 404);
  }
  assertCourseOwnership(course, session);

  course.isDeleted = true;
  await course.save();

  return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
};

export const updateCourse = async (req: Request, id: string) => {
  const session = await requirePermission('course:update');

  const course = await Course.findOne({ _id: id, isDeleted: false });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  assertCourseOwnership(course, session);

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

  // Super Admin/Admin, or the instructor who owns this course, can view its lessons
  // without being enrolled. Everyone else (students, other instructors) must be enrolled.
  if (!ownsCourse(course, session)) {
    const enrolled = await Enrollment.findOne({ student: session.user.id, course: id });
    if (!enrolled) {
      throw new AppError('You must be enrolled to view this content', 403);
    }
  }

  const lessons = await Lesson.find({ course: id }).sort('order');
  return NextResponse.json({ data: lessons }, { status: 200 });
};
