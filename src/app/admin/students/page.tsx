'use client';

import { useEffect, useState } from 'react';
import { API } from '@/http/http';

interface IOverviewRow {
  _id: string;
  title: string;
  coursePrice: number;
  enrollmentCount: number;
  revenue: number;
}

export default function AdminStudentsPage() {
  const [rows, setRows] = useState<IOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/overview')
      .then((res) => setRows(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const totalEnrollments = rows.reduce((sum, r) => sum + r.enrollmentCount, 0);
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Enrollments & Revenue</h1>

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total enrollments</p>
          <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total revenue</p>
          <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <table className="min-w-full rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gray-50 text-left text-sm text-gray-900">
            <th className="p-4">Course</th>
            <th className="p-4">Price</th>
            <th className="p-4">Enrollments</th>
            <th className="p-4">Revenue</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row) => (
            <tr key={row._id} className="text-sm text-gray-900">
              <td className="p-4">{row.title}</td>
              <td className="p-4">{row.coursePrice > 0 ? `$${row.coursePrice}` : 'Free'}</td>
              <td className="p-4">{row.enrollmentCount}</td>
              <td className="p-4">${row.revenue.toFixed(2)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No courses yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
