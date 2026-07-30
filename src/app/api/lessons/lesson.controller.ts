import { createConnection } from '@/database/db';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';
import { createLessonSchema, updateLessonSchema } from '@/lib/validate/lesson.schema';
import { uploadVideoBuffer, destroyVideo } from '@/lib/cloudinary';
import { requireAuth } from '../../../../middleware/auth.middleware';

async function requireCourseOwner(courseId: string) {
  const session = await requireAuth();
  if (session.user.role !== 'admin') {
    throw new AppError('You dont have permission to perform this action', 403);
  }
  const course = await Course.findOne({ _id: courseId, isDeleted: false });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  if (course.instructor && !course.instructor.equals(session.user.id)) {
    throw new AppError('You do not own this course', 403);
  }
  return { session, course };
}

export async function createLessonForCourse(req: Request, courseId: string) {
  await createConnection();
  await requireCourseOwner(courseId);

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

  const lastLesson = await Lesson.findOne({ course: courseId }).sort('-order');
  const order = lastLesson ? lastLesson.order + 1 : 1;

  const lesson = await Lesson.create({
    ...data,
    course: courseId,
    videoUrl: url,
    videoPublicId: publicId,
    order,
  });

  return NextResponse.json({ message: 'Lesson created!!', data: lesson }, { status: 201 });
}

export async function updateLesson(req: Request, id: string) {
  await createConnection();
  const lesson = await Lesson.findById(id);
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }
  await requireCourseOwner(lesson.course.toString());

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
  await requireCourseOwner(lesson.course.toString());

  if (lesson.videoPublicId) {
    await destroyVideo(lesson.videoPublicId);
  }
  await lesson.deleteOne();

  return NextResponse.json({ message: 'Lesson deleted!!' }, { status: 200 });
}
