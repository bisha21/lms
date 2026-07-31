import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { enrollInCourse } from '@/app/api/enrollments/enrollment.controller';
import { mockGetServerSession } from '../setup';

async function createCourse(coursePrice: number) {
  const category = await Category.create({ name: 'Programming' });
  return Course.create({
    title: `Course $${coursePrice}`,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    coursePrice,
    status: 'published',
  });
}

function postRequest(body: unknown) {
  return new Request('http://localhost/api/enrollments', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('enrollment controller — free vs paid guard', () => {
  const studentId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await createConnection();
    mockGetServerSession.mockResolvedValue({ user: { id: studentId, role: 'student' } });
  });

  it('enrolls directly in a free course', async () => {
    const course = await createCourse(0);

    const response = await enrollInCourse(postRequest({ courseId: course._id.toString() }));
    expect(response.status).toBe(201);

    const enrollment = await Enrollment.findOne({ student: studentId, course: course._id });
    expect(enrollment).not.toBeNull();
  });

  it('rejects self-enrollment in a paid course', async () => {
    const course = await createCourse(49);

    await expect(
      enrollInCourse(postRequest({ courseId: course._id.toString() })),
    ).rejects.toMatchObject({ statusCode: 400 });

    const enrollment = await Enrollment.findOne({ student: studentId, course: course._id });
    expect(enrollment).toBeNull();
  });

  it('is idempotent when already enrolled in a free course', async () => {
    const course = await createCourse(0);
    await Enrollment.create({ student: studentId, course: course._id });

    const response = await enrollInCourse(postRequest({ courseId: course._id.toString() }));
    expect(response.status).toBe(200);

    const count = await Enrollment.countDocuments({ student: studentId, course: course._id });
    expect(count).toBe(1);
  });
});
