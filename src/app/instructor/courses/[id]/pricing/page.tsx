'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useCourse, useUpdateCourse } from '@/features/courses/hooks';
import { Button } from '@/components/ui/button';
import CourseWizardShell from '@/_component/instructor/CourseWizardShell';

export default function CoursePricingPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: course, isLoading } = useCourse(courseId);
  const updateCourse = useUpdateCourse();

  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (course) setPrice(course.coursePrice);
  }, [course]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateCourse.mutate(
      { id: courseId, data: { coursePrice: price } },
      { onSuccess: () => router.push(`/instructor/courses/${courseId}/publish`) }
    );
  }

  if (isLoading || !course) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading...</p>;
  }

  return (
    <CourseWizardShell
      courseTitle={course.title}
      step={3}
      footer={
        <>
          <Button variant="outline" onClick={() => router.push(`/instructor/courses/${courseId}/curriculum`)}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={updateCourse.isPending}>
            {updateCourse.isPending ? 'Saving...' : 'Continue to Publish'}
          </Button>
        </>
      }
    >
      <div className="max-w-md rounded-xl border border-border bg-card p-5">
        <h1 className="mb-1 text-lg font-semibold text-foreground">Pricing</h1>
        <p className="mb-4 text-sm text-muted-foreground">Set what students pay for this course.</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-foreground">Course price (USD)</label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background py-2 pl-7 pr-3 text-sm"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Set to 0 to offer this course for free.</p>
        </form>
      </div>
    </CourseWizardShell>
  );
}
