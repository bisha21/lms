'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourseBySlug } from '@/features/courses/hooks';
import { useLessonContent, useLessons } from '@/features/lessons/hooks';
import { useMarkLessonComplete, useProgress } from '@/features/progress/hooks';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/button';

export default function CoursePlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { status: authStatus } = useRequireAuth();

  // Only used to resolve the course id from its slug — its `lessons` projection is a
  // trimmed summary (no videoUrl/pdfUrl/description); the sidebar list below and the
  // active lesson's full content each come from their own dedicated endpoints instead.
  const { data, isError } = useCourseBySlug(authStatus === 'authenticated' ? slug : '');
  const courseId = data?.course._id as string | undefined;

  const { data: lessons = [] } = useLessons(courseId ?? '');
  const { data: progress } = useProgress(courseId ?? '', !!courseId);
  const markLessonComplete = useMarkLessonComplete(courseId ?? '');

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Resume where the student left off: once the lesson list and progress have both
  // resolved, jump to lastViewedLesson if it's still part of this course, else the first
  // lesson. Runs once — activeLessonId stays null until this (or a manual click) sets it.
  useEffect(() => {
    if (activeLessonId || lessons.length === 0 || progress === undefined) return;
    const resumeId = progress.lastViewedLesson;
    const stillExists = resumeId && lessons.some((l) => l._id === resumeId);
    setActiveLessonId(stillExists ? resumeId : lessons[0]._id);
  }, [activeLessonId, lessons, progress]);

  // The sole source of playable content — re-verified server-side on every navigation,
  // since the query key changes with activeLessonId.
  const { data: activeLesson } = useLessonContent(activeLessonId ?? '');

  useEffect(() => {
    if (isError) {
      router.push(`/courses/${slug}`);
    }
  }, [isError, slug, router]);

  if (authStatus === 'loading' || !courseId) {
    return <p className="max-w-6xl mx-auto px-6 py-10">Loading...</p>;
  }

  const completedLessons = progress?.completedLessons ?? [];
  const percent = progress?.percent ?? 0;
  const activeIndex = lessons.findIndex((l) => l._id === activeLessonId);
  const previousLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson =
    activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

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
                onClick={() => setActiveLessonId(l._id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  l._id === activeLessonId
                    ? 'bg-gray-900 text-white'
                    : 'hover:bg-gray-100 text-gray-800'
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
        {lessons.length === 0 ? (
          <p className="text-gray-500">No lessons yet.</p>
        ) : !activeLesson ? (
          <p className="text-gray-500">Loading lesson...</p>
        ) : (
          <>
            {activeLesson.contentType === 'pdf' ? (
              <iframe
                key={activeLesson._id}
                src={activeLesson.pdfUrl}
                title={activeLesson.title}
                className="w-full h-[600px] rounded-lg border border-gray-200 bg-white"
              />
            ) : (
              <video
                key={activeLesson._id}
                src={activeLesson.videoUrl}
                controls
                className="w-full rounded-lg bg-black"
              />
            )}
            <h1 className="text-xl font-semibold text-gray-900 mt-4">{activeLesson.title}</h1>
            <p className="text-gray-600 mt-2">{activeLesson.description}</p>
            <div className="flex items-center gap-3 mt-4">
              <Button
                variant="outline"
                disabled={!previousLesson}
                onClick={() => previousLesson && setActiveLessonId(previousLesson._id)}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                disabled={!nextLesson}
                onClick={() => nextLesson && setActiveLessonId(nextLesson._id)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                disabled={completedLessons.includes(activeLesson._id)}
                onClick={() => markLessonComplete.mutate(activeLesson._id)}
              >
                {completedLessons.includes(activeLesson._id) ? 'Completed' : 'Mark as complete'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
