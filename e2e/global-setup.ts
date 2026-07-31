import mongoose from 'mongoose';
import Category from '../src/database/models/category';
import Course from '../src/database/models/course.schema';
import { Enrollment } from '../src/database/models/enrollment.model';
import { Lesson } from '../src/database/models/lesson';
import { Payment } from '../src/database/models/payment.model';
import { Progress } from '../src/database/models/progress.model';
import User from '../src/database/models/user.schema';

export const FREE_COURSE_SLUG = 'e2e-free-intro-course';
export const PAID_COURSE_SLUG = 'e2e-paid-advanced-course';
export const PAID_COURSE_PRICE = 49;

export default async function globalSetup() {
  const uri = process.env.MONGOOSE_URI;
  if (!uri) {
    throw new Error(
      'MONGOOSE_URI must be set before running e2e tests — point it at a disposable ' +
        'MongoDB instance (see playwright.config.ts / e2e/global-setup.ts).',
    );
  }

  await mongoose.connect(uri);
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Enrollment.deleteMany({}),
    Payment.deleteMany({}),
    Progress.deleteMany({}),
  ]);

  const category = await Category.create({ name: 'E2E Programming' });

  const freeCourse = await Course.create({
    title: 'E2E Free Intro Course',
    slug: FREE_COURSE_SLUG,
    courseDescription: 'A free course seeded for end-to-end tests.',
    duration: '1h',
    category: category._id,
    coursePrice: 0,
    status: 'published',
  });
  await Lesson.create([
    {
      course: freeCourse._id,
      title: 'Lesson 1: Getting started',
      description: 'desc',
      videoUrl: 'https://example.com/1.mp4',
      order: 0,
    },
    {
      course: freeCourse._id,
      title: 'Lesson 2: Next steps',
      description: 'desc',
      videoUrl: 'https://example.com/2.mp4',
      order: 1,
    },
  ]);

  await Course.create({
    title: 'E2E Paid Advanced Course',
    slug: PAID_COURSE_SLUG,
    courseDescription: 'A paid course seeded for end-to-end tests.',
    duration: '5h',
    category: category._id,
    coursePrice: PAID_COURSE_PRICE,
    status: 'published',
  });

  await mongoose.disconnect();
}
