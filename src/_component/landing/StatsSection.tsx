'use client';

import { BookOpen, GraduationCap, Layers } from 'lucide-react';

import { useCourses } from '@/features/courses/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useInstructors } from '@/features/courses/hooks';
import StatTile from '@/_component/StatTile';

export default function StatsSection() {
  const { data: coursesData } = useCourses({ limit: 1 });
  const { data: categories = [] } = useCategories();
  const { data: instructors = [] } = useInstructors();

  const totalCourses = coursesData?.meta?.total ?? 0;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          icon={BookOpen}
          value={totalCourses}
          label="Courses available"
          colorClassName="bg-blue-500/10 text-blue-600"
        />
        <StatTile
          icon={Layers}
          value={categories.length}
          label="Categories to explore"
          colorClassName="bg-emerald-500/10 text-emerald-600"
        />
        <StatTile
          icon={GraduationCap}
          value={instructors.length}
          label="Expert instructors"
          colorClassName="bg-purple-500/10 text-purple-600"
        />
      </div>
    </section>
  );
}
