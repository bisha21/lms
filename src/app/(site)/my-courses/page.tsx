'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useMyEnrollments } from '@/features/enrollments/hooks';
import CourseCard from '@/_component/course/CourseCard';

export default function MyCoursesPage() {
  const { status } = useRequireAuth();
  const { data: enrollments = [] } = useMyEnrollments(status === 'authenticated');

  if (status === 'loading') {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">My Courses</h1>
      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You are not enrolled in any courses yet.{' '}
          <Link href="/courses" className="font-medium text-primary hover:underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <CourseCard
              key={enrollment._id}
              course={enrollment.course}
              href={`/courses/${enrollment.course.slug}/learn`}
              showActions={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
