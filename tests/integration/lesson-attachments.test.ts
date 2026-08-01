import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { mockGetServerSession } from '../setup';

vi.mock('@/lib/cloudinary', () => ({
  uploadVideoBuffer: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/video.mp4', publicId: 'v1' }),
  uploadRawBuffer: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/notes.pdf', publicId: 'raw123' }),
  destroyVideo: vi.fn().mockResolvedValue(undefined),
  destroyRaw: vi.fn().mockResolvedValue(undefined),
}));

const { addLessonAttachment, deleteLessonAttachment } = await import('@/app/api/lessons/lesson.controller');

async function createCourseOwnedBy(instructorId: string) {
  const category = await Category.create({ name: `Programming ${new mongoose.Types.ObjectId()}` });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    instructor: instructorId,
    status: 'published',
  });
}

async function createLessonFor(courseId: string) {
  return Lesson.create({
    course: courseId,
    title: 'Lecture 1',
    description: 'desc',
    videoUrl: 'https://cdn.example.com/existing.mp4',
    order: 0,
  });
}

function attachmentRequest(fileName = 'notes.pdf') {
  const formData = new FormData();
  formData.append('file', new File([Buffer.from('fake-file')], fileName, { type: 'application/pdf' }));
  return new Request('http://localhost/api/lessons/x/attachments', { method: 'POST', body: formData });
}

describe('lesson attachments controller', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('lets an instructor attach a file to a lecture in their own course', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    const lesson = await createLessonFor(course._id.toString());
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await addLessonAttachment(attachmentRequest('starter-code.zip'), lesson._id.toString());
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      name: 'starter-code.zip',
      url: 'https://cdn.example.com/notes.pdf',
      publicId: 'raw123',
    });

    const updated = await Lesson.findById(lesson._id);
    expect(updated?.attachments).toHaveLength(1);
  });

  it("blocks another instructor from attaching a file to someone else's lecture", async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorA);
    const lesson = await createLessonFor(course._id.toString());

    mockGetServerSession.mockResolvedValue({ user: { id: instructorB, role: 'instructor' } });
    await expect(addLessonAttachment(attachmentRequest(), lesson._id.toString())).rejects.toMatchObject({
      statusCode: 403,
    });

    const unchanged = await Lesson.findById(lesson._id);
    expect(unchanged?.attachments).toHaveLength(0);
  });

  it('removes an attachment and calls destroyRaw with its publicId', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    const lesson = await createLessonFor(course._id.toString());
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    await addLessonAttachment(attachmentRequest(), lesson._id.toString());
    const withAttachment = await Lesson.findById(lesson._id);
    const attachmentId = withAttachment!.attachments[0]._id.toString();

    const { destroyRaw } = await import('@/lib/cloudinary');
    const response = await deleteLessonAttachment(lesson._id.toString(), attachmentId);
    expect(response.status).toBe(200);
    expect(destroyRaw).toHaveBeenCalledWith('raw123');

    const updated = await Lesson.findById(lesson._id);
    expect(updated?.attachments).toHaveLength(0);
  });

  it("blocks another instructor from deleting someone else's lecture attachment", async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorA);
    const lesson = await createLessonFor(course._id.toString());
    mockGetServerSession.mockResolvedValue({ user: { id: instructorA, role: 'instructor' } });
    await addLessonAttachment(attachmentRequest(), lesson._id.toString());
    const withAttachment = await Lesson.findById(lesson._id);
    const attachmentId = withAttachment!.attachments[0]._id.toString();

    mockGetServerSession.mockResolvedValue({ user: { id: instructorB, role: 'instructor' } });
    await expect(deleteLessonAttachment(lesson._id.toString(), attachmentId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
