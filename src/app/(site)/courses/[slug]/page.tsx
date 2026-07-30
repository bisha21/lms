'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { API } from '@/http/http';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchMyEnrollments, enrollInCourse } from '@/redux/enrollments/enrollmentsSlice';
import { checkoutCourse } from '@/redux/payments/paymentsSlice';
import { Button } from '@/components/ui/button';
import { ICourse } from '@/redux/courses/type';
import { ILesson } from '@/redux/lessons/type';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { enrollments } = useAppSelector((store) => store.enrollments);

  const [course, setCourse] = useState<ICourse | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    API.get(`/courses/slug/${slug}`)
      .then((res) => {
        setCourse(res.data.data.course);
        setLessons(res.data.data.lessons);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (session) {
      dispatch(fetchMyEnrollments());
    }
  }, [session, dispatch]);

  if (loading) return <p className="max-w-4xl mx-auto px-6 py-10">Loading...</p>;
  if (!course) return <p className="max-w-4xl mx-auto px-6 py-10">Course not found.</p>;

  const isEnrolled = enrollments.some((e) => e.course?._id === course._id);

  const handleEnrollOrBuy = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    setActionLoading(true);
    try {
      if (course.coursePrice > 0) {
        await dispatch(checkoutCourse(course._id as string));
      } else {
        await dispatch(enrollInCourse(course._id as string));
        router.push(`/courses/${course.slug}/learn`);
      }
    } finally {
      setActionLoading(false);
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
