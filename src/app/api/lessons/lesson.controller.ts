import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { Lesson } from '@/database/models/lesson';
import { Progress } from '@/database/models/progress.model';
import { Section } from '@/database/models/section';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { createLessonSchema, updateLessonSchema } from '@/lib/validate/lesson.schema';
import { reorderSchema } from '@/lib/validate/section.schema';
import { destroyRaw, destroyVideo, uploadRawBuffer, uploadVideoBuffer } from '@/lib/cloudinary';
import { requireAuth, requirePermission } from '../../../../middleware/auth.middleware';
import { Action } from '@/lib/rbac/permissions';
import { assertCourseOwnership, ownsCourse } from '@/lib/rbac/ownership';

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

// The sole source of playable lesson content (videoUrl/pdfUrl) — re-verifies enrollment
// on every single call, not just once at page load. Owners/admins may preview without an
// Enrollment record; only an actual enrolled student's view updates their resume pointer.
export async function getLessonContent(id: string) {
  await createConnection();
  const session = await requireAuth();

  const lesson = await Lesson.findById(id);
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  const course = await Course.findOne({ _id: lesson.course, isDeleted: false });
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  if (!ownsCourse(course, session)) {
    const enrolled = await Enrollment.findOne({ student: session.user.id, course: lesson.course });
    if (!enrolled) {
      throw new AppError('You must be enrolled to view this content', 403);
    }

    await Progress.findOneAndUpdate(
      { student: session.user.id, course: lesson.course },
      { $set: { lastViewedLesson: lesson._id } },
      { upsert: true }
    );
  }

  return NextResponse.json({ data: lesson }, { status: 200 });
}

export async function createLessonForSection(req: Request, sectionId: string) {
  await createConnection();
  const { section } = await requireSectionOwner('lesson:create', sectionId);

  const formData = await req.formData();
  const data = createLessonSchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    durationSeconds: formData.get('durationSeconds') || undefined,
    contentType: formData.get('contentType') || undefined,
  });

  const lastLesson = await Lesson.findOne({ section: sectionId }).sort('-order');
  const order = lastLesson ? lastLesson.order + 1 : 0;

  let asset: { videoUrl?: string; videoPublicId?: string; pdfUrl?: string; pdfPublicId?: string };
  if (data.contentType === 'pdf') {
    const pdf = formData.get('pdf');
    if (!(pdf instanceof File)) {
      throw new AppError('A PDF file is required', 400);
    }
    const buffer = Buffer.from(await pdf.arrayBuffer());
    const { url, publicId } = await uploadRawBuffer(buffer, pdf.name);
    asset = { pdfUrl: url, pdfPublicId: publicId };
  } else {
    const video = formData.get('video');
    if (!(video instanceof File)) {
      throw new AppError('A video file is required', 400);
    }
    const buffer = Buffer.from(await video.arrayBuffer());
    const { url, publicId } = await uploadVideoBuffer(buffer, video.name);
    asset = { videoUrl: url, videoPublicId: publicId };
  }

  const lesson = await Lesson.create({
    ...data,
    ...asset,
    course: section.course,
    section: sectionId,
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
  if (lesson.pdfPublicId) {
    await destroyRaw(lesson.pdfPublicId);
  }
  await lesson.deleteOne();

  return NextResponse.json({ message: 'Lesson deleted!!' }, { status: 200 });
}
