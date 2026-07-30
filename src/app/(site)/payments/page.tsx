'use client';

import { useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchMyPayments } from '@/redux/payments/paymentsSlice';

export default function PaymentsPage() {
  const { status } = useRequireAuth();
  const dispatch = useAppDispatch();
  const { payments } = useAppSelector((store) => store.payments);

  useEffect(() => {
    if (status === 'authenticated') {
      dispatch(fetchMyPayments());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <p className="max-w-4xl mx-auto px-6 py-10">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment history</h1>
      {payments.length === 0 ? (
        <p className="text-gray-500">No payments yet.</p>
      ) : (
        <table className="min-w-full bg-white rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-700">
              <th className="p-4">Course</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment._id} className="text-sm text-gray-900">
                <td className="p-4">{payment.course?.title}</td>
                <td className="p-4">
                  {payment.amount} {payment.currency.toUpperCase()}
                </td>
                <td className="p-4 capitalize">{payment.status}</td>
                <td className="p-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
