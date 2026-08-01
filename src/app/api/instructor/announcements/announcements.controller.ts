import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { createConnection } from '@/database/db';
import { Announcement } from '@/database/models/announcement';
import Course from '@/database/models/course.schema';
import { AppError } from '@/lib/appError';
import { createAnnouncementSchema } from '@/lib/validate/announcement.schema';
import { assertCourseOwnership } from '@/lib/rbac/ownership';
import { requirePermission } from '../../../../../middleware/auth.middleware';

interface PopulatedCourse {
  _id: mongoose.Types.ObjectId;
  title?: string;
}

export async function getInstructorAnnouncements() {
  await createConnection();
  const session = await requirePermission('instructor:overview');
  const instructorId = new mongoose.Types.ObjectId(session.user.id);

  const announcements = await Announcement.find({ instructor: instructorId })
    .sort({ createdAt: -1 })
    .populate<{ course: PopulatedCourse }>('course', 'title');

  return NextResponse.json(
    {
      data: announcements.map((a) => ({
        _id: a._id.toString(),
        title: a.title,
        body: a.body,
        courseId: a.course?._id?.toString() ?? '',
        courseTitle: a.course?.title ?? 'Deleted course',
        createdAt: a.get('createdAt'),
      })),
    },
    { status: 200 }
  );
}

export async function createInstructorAnnouncement(req: Request) {
  await createConnection();
  const session = await requirePermission('instructor:overview');

  const body = await req.json();
  const data = createAnnouncementSchema.parse(body);

  const course = await Course.findOne({ _id: data.course, isDeleted: false });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  assertCourseOwnership(course, session);

  const announcement = await Announcement.create({
    instructor: session.user.id,
    course: data.course,
    title: data.title,
    body: data.body,
  });

  return NextResponse.json({ data: announcement }, { status: 201 });
}
