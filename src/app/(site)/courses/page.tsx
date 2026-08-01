'use client';

import { Suspense, useCallback } from 'react';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useCategories } from '@/features/categories/hooks';
import { useCourses, useInstructors } from '@/features/courses/hooks';
import { CourseSortParam } from '@/lib/queryKeys';
import CourseCard from '@/_component/course/CourseCard';
import CourseFilterSidebar from '@/_component/course/CourseFilterSidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Stagger, StaggerItem } from '@/_component/motion/Stagger';

const SORT_OPTIONS: { value: CourseSortParam; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'best-selling', label: 'Best Selling' },
];

export default function CoursesPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading...</p>}>
      <CoursesPageContent />
    </Suspense>
  );
}

function CoursesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const level = searchParams.get('level') ?? '';
  const language = searchParams.get('language') ?? '';
  const instructor = searchParams.get('instructor') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const minRating = searchParams.get('minRating') ?? '';
  const sort = (searchParams.get('sort') as CourseSortParam) || 'newest';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const { data: categories = [] } = useCategories();
  const { data: instructors = [] } = useInstructors();
  const { data, isLoading } = useCourses({
    page,
    limit: 9,
    search: search || undefined,
    category: category || undefined,
    level: level || undefined,
    language: language || undefined,
    instructor: instructor || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    sort,
  });
  const courses = data?.courses ?? [];
  const meta = data?.meta;

  // Keeps every filter/sort/page value in the URL (shareable/bookmarkable links) instead of
  // local component state. Changing any filter resets to page 1 unless told not to.
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>, opts?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (opts?.resetPage !== false) next.delete('page');
      router.replace(next.size > 0 ? `${pathname}?${next.toString()}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const resetFilters = () => router.replace(pathname, { scroll: false });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Explore courses</h1>
          {meta && <p className="text-sm text-muted-foreground">{meta.total} courses found</p>}
        </div>
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses, instructors..."
            value={search}
            onChange={(e) => updateParams({ search: e.target.value })}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={instructor}
          onChange={(e) => updateParams({ instructor: e.target.value })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-56"
        >
          <option value="">All instructors</option>
          {instructors.map((i) => (
            <option key={i._id} value={i._id}>
              {i.username}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <CourseFilterSidebar
          categories={categories}
          category={category}
          onCategoryChange={(value) => updateParams({ category: value })}
          level={level}
          onLevelChange={(value) => updateParams({ level: value })}
          language={language}
          onLanguageChange={(value) => updateParams({ language: value })}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={(value) => updateParams({ minPrice: value })}
          onMaxPriceChange={(value) => updateParams({ maxPrice: value })}
          minRating={minRating}
          onMinRatingChange={(value) => updateParams({ minRating: value })}
          onReset={resetFilters}
        />

        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
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
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses found.</p>
          ) : (
            <Stagger className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <StaggerItem key={course._id}>
                  <CourseCard course={course} />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === page ? 'default' : 'outline'}
                  className={cn('h-9 w-9 p-0')}
                  onClick={() => updateParams({ page: String(p) }, { resetPage: false })}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
