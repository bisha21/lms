import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { Section } from '@/database/models/section';
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getCourseLessons,
  updateCourse,
} from '@/app/api/courses/course.Controller';
import { mockGetServerSession } from '../setup';

async function createPublishedCourse(overrides: Partial<Record<string, unknown>> = {}) {
  const category = await Category.create({ name: 'Programming' });
  return Course.create({
    title: 'Intro to Testing',
    courseDescription: 'Learn to test things',
    duration: '2h',
    category: category._id,
    instructor: new mongoose.Types.ObjectId(),
    status: 'published',
    ...overrides,
  });
}

function getRequest(url: string) {
  return new Request(url);
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/courses', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('course controller — soft delete', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('marks a course isDeleted=true instead of removing the document', async () => {
    const course = await createPublishedCourse();
    mockGetServerSession.mockResolvedValue({
      user: { id: course.instructor.toString(), role: 'admin' },
    });

    const response = await deleteCourse(course._id.toString());
    expect(response.status).toBe(200);

    const stillExists = await Course.findById(course._id);
    expect(stillExists).not.toBeNull();
    expect(stillExists?.isDeleted).toBe(true);
  });

  it('excludes soft-deleted courses from the public catalog listing', async () => {
    const course = await createPublishedCourse();
    course.isDeleted = true;
    await course.save();

    const response = await getAllCourses(getRequest('http://localhost/api/courses'));
    const body = await response.json();

    expect(body.data).toHaveLength(0);
  });

  it('404s when fetching a soft-deleted course by id', async () => {
    const course = await createPublishedCourse();
    course.isDeleted = true;
    await course.save();

    await expect(getCourseById(course._id.toString())).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('course controller — role & ownership matrix', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('rejects course creation for a student (403)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'student-1', role: 'student' } });

    await expect(
      createCourse(
        jsonRequest({
          title: 'New Course',
          courseDescription: 'desc',
          duration: '1h',
          category: new mongoose.Types.ObjectId().toString(),
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(await Course.countDocuments({})).toBe(0);
  });

  it('lets an instructor create a course, owned by them', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await createCourse(
      jsonRequest({
        title: 'Instructor A Course',
        courseDescription: 'desc',
        duration: '1h',
        category: new mongoose.Types.ObjectId().toString(),
      }),
    );
    expect(response.status).toBe(201);

    const stored = await Course.findOne({ title: 'Instructor A Course' });
    expect(stored?.instructor?.toString()).toBe(instructorId);
  });

  it('blocks instructor B from updating or deleting instructor A\'s course', async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const course = await createPublishedCourse({ instructor: instructorA });

    mockGetServerSession.mockResolvedValue({ user: { id: instructorB, role: 'instructor' } });

    await expect(
      updateCourse(jsonRequest({ title: 'Hijacked' }), course._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(deleteCourse(course._id.toString())).rejects.toMatchObject({ statusCode: 403 });

    const unchanged = await Course.findById(course._id);
    expect(unchanged?.title).toBe('Intro to Testing');
    expect(unchanged?.isDeleted).toBe(false);
  });

  it.each([['super_admin'], ['admin']])(
    'lets %s mutate a course owned by someone else entirely',
    async (role) => {
      const instructorA = new mongoose.Types.ObjectId().toString();
      const course = await createPublishedCourse({ instructor: instructorA });

      mockGetServerSession.mockResolvedValue({
        user: { id: new mongoose.Types.ObjectId().toString(), role },
      });

      const updateResponse = await updateCourse(
        jsonRequest({ title: 'Updated By Admin' }),
        course._id.toString(),
      );
      expect(updateResponse.status).toBe(200);

      const deleteResponse = await deleteCourse(course._id.toString());
      expect(deleteResponse.status).toBe(200);
    },
  );

  it('rejects update/delete for a student regardless of ownership', async () => {
    const course = await createPublishedCourse();
    mockGetServerSession.mockResolvedValue({ user: { id: 'student-1', role: 'student' } });

    await expect(
      updateCourse(jsonRequest({ title: 'Hijacked' }), course._id.toString()),
    ).rejects.toMatchObject({ statusCode: 403 });
    await expect(deleteCourse(course._id.toString())).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('course controller — flat lesson list is sorted by (section.order, lesson.order)', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('sorts lessons by their section order first, then their own order within it', async () => {
    const course = await createPublishedCourse();
    // Sections created out of the order we want them to sort in, to prove sorting
    // isn't accidentally relying on creation/insertion order.
    const sectionB = await Section.create({ course: course._id, title: 'Section B', order: 1 });
    const sectionA = await Section.create({ course: course._id, title: 'Section A', order: 0 });

    await Lesson.create([
      {
        course: course._id,
        section: sectionB._id,
        title: 'B2',
        description: 'desc',
        videoUrl: 'https://cdn.example.com/b2.mp4',
        order: 1,
      },
      {
        course: course._id,
        section: sectionA._id,
        title: 'A1',
        description: 'desc',
        videoUrl: 'https://cdn.example.com/a1.mp4',
        order: 0,
      },
      {
        course: course._id,
        section: sectionB._id,
        title: 'B1',
        description: 'desc',
        videoUrl: 'https://cdn.example.com/b1.mp4',
        order: 0,
      },
      {
        course: course._id,
        section: sectionA._id,
        title: 'A2',
        description: 'desc',
        videoUrl: 'https://cdn.example.com/a2.mp4',
        order: 1,
      },
    ]);

    mockGetServerSession.mockResolvedValue({
      user: { id: course.instructor.toString(), role: 'admin' },
    });

    const response = await getCourseLessons(course._id.toString());
    const body = await response.json();

    expect(body.data.map((lesson: { title: string }) => lesson.title)).toEqual([
      'A1',
      'A2',
      'B1',
      'B2',
    ]);
  });
});
