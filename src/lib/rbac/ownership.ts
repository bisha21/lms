import { Session } from 'next-auth';
import { AppError } from '@/lib/appError';
import { bypassesOwnership } from './permissions';

interface OwnedCourse {
  instructor?: { equals: (id: string) => boolean } | null;
}

// A course with no instructor set (legacy/seed data) is treated as ownerless — anyone with
// the relevant role-level permission may act on it, matching the pre-existing behavior of
// the assertOwnership/requireCourseOwner checks this replaces.
export function ownsCourse(course: OwnedCourse, session: Session): boolean {
  if (bypassesOwnership(session.user.role)) return true;
  return !course.instructor || course.instructor.equals(session.user.id);
}

export function assertCourseOwnership(course: OwnedCourse, session: Session): void {
  if (!ownsCourse(course, session)) {
    throw new AppError('You do not own this course', 403);
  }
}
