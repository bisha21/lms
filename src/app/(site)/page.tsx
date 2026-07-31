'use client';

import { Suspense, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCategories } from '@/features/categories/hooks';
import { useCourses, useInstructors } from '@/features/courses/hooks';
import { CourseSortParam } from '@/lib/queryKeys';

const SORT_OPTIONS: { value: CourseSortParam; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'best-selling', label: 'Best Selling' },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '4', label: '4 & up' },
  { value: '3', label: '3 & up' },
  { value: '2', label: '2 & up' },
  { value: '1', label: '1 & up' },
];

export default function CatalogPage() {
  return (
    <Suspense fallback={<p className="max-w-6xl mx-auto px-6 py-10 text-gray-500">Loading...</p>}>
      <CatalogPageContent />
    </Suspense>
  );
}

function CatalogPageContent() {
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Explore courses</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => updateParams({ search: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2 lg:col-span-2"
        />
        <select
          value={category}
          onChange={(e) => updateParams({ category: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={instructor}
          onChange={(e) => updateParams({ instructor: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2"
        >
          <option value="">All instructors</option>
          {instructors.map((i) => (
            <option key={i._id} value={i._id}>
              {i.username}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <select
          value={level}
          onChange={(e) => updateParams({ level: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2"
        >
          {LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Language"
          value={language}
          onChange={(e) => updateParams({ language: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2"
        />
        <input
          type="number"
          min={0}
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => updateParams({ minPrice: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2"
        />
        <input
          type="number"
          min={0}
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => updateParams({ maxPrice: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2"
        />
        <select
          value={minRating}
          onChange={(e) => updateParams({ minRating: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2"
        >
          {RATING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end mb-6">
        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="border border-gray-300 rounded-md px-4 py-2"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">No courses found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course._id}
              href={`/courses/${course.slug}`}
              className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {course.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {course.level && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                      {course.level}
                    </span>
                  )}
                  {typeof course.averageRating === 'number' && (
                    <span className="text-xs text-yellow-600">
                      ★ {course.averageRating} ({course.reviewCount})
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-gray-900">{course.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {course.courseDescription}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-500">{course.duration}</span>
                  <span className="font-semibold text-gray-900">
                    {course.coursePrice > 0 ? `$${course.coursePrice}` : 'Free'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParams({ page: String(p) }, { resetPage: false })}
              className={`px-3 py-1 rounded-md border ${
                p === page ? 'bg-gray-900 text-white' : 'border-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
