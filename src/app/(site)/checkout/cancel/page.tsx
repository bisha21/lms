'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function CheckoutCancelPage() {
  useRequireAuth();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Checkout cancelled</h1>
      <p className="text-gray-500 mb-6">No payment was made. Your cart is still here.</p>
      <Link href="/cart" className="underline text-gray-900">
        Back to cart
      </Link>
    </div>
  );
}
