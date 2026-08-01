'use client';

import type { LucideIcon } from 'lucide-react';
import { BookOpen, GraduationCap, Layers } from 'lucide-react';

import { useCourses } from '@/features/courses/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useInstructors } from '@/features/courses/hooks';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';
import { Stagger, StaggerItem } from '@/_component/motion/Stagger';

interface CountUpTileProps {
  icon: LucideIcon;
  value: number;
  label: string;
  colorClassName: string;
}

function CountUpTile({ icon: Icon, value, label, colorClassName }: CountUpTileProps) {
  const { ref, value: display } = useCountUp(value);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colorClassName)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground">
          <span ref={ref}>{display}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function StatsSection() {
  const { data: coursesData } = useCourses({ limit: 1 });
  const { data: categories = [] } = useCategories();
  const { data: instructors = [] } = useInstructors();

  const totalCourses = coursesData?.meta?.total ?? 0;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <CountUpTile
            icon={BookOpen}
            value={totalCourses}
            label="Courses available"
            colorClassName="bg-palette-1-soft text-palette-1"
          />
        </StaggerItem>
        <StaggerItem>
          <CountUpTile
            icon={Layers}
            value={categories.length}
            label="Categories to explore"
            colorClassName="bg-palette-2-soft text-palette-2"
          />
        </StaggerItem>
        <StaggerItem>
          <CountUpTile
            icon={GraduationCap}
            value={instructors.length}
            label="Expert instructors"
            colorClassName="bg-palette-3-soft text-palette-3"
          />
        </StaggerItem>
      </Stagger>
    </section>
  );
}
