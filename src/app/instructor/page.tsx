'use client';

import { useInstructorDashboard } from '@/features/instructor/hooks';

export default function InstructorPage() {
  const { data, isLoading } = useInstructorDashboard();

  if (isLoading || !data) {
    return <p className="max-w-6xl mx-auto px-6 py-10">Loading...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Instructor Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total revenue</p>
          <p className="text-2xl font-bold text-gray-900">${data.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Enrolled students</p>
          <p className="text-2xl font-bold text-gray-900">{data.enrolledStudentsCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Published courses</p>
          <p className="text-2xl font-bold text-gray-900">{data.publishedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Drafts</p>
          <p className="text-2xl font-bold text-gray-900">{data.draftCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h2 className="font-semibold text-gray-900 p-4 pb-0">Course performance</h2>
        <table className="min-w-full mt-2">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-900">
              <th className="p-4">Course</th>
              <th className="p-4">Status</th>
              <th className="p-4">Enrollments</th>
              <th className="p-4">Revenue</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Completion</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.coursePerformance.map((course) => (
              <tr key={course._id} className="text-sm text-gray-900">
                <td className="p-4">{course.title}</td>
                <td className="p-4 capitalize">{course.status}</td>
                <td className="p-4">{course.enrollmentCount}</td>
                <td className="p-4">${course.revenue.toFixed(2)}</td>
                <td className="p-4">{course.averageRating ?? '—'}</td>
                <td className="p-4">{course.completionRate === null ? '—' : `${course.completionRate}%`}</td>
              </tr>
            ))}
            {data.coursePerformance.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No courses yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
