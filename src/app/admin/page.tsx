'use client';

import { useAdminDashboard } from '@/features/admin/hooks';

const ACTIVITY_LABEL: Record<string, string> = {
  enrollment: 'Enrollment',
  payment: 'Sale',
  review: 'Review',
  course: 'New course',
};

export default function AdminPage() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading || !data) return <p>Loading...</p>;

  const maxRevenue = Math.max(1, ...data.salesTrend.map((p) => p.revenue));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total revenue</p>
          <p className="text-2xl font-bold text-gray-900">${data.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Students</p>
          <p className="text-2xl font-bold text-gray-900">{data.studentCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Instructors</p>
          <p className="text-2xl font-bold text-gray-900">{data.instructorCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Courses</p>
          <p className="text-2xl font-bold text-gray-900">{data.courseCount}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Sales trend (last 30 days)</h2>
          {data.salesTrend.length === 0 ? (
            <p className="text-sm text-gray-500">No completed sales in this window yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {data.salesTrend.map((point) => (
                <div
                  key={point.date}
                  className="flex-1 bg-gray-900 rounded-t-sm"
                  style={{ height: `${Math.max(4, (point.revenue / maxRevenue) * 100)}%` }}
                  title={`${point.date}: $${point.revenue.toFixed(2)}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentActivity.map((item, i) => (
                <li key={i} className="text-sm text-gray-700 flex justify-between gap-4">
                  <span>
                    <span className="text-gray-400">[{ACTIVITY_LABEL[item.type]}]</span> {item.message}
                  </span>
                  <span className="text-gray-400 whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
