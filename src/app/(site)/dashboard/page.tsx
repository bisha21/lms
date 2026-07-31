'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useMyEnrollments } from '@/features/enrollments/hooks';
import { useWishlist } from '@/features/wishlist/hooks';
import { useMyPayments } from '@/features/payments/hooks';
import { useContinueLearning } from '@/features/progress/hooks';

export default function StudentDashboardPage() {
  const { status } = useRequireAuth();
  const authed = status === 'authenticated';

  const { data: continueLearning = [], isLoading: loadingContinue } = useContinueLearning(authed);
  const { data: enrollments = [] } = useMyEnrollments(authed);
  const { data: wishlist } = useWishlist(authed);
  const { data: payments = [] } = useMyPayments(authed);

  if (status === 'loading') return <p className="max-w-5xl mx-auto px-6 py-10">Loading...</p>;

  const wishlistItems = wishlist?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>

      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Continue Learning</h2>
        {loadingContinue ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : continueLearning.length === 0 ? (
          <p className="text-sm text-gray-500">
            No courses in progress yet.{' '}
            <Link href="/my-courses" className="underline">
              Browse your courses
            </Link>
            .
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {continueLearning.map((item) => (
              <Link
                key={item.course._id}
                href={`/courses/${item.course.slug}/learn`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900">{item.course.title}</h3>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gray-900" style={{ width: `${item.percent}%` }} />
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.percent}% complete</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">My Courses</h2>
          <Link href="/my-courses" className="text-sm underline text-gray-600">
            View all
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Enrolled in {enrollments.length} course{enrollments.length === 1 ? '' : 's'}.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Wishlist</h2>
          <Link href="/wishlist" className="text-sm underline text-gray-600">
            View all
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          {wishlistItems.length} course{wishlistItems.length === 1 ? '' : 's'} saved.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Purchase History</h2>
          <Link href="/payments" className="text-sm underline text-gray-600">
            View all
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          {payments.length} payment{payments.length === 1 ? '' : 's'} on record.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Certificates</h2>
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-4">
          Certificates aren&apos;t available yet — this feature hasn&apos;t been built.
        </p>
      </section>
    </div>
  );
}
