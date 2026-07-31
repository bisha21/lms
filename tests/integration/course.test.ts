import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { deleteCourse, getAllCourses, getCourseById } from '@/app/api/courses/course.Controller';
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

  it('rejects deleting a course owned by a different instructor', async () => {
    const course = await createPublishedCourse();
    mockGetServerSession.mockResolvedValue({
      user: { id: new mongoose.Types.ObjectId().toString(), role: 'admin' },
    });

    await expect(deleteCourse(course._id.toString())).rejects.toMatchObject({ statusCode: 403 });
  });
});
