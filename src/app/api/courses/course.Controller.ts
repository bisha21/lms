import mongoose from 'mongoose';
import { createConnection } from '@/database/db';
import Course, { CourseStatus } from '@/database/models/course.schema';
// Registers the "Category"/"Section" models so `.populate()` below can resolve them —
// Mongoose needs the schema registered before populate runs, regardless of whether
// anything else in this request touched those modules first.
import '@/database/models/category';
import '@/database/models/section';
import User from '@/database/models/user.schema';
import { Lesson } from '@/database/models/lesson';
import { ISection } from '@/database/models/section';
import { Enrollment } from '@/database/models/enrollment.model';
import { Review } from '@/database/models/review';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/appError';
import { createCourseSchema, updateCourseSchema } from '@/lib/validate/course.schema';
import { requireAuth, requirePermission } from '../../../../middleware/auth.middleware';
import { assertCourseOwnership, ownsCourse } from '@/lib/rbac/ownership';
import { bypassesOwnership } from '@/lib/rbac/permissions';
import { uploadImageBuffer, uploadVideoBuffer } from '@/lib/cloudinary';

const COURSE_SORT_KEYS = ['newest', 'price', 'rating', 'popular', 'best-selling'] as const;
type CourseSortKey = (typeof COURSE_SORT_KEYS)[number];

function isCourseSortKey(value: string | null): value is CourseSortKey {
  return !!value && (COURSE_SORT_KEYS as readonly string[]).includes(value);
}

function sortStageFor(sort: CourseSortKey): Record<string, 1 | -1> {
  switch (sort) {
    case 'price':
      return { coursePrice: 1, _id: -1 };
    case 'rating':
      // averageRating is null for zero-review courses — MongoDB sorts null as the lowest
      // value, so descending naturally puts unrated courses last.
      return { averageRating: -1, _id: -1 };
    case 'popular':
      return { enrollmentCount: -1, _id: -1 };
    case 'best-selling':
      return { salesCount: -1, _id: -1 };
    case 'newest':
    default:
      return { createdAt: -1, _id: -1 };
  }
}

interface SortableLesson {
  order: number;
  section?: ISection | null;
}

// Lessons carry their own `order`, scoped to whichever section they're in (not globally
// unique per course) — so the flat, course-wide list the player/curriculum-summary
// consume has to be sorted by (section.order, lesson.order), not just lesson.order.
// Lessons with no section (pre-Section-model data that hasn't been migrated yet — see
// scripts/migrate-lessons-to-sections.ts) sort after everything else.
//
// T is left unconstrained (Mongoose's populate<>() + select() typing doesn't statically
// preserve schema fields like `order` well enough to satisfy a constrained generic here) —
// the cast below is safe because callers always populate('section') and select 'order'
// before calling this.
function sortBySectionThenOrder<T>(lessons: T[]): T[] {
  return [...lessons].sort((a, b) => {
    const lessonA = a as unknown as SortableLesson;
    const lessonB = b as unknown as SortableLesson;
    const sectionOrderDiff = (lessonA.section?.order ?? Infinity) - (lessonB.section?.order ?? Infinity);
    return sectionOrderDiff !== 0 ? sectionOrderDiff : lessonA.order - lessonB.order;
  });
}

// Both are called from the course-creation wizard's Basic Info step, before a Course
// document necessarily exists yet — same "unscoped upload, URL attached on create/update"
// pattern the public course thumbnail already used, generalized to a real Cloudinary asset
// instead of a raw URL string.
export async function uploadCourseThumbnail(req: Request) {
  await createConnection();
  await requirePermission('course:create');

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new AppError('An image file is required', 400);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, publicId } = await uploadImageBuffer(buffer, file.name);

  return NextResponse.json({ data: { url, publicId } }, { status: 201 });
}

