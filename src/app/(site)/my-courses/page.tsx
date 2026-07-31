'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useMyEnrollments } from '@/features/enrollments/hooks';

export default function MyCoursesPage() {
  const { status } = useRequireAuth();
  const { data: enrollments = [] } = useMyEnrollments(status === 'authenticated');

  if (status === 'loading') return <p className="max-w-4xl mx-auto px-6 py-10">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h1>
      {enrollments.length === 0 ? (
        <p className="text-gray-500">
          You are not enrolled in any courses yet.{' '}
          <Link href="/" className="underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => (
            <Link
              key={enrollment._id}
              href={`/courses/${enrollment.course.slug}/learn`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-gray-900">{enrollment.course.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{enrollment.course.duration}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
