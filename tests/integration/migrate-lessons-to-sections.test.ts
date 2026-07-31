import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import Course from '@/database/models/course.schema';
import { Lesson } from '@/database/models/lesson';
import { Section } from '@/database/models/section';
import { migrateLessonsToSections } from '@/lib/migrations/lessonsToSections';

async function createCourse(title: string) {
  const category = await Category.create({ name: 'Programming' });
  return Course.create({
    title,
    courseDescription: 'desc',
    duration: '1h',
    category: category._id,
    status: 'published',
  });
}

describe('migrateLessonsToSections', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('wraps a course\'s section-less lessons into one default section, preserving order', async () => {
    const course = await createCourse('Legacy Course');
    await Lesson.create([
      {
        course: course._id,
        title: 'Lesson 1',
        description: 'desc',
        videoUrl: 'https://cdn.example.com/1.mp4',
        order: 0,
      },
      {
        course: course._id,
        title: 'Lesson 2',
        description: 'desc',
        videoUrl: 'https://cdn.example.com/2.mp4',
        order: 1,
      },
    ]);

    const result = await migrateLessonsToSections();
    expect(result).toEqual({ coursesMigrated: 1, lessonsMigrated: 2 });

    const sections = await Section.find({ course: course._id });
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Section 1');

    const lessons = await Lesson.find({ course: course._id }).sort('order');
    expect(lessons.every((lesson) => lesson.section?.toString() === sections[0]._id.toString())).toBe(
      true,
    );
    expect(lessons.map((lesson) => lesson.title)).toEqual(['Lesson 1', 'Lesson 2']);
  });

  it('is idempotent — a second run finds nothing left to migrate', async () => {
    const course = await createCourse('Legacy Course 2');
    await Lesson.create({
      course: course._id,
      title: 'Lesson 1',
      description: 'desc',
      videoUrl: 'https://cdn.example.com/1.mp4',
      order: 0,
    });

    await migrateLessonsToSections();
    const secondRun = await migrateLessonsToSections();

    expect(secondRun).toEqual({ coursesMigrated: 0, lessonsMigrated: 0 });
    expect(await Section.countDocuments({ course: course._id })).toBe(1);
  });

  it('leaves courses that already have sections untouched', async () => {
    const course = await createCourse('Already Sectioned Course');
    const section = await Section.create({ course: course._id, title: 'Custom Section', order: 0 });
    await Lesson.create({
      course: course._id,
      section: section._id,
      title: 'Lesson 1',
      description: 'desc',
      videoUrl: 'https://cdn.example.com/1.mp4',
      order: 0,
    });

    const result = await migrateLessonsToSections();
    expect(result).toEqual({ coursesMigrated: 0, lessonsMigrated: 0 });
    expect(await Section.countDocuments({ course: course._id })).toBe(1);
  });
});
