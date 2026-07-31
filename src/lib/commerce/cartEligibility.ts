import Course, { CourseStatus } from '@/database/models/course.schema';
import { Enrollment } from '@/database/models/enrollment.model';
import { AppError } from '@/lib/appError';

// Shared by cart-add, wishlist-add, and move-to-cart — a course must be published, paid
// (free courses have their own direct-enroll path), and not already owned.
export async function assertCourseAddable(courseId: string, studentId: string) {
  const course = await Course.findOne({
    _id: courseId,
    status: CourseStatus.PUBLISHED,
    isDeleted: false,
  });
  if (!course) {
    throw new AppError('Course not found', 404);
  }
  if (course.coursePrice <= 0) {
    throw new AppError('This course is free — enroll directly instead', 400);
  }

  const owned = await Enrollment.findOne({ student: studentId, course: courseId });
  if (owned) {
    throw new AppError('You already own this course', 400);
  }

  return course;
}