export async function uploadCoursePromoVideo(req: Request) {
  await createConnection();
  await requirePermission('course:create');

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new AppError('A video file is required', 400);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, publicId } = await uploadVideoBuffer(buffer, file.name);

  return NextResponse.json({ data: { url, publicId } }, { status: 201 });
}

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
  // Super Admin/Admin see every course (draft or published) regardless of filter.
  const canSeeAllCourses = bypassesOwnership(session?.user?.role);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.max(1, Number(searchParams.get('limit')) || 10);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const level = searchParams.get('level');
  const language = searchParams.get('language');
  const instructor = searchParams.get('instructor');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minRating = searchParams.get('minRating');
  const sortParam = searchParams.get('sort');
  const sort: CourseSortKey = isCourseSortKey(sortParam) ? sortParam : 'newest';

  // An instructor filtering the list down to their own id (e.g. "My Courses" on their
  // dashboard) sees their own draft + published courses. Anyone filtering by someone
  // else's instructor id still only sees that instructor's published catalog.
  const isSelfScoped = !!session?.user?.id && !!instructor && instructor === session.user.id;

  const match: Record<string, unknown> = { isDeleted: false };
  if (!canSeeAllCourses && !isSelfScoped) {
    match.status = CourseStatus.PUBLISHED;
  }
  if (category && mongoose.isValidObjectId(category)) {
    match.category = new mongoose.Types.ObjectId(category);
  }
  if (instructor && mongoose.isValidObjectId(instructor)) {
    match.instructor = new mongoose.Types.ObjectId(instructor);
  }
  if (level) {
    match.level = level;
  }
  if (language) {
    match.language = { $regex: `^${language}$`, $options: 'i' };
  }
  if (search) {
    match.title = { $regex: search, $options: 'i' };
  }
  if (minPrice || maxPrice) {
    const priceRange: Record<string, number> = {};
    if (minPrice) priceRange.$gte = Number(minPrice);
    if (maxPrice) priceRange.$lte = Number(maxPrice);
    match.coursePrice = priceRange;
  }

  const ratingMatchStage =
    minRating && !Number.isNaN(Number(minRating))
      ? [{ $match: { averageRating: { $gte: Number(minRating) } } }]
      : [];

  const pipeline = [
    { $match: match },
    {
      $lookup: { from: 'reviews', localField: '_id', foreignField: 'course', as: 'reviews' },
    },
    {
      $lookup: {
        from: 'enrollments',
        localField: '_id',
        foreignField: 'course',
        as: 'enrollments',
      },
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
    {
      $addFields: {
        reviewCount: { $size: '$reviews' },
        averageRating: {
          $cond: [
            { $gt: [{ $size: '$reviews' }, 0] },
            { $round: [{ $avg: '$reviews.rating' }, 1] },
            null,
          ],
        },
        enrollmentCount: { $size: '$enrollments' },
        salesCount: { $size: '$completedPayments' },
      },
    },
    ...ratingMatchStage,
    {
      $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $lookup: { from: 'users', localField: 'instructor', foreignField: '_id', as: 'instructor' },
    },
    { $unwind: { path: '$instructor', preserveNullAndEmptyArrays: true } },
    {
      // Whitelist, not exclude — a raw $lookup on `users` bypasses Mongoose's
      // `password: { select: false }`, so this must name exactly what's safe to expose,
      // not try to blacklist what isn't.
      $addFields: {
        instructor: {
          $cond: [
            { $ifNull: ['$instructor._id', false] },
            {
              _id: '$instructor._id',
              username: '$instructor.username',
              profileImage: '$instructor.profileImage',
            },
            null,
          ],
        },
      },
    },
    { $project: { reviews: 0, enrollments: 0, completedPayments: 0 } },
    { $sort: sortStageFor(sort) },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Course.aggregate(pipeline);
  const data = result?.data ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

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
  })
    .populate('category')
    .populate('instructor', 'username profileImage');
  if (!course) {
    throw new AppError('No course found', 404);
  }

  const [lessons, [ratingSummary]] = await Promise.all([
    Lesson.find({ course: course._id })
      .select('title order durationSeconds section')
      .populate<{ section: ISection | null }>('section'),
    Review.aggregate([
      { $match: { course: course._id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]),
  ]);

  return NextResponse.json(
    {
      data: {
        course,
        lessons: sortBySectionThenOrder(lessons),
        averageRating: ratingSummary ? Math.round(ratingSummary.averageRating * 10) / 10 : null,
        reviewCount: ratingSummary?.reviewCount ?? 0,
      },
    },
    { status: 200 }
  );
};

// Backs the catalog's instructor filter dropdown — only instructors who currently have at
// least one published, non-deleted course (not just anyone who's ever created one).
export const getInstructorsWithCourses = async () => {
  const instructorIds = await Course.distinct('instructor', {
    status: CourseStatus.PUBLISHED,
    isDeleted: false,
  });
  const instructors = await User.find({ _id: { $in: instructorIds } })
    .select('username')
    .sort('username');

  return NextResponse.json({ data: instructors }, { status: 200 });
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

  // Lightweight sidebar/navigation projection only — no videoUrl/pdfUrl/description.
  // GET /api/lessons/:id (lesson.controller.ts::getLessonContent) is the sole source of
  // actual playable content, and it re-verifies enrollment on every single request.
  const lessons = await Lesson.find({ course: id })
    .select('title order durationSeconds contentType section')
    .populate<{ section: ISection | null }>('section');
  return NextResponse.json({ data: sortBySectionThenOrder(lessons) }, { status: 200 });
};
