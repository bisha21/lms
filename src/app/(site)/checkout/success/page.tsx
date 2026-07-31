'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useOrderStatus } from '@/features/orders/hooks';

// Purely a status display — it only ever reads GET /api/orders/:id (see
// src/features/orders/hooks.ts / src/app/api/orders/order.controller.ts). It never calls
// anything that could grant enrollment itself; enrollment only happens inside the Stripe
// webhook handler once the payment is verified.
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<p className="max-w-2xl mx-auto px-6 py-10 text-gray-500">Loading...</p>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  useRequireAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const { data: order, isLoading } = useOrderStatus(orderId);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 text-center">
      {isLoading || !order ? (
        <p className="text-gray-500">Loading order...</p>
      ) : order.status === 'paid' ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re enrolled!</h1>
          <p className="text-gray-600 mb-6">
            Payment confirmed for {order.items.length} course{order.items.length === 1 ? '' : 's'}.
          </p>
          <Link href="/my-courses" className="underline text-gray-900">
            Go to My Courses
          </Link>
        </>
      ) : order.status === 'pending' ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Processing your payment...</h1>
          <p className="text-gray-500">This usually only takes a few seconds.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Payment not completed</h1>
          <p className="text-gray-500">
            This order is marked &quot;{order.status}&quot;. If you were charged, contact support.
          </p>
        </>
      )}
    </div>
  );
}
