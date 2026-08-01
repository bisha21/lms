import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import {
  createInstructorAnnouncement,
  getInstructorAnnouncements,
} from '@/app/api/instructor/announcements/announcements.controller';
import { mockGetServerSession } from '../setup';

async function createCourseFor(instructorId: string, overrides: Partial<Record<string, unknown>> = {}) {
  const category = await Category.create({ name: `Programming ${new mongoose.Types.ObjectId()}` });
  return Course.create({
    title: `Course ${new mongoose.Types.ObjectId()}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    instructor: instructorId,
    status: 'published',
    ...overrides,
  });
}

function postRequest(body: unknown) {
  return new Request('http://localhost/api/instructor/announcements', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('instructor announcements controller', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('rejects a student (403)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'student' } });
    await expect(getInstructorAnnouncements()).rejects.toMatchObject({ statusCode: 403 });
  });

  it('lets an instructor post an announcement on their own course', async () => {
    const instructorId = new mongoose.Types.ObjectId().toString();
    const course = await createCourseFor(instructorId);
    mockGetServerSession.mockResolvedValue({ user: { id: instructorId, role: 'instructor' } });

    const response = await createInstructorAnnouncement(
      postRequest({ course: course._id.toString(), title: 'Update', body: 'New lesson is live' })
    );
    expect(response.status).toBe(201);

    const listResponse = await getInstructorAnnouncements();
    const body = await listResponse.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      title: 'Update',
      body: 'New lesson is live',
      courseTitle: course.title,
    });
  });

  it('rejects posting to a course owned by another instructor (403)', async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const courseB = await createCourseFor(instructorB);

    mockGetServerSession.mockResolvedValue({ user: { id: instructorA, role: 'instructor' } });
    await expect(
      createInstructorAnnouncement(postRequest({ course: courseB._id.toString(), title: 'x', body: 'y' }))
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("never includes another instructor's announcements", async () => {
    const instructorA = new mongoose.Types.ObjectId().toString();
    const instructorB = new mongoose.Types.ObjectId().toString();
    const courseA = await createCourseFor(instructorA);
    const courseB = await createCourseFor(instructorB);

    mockGetServerSession.mockResolvedValue({ user: { id: instructorA, role: 'instructor' } });
    await createInstructorAnnouncement(
      postRequest({ course: courseA._id.toString(), title: 'A', body: 'from A' })
    );

    mockGetServerSession.mockResolvedValue({ user: { id: instructorB, role: 'instructor' } });
    await createInstructorAnnouncement(
      postRequest({ course: courseB._id.toString(), title: 'B', body: 'from B' })
    );

    mockGetServerSession.mockResolvedValue({ user: { id: instructorA, role: 'instructor' } });
    const response = await getInstructorAnnouncements();
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('A');
  });
});
