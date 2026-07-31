import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { mockGetServerSession } from '../setup';

vi.mock('@/lib/cloudinary', () => ({
  uploadVideoBuffer: vi.fn().mockResolvedValue({
    url: 'https://cdn.example.com/video.mp4',
    publicId: 'pub123',
  }),
  destroyVideo: vi.fn().mockResolvedValue(undefined),
}));

const { createLessonForCourse, updateLesson, deleteLesson } = await import(
  '@/app/api/lessons/lesson.controller'
);

async function createCourseOwnedBy(instructorId: string) {
  const category = await Category.create({ name: 'Programming' });
  return Course.create({
    title: `Course owned by ${instructorId}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    instructor: instructorId,
    status: 'published',
  });
}

function multipartRequest(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  formData.append('video', new File([Buffer.from('fake-video')], 'video.mp4', { type: 'video/mp4' }));
  return new Request('http://localhost/api/courses/x/lessons', { method: 'POST', body: formData });
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/lessons/x', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('lesson controller — role & ownership matrix', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('rejects lesson creation for a student (403)', async () => {
    const course = await createCourseOwnedBy(new mongoose.Types.ObjectId().toString());
    mockGetServerSession.mockResolvedValue({ user: { id: 'student-1', role: 'student' } });

    await expect(
      createLessonForCourse(multipartRequest({ title: 'Lesson 1', description: 'desc' }), course._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(await Lesson.countDocuments({})).toBe(0);
  });

  it('lets an instructor create a lesson on their own course', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await createLessonForCourse(
      multipartRequest({ title: 'Lesson 1', description: 'desc' }),
      course._id.toString(),
    );
    expect(response.status).toBe(201);
    expect(await Lesson.countDocuments({ course: course._id })).toBe(1);
  });

  it('blocks instructor B from creating/updating/deleting lessons on instructor A\'s course', async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorA);
    const lesson = await Lesson.create({
      course: course._id,
      title: 'Existing lesson',
      description: 'desc',
      videoUrl: 'https://cdn.example.com/existing.mp4',
      order: 0,
    });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorB, role: 'instructor' } });

    await expect(
      createLessonForCourse(multipartRequest({ title: 'Sneaky', description: 'desc' }), course._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      updateLesson(jsonRequest({ title: 'Hijacked' }), lesson._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(deleteLesson(lesson._id.toString())).rejects.toMatchObject({ statusCode: 403 });

    const unchanged = await Lesson.findById(lesson._id);
    expect(unchanged?.title).toBe('Existing lesson');
  });

  it.each([['super_admin'], ['admin']])(
    'lets %s manage lessons on a course owned by someone else entirely',
    async (role) => {
      const instructorA = new mongoose.Types.ObjectId().toString();
      const course = await createCourseOwnedBy(instructorA);
      const lesson = await Lesson.create({
        course: course._id,
        title: 'Existing lesson',
        description: 'desc',
        videoUrl: 'https://cdn.example.com/existing.mp4',
        order: 0,
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: new mongoose.Types.ObjectId().toString(), role },
      });

      const updateResponse = await updateLesson(jsonRequest({ title: 'Updated' }), lesson._id.toString());
      expect(updateResponse.status).toBe(200);

      const deleteResponse = await deleteLesson(lesson._id.toString());
      expect(deleteResponse.status).toBe(200);
    },
  );
});
