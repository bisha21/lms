'use client';

import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Layers, PlayCircle } from 'lucide-react';

import { useCourse, useTogglePublishCourse } from '@/features/courses/hooks';
import { useSections } from '@/features/sections/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CourseWizardShell from '@/_component/instructor/CourseWizardShell';

export default function PublishCoursePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: sections = [], isLoading: sectionsLoading } = useSections(courseId);
  const togglePublish = useTogglePublishCourse();

  if (courseLoading || sectionsLoading || !course) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading...</p>;
  }

  const lectureCount = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const isPublished = course.status === 'published';

  function handlePublish() {
    togglePublish.mutate(
      { id: courseId, status: 'published' },
      { onSuccess: () => router.push(`/instructor/courses/${courseId}/curriculum`) }
    );
  }

  return (
    <CourseWizardShell
      courseTitle={course.title}
      step={4}
      footer={
        <>
          <Button variant="outline" onClick={() => router.push(`/instructor/courses/${courseId}/pricing`)}>
            Back
          </Button>
          {isPublished ? (
            <Button variant="outline" disabled>
              <CheckCircle2 className="h-4 w-4" />
              Already published
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={togglePublish.isPending || sections.length === 0}>
              {togglePublish.isPending ? 'Publishing...' : 'Publish course'}
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h1 className="mb-4 text-lg font-semibold text-foreground">Final review</h1>
          <div className="flex gap-4">
            <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
              {course.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground">{course.title}</p>
              {course.subtitle && <p className="text-sm text-muted-foreground">{course.subtitle}</p>}
              <Badge variant={isPublished ? 'success' : 'secondary'} className="mt-2">
                {course.status}
              </Badge>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-5 text-sm">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{sections.length} sections</span>
            </div>
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{lectureCount} lectures</span>
            </div>
            <div className="font-semibold text-foreground">${course.coursePrice}</div>
          </div>

          {sections.length === 0 && (
            <p className="mt-4 rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
              Add at least one section with a lecture before publishing.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Before you publish</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Double-check your pricing.</li>
            <li>Preview each lecture&apos;s video plays correctly.</li>
            <li>Students see published courses immediately in the catalog.</li>
          </ul>
        </div>
      </div>
    </CourseWizardShell>
  );
}
