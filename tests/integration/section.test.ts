import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { Section } from '@/database/models/section';
import { mockGetServerSession } from '../setup';

const destroyVideo = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/cloudinary', () => ({
  uploadVideoBuffer: vi.fn(),
  destroyVideo: (...args: unknown[]) => destroyVideo(...args),
}));

const { createSection, updateSection, deleteSection, reorderSections, getSectionsWithLessons } =
  await import('@/app/api/sections/section.controller');

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

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/sections', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('section controller — role & ownership matrix', () => {
  beforeEach(async () => {
    await createConnection();
    destroyVideo.mockClear();
  });

  it('rejects section creation for a student (403)', async () => {
    const course = await createCourseOwnedBy(new mongoose.Types.ObjectId().toString());
    mockGetServerSession.mockResolvedValue({ user: { id: 'student-1', role: 'student' } });

    await expect(
      createSection(jsonRequest({ title: 'Intro' }), course._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(await Section.countDocuments({})).toBe(0);
  });

  it('lets an instructor create sections on their own course, auto-incrementing order', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const first = await createSection(jsonRequest({ title: 'Section 1' }), course._id.toString());
    const second = await createSection(jsonRequest({ title: 'Section 2' }), course._id.toString());
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const sections = await Section.find({ course: course._id }).sort('order');
    expect(sections.map((s) => ({ title: s.title, order: s.order }))).toEqual([
      { title: 'Section 1', order: 0 },
      { title: 'Section 2', order: 1 },
    ]);
  });

  it("blocks instructor B from updating/deleting instructor A's sections", async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorA);
    const section = await Section.create({ course: course._id, title: 'Section 1', order: 0 });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorB, role: 'instructor' } });

    await expect(
      updateSection(jsonRequest({ title: 'Hijacked' }), section._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(deleteSection(section._id.toString())).rejects.toMatchObject({ statusCode: 403 });

    const unchanged = await Section.findById(section._id);
    expect(unchanged?.title).toBe('Section 1');
  });

  it.each([['super_admin'], ['admin']])(
    'lets %s manage sections on a course owned by someone else entirely',
    async (role) => {
      const instructorA = new mongoose.Types.ObjectId().toString();
      const course = await createCourseOwnedBy(instructorA);
      const section = await Section.create({ course: course._id, title: 'Section 1', order: 0 });

      mockGetServerSession.mockResolvedValue({
        user: { id: new mongoose.Types.ObjectId().toString(), role },
      });

      const response = await updateSection(jsonRequest({ title: 'Updated' }), section._id.toString());
      expect(response.status).toBe(200);
    },
  );

  it('cascades: deleting a section deletes its lessons and cleans up their videos', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    const section = await Section.create({ course: course._id, title: 'Section 1', order: 0 });
    await Lesson.create({
      course: course._id,
      section: section._id,
      title: 'Lesson 1',
      description: 'desc',
      videoUrl: 'https://cdn.example.com/1.mp4',
      videoPublicId: 'pub-1',
      order: 0,
    });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await deleteSection(section._id.toString());
    expect(response.status).toBe(200);

    expect(await Section.findById(section._id)).toBeNull();
    expect(await Lesson.countDocuments({ section: section._id })).toBe(0);
    expect(destroyVideo).toHaveBeenCalledWith('pub-1');
  });

  it('reorders sections', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    const sectionA = await Section.create({ course: course._id, title: 'A', order: 0 });
    const sectionB = await Section.create({ course: course._id, title: 'B', order: 1 });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    await reorderSections(
      jsonRequest({ orderedIds: [sectionB._id.toString(), sectionA._id.toString()] }),
      course._id.toString(),
    );

    const reordered = await Section.find({ course: course._id }).sort('order');
    expect(reordered.map((s) => s.title)).toEqual(['B', 'A']);
  });

  it('rejects the builder view for a student and for a different instructor', async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorA);
    await Section.create({ course: course._id, title: 'Section 1', order: 0 });

    mockGetServerSession.mockResolvedValue({ user: { id: 'student-1', role: 'student' } });
    await expect(getSectionsWithLessons(course._id.toString())).rejects.toMatchObject({
      statusCode: 403,
    });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorB, role: 'instructor' } });
    await expect(getSectionsWithLessons(course._id.toString())).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('returns sections with their nested lessons for the owning instructor', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseOwnedBy(instructorId);
    const section = await Section.create({ course: course._id, title: 'Section 1', order: 0 });
    await Lesson.create({
      course: course._id,
      section: section._id,
      title: 'Lesson 1',
      description: 'desc',
      videoUrl: 'https://cdn.example.com/1.mp4',
      order: 0,
    });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await getSectionsWithLessons(course._id.toString());
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].lessons).toHaveLength(1);
    expect(body.data[0].lessons[0].title).toBe('Lesson 1');
  });
});
