'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourseBySlug } from '@/features/courses/hooks';
import { useLessons } from '@/features/lessons/hooks';
import { useMarkLessonComplete, useProgress } from '@/features/progress/hooks';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/button';

export default function CoursePlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { status: authStatus } = useRequireAuth();
  const [activeLesson, setActiveLesson] = useState(0);

  // Only used to resolve the course id from its slug — its `lessons` projection is
  // a trimmed summary (title/order/durationSeconds only, no videoUrl/description),
  // so the full lesson content below comes from useLessons(courseId) instead.
  const { data, isError } = useCourseBySlug(authStatus === 'authenticated' ? slug : '');
  const courseId = data?.course._id as string | undefined;

  const { data: lessons = [] } = useLessons(courseId ?? '');
  const { data: progress } = useProgress(courseId ?? '', !!courseId);
  const markLessonComplete = useMarkLessonComplete(courseId ?? '');

  useEffect(() => {
    if (isError) {
      router.push(`/courses/${slug}`);
    }
  }, [isError, slug, router]);

  if (authStatus === 'loading' || !courseId) {
    return <p className="max-w-6xl mx-auto px-6 py-10">Loading...</p>;
  }

  const lesson = lessons[activeLesson];
  const completedLessons = progress?.completedLessons ?? [];
  const percent = progress?.percent ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-[280px_1fr] gap-8">
      <aside>
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-sm text-gray-500 mt-1">{percent}% complete</p>
        </div>
        <ol className="space-y-1">
          {lessons.map((l, i) => (
            <li key={l._id}>
              <button
                onClick={() => setActiveLesson(i)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  i === activeLesson ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                {completedLessons.includes(l._id) ? '✓ ' : ''}
                {i + 1}. {l.title}
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <div>
        {lesson ? (
          <>
            <video key={lesson._id} src={lesson.videoUrl} controls className="w-full rounded-lg bg-black" />
            <h1 className="text-xl font-semibold text-gray-900 mt-4">{lesson.title}</h1>
            <p className="text-gray-600 mt-2">{lesson.description}</p>
            <Button
              className="mt-4"
              disabled={completedLessons.includes(lesson._id)}
              onClick={() => markLessonComplete.mutate(lesson._id)}
            >
              {completedLessons.includes(lesson._id) ? 'Completed' : 'Mark as complete'}
            </Button>
          </>
        ) : (
          <p className="text-gray-500">No lessons yet.</p>
        )}
      </div>
    </div>
  );
}
