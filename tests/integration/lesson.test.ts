import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { Section } from '@/database/models/section';
import { mockGetServerSession } from '../setup';

vi.mock('@/lib/cloudinary', () => ({
  uploadVideoBuffer: vi.fn().mockResolvedValue({
    url: 'https://cdn.example.com/video.mp4',
    publicId: 'pub123',
  }),
  destroyVideo: vi.fn().mockResolvedValue(undefined),
}));

const { createLessonForSection, updateLesson, deleteLesson, reorderLessonsInSection } =
  await import('@/app/api/lessons/lesson.controller');

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

async function createSectionFor(courseId: string, order = 0) {
  return Section.create({ course: courseId, title: 'Section 1', order });
}

function multipartRequest(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  formData.append('video', new File([Buffer.from('fake-video')], 'video.mp4', { type: 'video/mp4' }));
  return new Request('http://localhost/api/sections/x/lessons', { method: 'POST', body: formData });
}

function jsonRequest(body: unknown, method = 'PATCH') {
  return new Request('http://localhost/api/lessons/x', {
    method,
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
    const section = await createSectionFor(course._id.toString());
    mockGetServerSession.mockResolvedValue({ user: { id: 'student-1', role: 'student' } });

    await expect(
      createLessonForSection(
        multipartRequest({ title: 'Lesson 1', description: 'desc' }),
        section._id.toString(),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(await Lesson.countDocuments({})).toBe(0);
  });

  it('lets an instructor create a lesson in a section of their own course', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    const section = await createSectionFor(course._id.toString());
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await createLessonForSection(
      multipartRequest({ title: 'Lesson 1', description: 'desc' }),
      section._id.toString(),
    );
    expect(response.status).toBe(201);

    const lesson = await Lesson.findOne({ section: section._id });
    expect(lesson).not.toBeNull();
    expect(lesson?.course.toString()).toBe(course._id.toString());
    expect(lesson?.order).toBe(0);
  });

  it("blocks instructor B from creating/updating/deleting lessons in instructor A's course", async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorA);
    const section = await createSectionFor(course._id.toString());
    const lesson = await Lesson.create({
      course: course._id,
      section: section._id,
      title: 'Existing lesson',
      description: 'desc',
      videoUrl: 'https://cdn.example.com/existing.mp4',
      order: 0,
    });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorB, role: 'instructor' } });

    await expect(
      createLessonForSection(
        multipartRequest({ title: 'Sneaky', description: 'desc' }),
        section._id.toString(),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      updateLesson(jsonRequest({ title: 'Hijacked' }), lesson._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(deleteLesson(lesson._id.toString())).rejects.toMatchObject({ statusCode: 403 });
    await expect(
      reorderLessonsInSection(jsonRequest({ orderedIds: [lesson._id.toString()] }), section._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });

    const unchanged = await Lesson.findById(lesson._id);
    expect(unchanged?.title).toBe('Existing lesson');
  });

  it.each([['super_admin'], ['admin']])(
    'lets %s manage lessons in a section of a course owned by someone else entirely',
    async (role) => {
      const instructorA = new mongoose.Types.ObjectId().toString();
      const course = await createCourseOwnedBy(instructorA);
      const section = await createSectionFor(course._id.toString());
      const lesson = await Lesson.create({
        course: course._id,
        section: section._id,
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

  it('reorders lessons within a section', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    const section = await createSectionFor(course._id.toString());
    const lessonA = await Lesson.create({
      course: course._id,
      section: section._id,
      title: 'A',
      description: 'desc',
      videoUrl: 'https://cdn.example.com/a.mp4',
      order: 0,
    });
    const lessonB = await Lesson.create({
      course: course._id,
      section: section._id,
      title: 'B',
      description: 'desc',
      videoUrl: 'https://cdn.example.com/b.mp4',
      order: 1,
    });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    await reorderLessonsInSection(
      jsonRequest({ orderedIds: [lessonB._id.toString(), lessonA._id.toString()] }),
      section._id.toString(),
    );

    const reordered = await Lesson.find({ section: section._id }).sort('order');
    expect(reordered.map((lesson) => lesson.title)).toEqual(['B', 'A']);
  });
});
