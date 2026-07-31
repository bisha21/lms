import { Lesson } from '@/database/models/lesson';
import { Section } from '@/database/models/section';

// Idempotent: only ever touches lessons with no `section` set. Once a course's lessons are
// backfilled, rerunning finds nothing left to do for it.
export async function migrateLessonsToSections(): Promise<{
  coursesMigrated: number;
  lessonsMigrated: number;
}> {
  const orphanLessons = await Lesson.find({ section: null }).sort('course order');

  const byCourse = new Map<string, (typeof orphanLessons)[number][]>();
  for (const lesson of orphanLessons) {
    const key = lesson.course.toString();
    if (!byCourse.has(key)) {
      byCourse.set(key, []);
    }
    byCourse.get(key)!.push(lesson);
  }

  let coursesMigrated = 0;
  let lessonsMigrated = 0;

  for (const [courseId, lessons] of byCourse) {
    const section = await Section.create({ course: courseId, title: 'Section 1', order: 0 });
    await Lesson.updateMany(
      { _id: { $in: lessons.map((lesson) => lesson._id) } },
      { $set: { section: section._id } },
    );
    coursesMigrated += 1;
    lessonsMigrated += lessons.length;
  }

  return { coursesMigrated, lessonsMigrated };
}
