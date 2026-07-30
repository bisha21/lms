'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCourses } from '@/redux/courses/coursesSlice';
import { fetchCategories } from '@/redux/category/categorySlice';

export default function CatalogPage() {
  const dispatch = useAppDispatch();
  const { courses, meta } = useAppSelector((store) => store.courses);
  const { categories } = useAppSelector((store) => store.categores);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchCourses({
        page,
        limit: 9,
        search: search || undefined,
        category: category || undefined,
      })
    );
  }, [dispatch, page, search, category]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Explore courses</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="flex-1 border border-gray-300 rounded-md px-4 py-2"
        />
        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="border border-gray-300 rounded-md px-4 py-2"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {courses.length === 0 ? (
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
              onClick={() => setPage(p)}
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
