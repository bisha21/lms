'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { useCourses } from '@/features/courses/hooks';
import CourseCard from '@/_component/course/CourseCard';
import SectionHeading from '@/_component/SectionHeading';
import { Stagger, StaggerItem } from '@/_component/motion/Stagger';

export default function PopularCoursesSection() {
  const { data, isLoading } = useCourses({ sort: 'popular', limit: 4 });
  const courses = data?.courses ?? [];

  if (!isLoading && courses.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeading
        title="Popular courses"
        subtitle="Handpicked and loved by our community"
        action={
          <Link
            href="/courses"
            className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-video w-full bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-5 w-1/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <StaggerItem key={course._id}>
              <CourseCard course={course} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
