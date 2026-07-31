import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { Section } from '@/database/models/section';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { createLessonSchema, updateLessonSchema } from '@/lib/validate/lesson.schema';
import { reorderSchema } from '@/lib/validate/section.schema';
import { uploadVideoBuffer, destroyVideo } from '@/lib/cloudinary';
import { requirePermission } from '../../../../middleware/auth.middleware';
import { Action } from '@/lib/rbac/permissions';
import { assertCourseOwnership } from '@/lib/rbac/ownership';

async function requireCourseOwner(action: Action, courseId: string) {
  const session = await requirePermission(action);
  const course = await Course.findOne({ _id: courseId, isDeleted: false });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  assertCourseOwnership(course, session);
  return { session, course };
}

async function requireSectionOwner(action: Action, sectionId: string) {
  const section = await Section.findById(sectionId);
  if (!section) {
    throw new AppError('Section not found', 404);
  }
  const { session, course } = await requireCourseOwner(action, section.course.toString());
  return { session, course, section };
}

export async function createLessonForSection(req: Request, sectionId: string) {
  await createConnection();
  const { section } = await requireSectionOwner('lesson:create', sectionId);

  const formData = await req.formData();
  const video = formData.get('video');
  if (!(video instanceof File)) {
    throw new AppError('A video file is required', 400);
  }

  const data = createLessonSchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    durationSeconds: formData.get('durationSeconds') || undefined,
  });

  const buffer = Buffer.from(await video.arrayBuffer());
  const { url, publicId } = await uploadVideoBuffer(buffer, video.name);

  const lastLesson = await Lesson.findOne({ section: sectionId }).sort('-order');
  const order = lastLesson ? lastLesson.order + 1 : 0;

  const lesson = await Lesson.create({
    ...data,
    course: section.course,
    section: sectionId,
    videoUrl: url,
    videoPublicId: publicId,
    order,
  });

  return NextResponse.json({ message: 'Lesson created!!', data: lesson }, { status: 201 });
}

export async function reorderLessonsInSection(req: Request, sectionId: string) {
  await createConnection();
  await requireSectionOwner('lesson:update', sectionId);

  const body = await req.json();
  const { orderedIds } = reorderSchema.parse(body);

  await Promise.all(
    orderedIds.map((id, index) =>
      Lesson.updateOne({ _id: id, section: sectionId }, { order: index })
    )
  );

  const lessons = await Lesson.find({ section: sectionId }).sort('order');
  return NextResponse.json({ data: lessons }, { status: 200 });
}

export async function updateLesson(req: Request, id: string) {
  await createConnection();
  const lesson = await Lesson.findById(id);
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }
  await requireCourseOwner('lesson:update', lesson.course.toString());

  const body = await req.json();
  const data = updateLessonSchema.parse(body);

  Object.assign(lesson, data);
  await lesson.save();

  return NextResponse.json({ message: 'Lesson updated!!', data: lesson }, { status: 200 });
}

export async function deleteLesson(id: string) {
  await createConnection();
  const lesson = await Lesson.findById(id);
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }
  await requireCourseOwner('lesson:delete', lesson.course.toString());

  if (lesson.videoPublicId) {
    await destroyVideo(lesson.videoPublicId);
  }
  await lesson.deleteOne();

  return NextResponse.json({ message: 'Lesson deleted!!' }, { status: 200 });
}
