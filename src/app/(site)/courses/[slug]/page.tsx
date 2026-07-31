'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
        <span>{course.duration}</span>
        <span className="font-semibold text-gray-900">
          {course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}
        </span>
      </div>

      <div className="mt-6">
        {isEnrolled ? (
          <Button onClick={() => router.push(`/courses/${course.slug}/learn`)}>
            Continue Learning
          </Button>
        ) : (
          <Button onClick={handleEnrollOrBuy} disabled={actionLoading}>
            {course.coursePrice > 0 ? `Buy for $${course.coursePrice}` : 'Enroll for free'}
          </Button>
        )}
      </div>

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
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
