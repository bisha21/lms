import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { Section } from '@/database/models/section';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { createSectionSchema, reorderSchema, updateSectionSchema } from '@/lib/validate/section.schema';
import { destroyVideo } from '@/lib/cloudinary';
import { requirePermission } from '../../../../middleware/auth.middleware';
import { Action } from '@/lib/rbac/permissions';
import { assertCourseOwnership } from '@/lib/rbac/ownership';

async function requireCourseForSection(action: Action, courseId: string) {
  const session = await requirePermission(action);
  const course = await Course.findOne({ _id: courseId, isDeleted: false });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  assertCourseOwnership(course, session);
  return { session, course };
}

async function requireCourseForExistingSection(action: Action, sectionId: string) {
  const section = await Section.findById(sectionId);
  if (!section) {
    throw new AppError('Section not found', 404);
  }
  const { session, course } = await requireCourseForSection(action, section.course.toString());
  return { session, course, section };
}

export async function createSection(req: Request, courseId: string) {
  await createConnection();
  await requireCourseForSection('section:create', courseId);

  const body = await req.json();
  const { title } = createSectionSchema.parse(body);

  const lastSection = await Section.findOne({ course: courseId }).sort('-order');
  const order = lastSection ? lastSection.order + 1 : 0;

  const section = await Section.create({ course: courseId, title, order });
  return NextResponse.json({ data: section }, { status: 201 });
}

export async function getSectionsWithLessons(courseId: string) {
  await createConnection();
  // Builder view — only the owning instructor (or an Admin/Super Admin) can see this,
  // same guard as editing the course itself. Students/other instructors use the existing
  // flat GET /api/courses/:id/lessons instead.
  await requireCourseForSection('course:update', courseId);

  const [sections, lessons] = await Promise.all([
    Section.find({ course: courseId }).sort('order'),
    Lesson.find({ course: courseId }).sort('order'),
  ]);

  const lessonsBySection = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    if (!lesson.section) continue;
    const key = lesson.section.toString();
    if (!lessonsBySection.has(key)) {
      lessonsBySection.set(key, []);
    }
    lessonsBySection.get(key)!.push(lesson);
  }

  const data = sections.map((section) => ({
    ...section.toObject(),
    lessons: lessonsBySection.get(section._id.toString()) ?? [],
  }));

  return NextResponse.json({ data }, { status: 200 });
}

export async function updateSection(req: Request, sectionId: string) {
  await createConnection();
  const { section } = await requireCourseForExistingSection('section:update', sectionId);

  const body = await req.json();
  const { title } = updateSectionSchema.parse(body);

  section.title = title;
  await section.save();

  return NextResponse.json({ data: section }, { status: 200 });
}

export async function deleteSection(sectionId: string) {
  await createConnection();
  const { section } = await requireCourseForExistingSection('section:delete', sectionId);

  const lessons = await Lesson.find({ section: section._id });
  await Promise.all(
    lessons.map((lesson) => (lesson.videoPublicId ? destroyVideo(lesson.videoPublicId) : null)),
  );
  await Lesson.deleteMany({ section: section._id });
  await section.deleteOne();

  return NextResponse.json(
    { message: `Section and ${lessons.length} lesson(s) deleted` },
    { status: 200 },
  );
}

export async function reorderSections(req: Request, courseId: string) {
  await createConnection();
  await requireCourseForSection('section:update', courseId);

  const body = await req.json();
  const { orderedIds } = reorderSchema.parse(body);

  await Promise.all(
    orderedIds.map((id, index) => Section.updateOne({ _id: id, course: courseId }, { order: index })),
  );

  const sections = await Section.find({ course: courseId }).sort('order');
  return NextResponse.json({ data: sections }, { status: 200 });
}
