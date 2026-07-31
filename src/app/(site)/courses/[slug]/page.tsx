'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCourseBySlug } from '@/features/courses/hooks';
import { useEnrollInCourse, useMyEnrollments } from '@/features/enrollments/hooks';
import { useCheckoutCourse } from '@/features/payments/hooks';
import { Button } from '@/components/ui/button';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading } = useCourseBySlug(slug);
  const { data: enrollments = [] } = useMyEnrollments(!!session);
  const enrollInCourse = useEnrollInCourse();
  const checkoutCourse = useCheckoutCourse();

  const course = data?.course;
  const lessons = data?.lessons ?? [];
  const actionLoading = enrollInCourse.isPending || checkoutCourse.isPending;

  if (isLoading) return <p className="max-w-4xl mx-auto px-6 py-10">Loading...</p>;
  if (!course) return <p className="max-w-4xl mx-auto px-6 py-10">Course not found.</p>;

  const isEnrolled = enrollments.some((e) => e.course?._id === course._id);
  const instructor = typeof course.instructor === 'string' ? null : course.instructor;

  const handleEnrollOrBuy = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    try {
      if (course.coursePrice > 0) {
        await checkoutCourse.mutateAsync(course._id as string);
      } else {
        await enrollInCourse.mutateAsync(course._id as string);
        router.push(`/courses/${course.slug}/learn`);
      }
    } catch {
      // toasted by the mutation's onError; stay on the page.
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
      <p className="text-gray-600 mt-3">{course.courseDescription}</p>
      <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-gray-500">
        <span>{course.duration}</span>
        {course.level && <span className="capitalize">{course.level}</span>}
        {course.language && <span>{course.language}</span>}
        <span className="font-semibold text-gray-900">
          {course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}
        </span>
      </div>

      <div className="mt-6 flex items-center gap-3">
        {isEnrolled ? (
          <Button onClick={() => router.push(`/courses/${course.slug}/learn`)}>
            Continue Learning
          </Button>
        ) : (
          <Button onClick={handleEnrollOrBuy} disabled={actionLoading}>
            {course.coursePrice > 0 ? `Buy for $${course.coursePrice}` : 'Enroll for free'}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => toast.info('Cart is coming soon')}
        >
          Add to Cart
        </Button>
      </div>

      {instructor && (
        <div className="mt-10 flex items-center gap-3">
          {instructor.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={instructor.profileImage}
              alt={instructor.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200" />
          )}
          <div>
            <p className="text-xs text-gray-500">Instructor</p>
            <p className="font-medium text-gray-900">{instructor.username}</p>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Curriculum</h2>
        <ol className="space-y-2">
          {lessons.map((lesson, i) => (
            <li
              key={lesson._id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3"
            >
              <span className="text-gray-800">
                {i + 1}. {lesson.title}
              </span>
              {!isEnrolled && <Lock className="h-4 w-4 text-gray-400" aria-label="Locked" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h2>
        {data?.reviewCount ? (
          <p className="text-gray-700">
            ★ {data.averageRating} average from {data.reviewCount} rating
            {data.reviewCount === 1 ? '' : 's'}
          </p>
        ) : (
          <p className="text-gray-500">No ratings yet.</p>
        )}
      </div>
    </div>
  );
}
