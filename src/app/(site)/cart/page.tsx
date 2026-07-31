'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useApplyCoupon, useCart, useRemoveCoupon, useRemoveFromCart } from '@/features/cart/hooks';
import { useCheckoutCart } from '@/features/payments/hooks';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const { status } = useRequireAuth();
  const { data: cart, isLoading } = useCart(status === 'authenticated');
  const removeFromCart = useRemoveFromCart();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const checkoutCart = useCheckoutCart();
  const [couponInput, setCouponInput] = useState('');

  if (status === 'loading' || isLoading) {
    return <p className="max-w-3xl mx-auto px-6 py-10">Loading...</p>;
  }

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => sum + item.coursePrice, 0);
  const appliedCoupon = cart?.appliedCoupon;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    applyCoupon.mutate(couponInput.trim());
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">
          Your cart is empty.{' '}
          <Link href="/" className="underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <>
          <ul className="space-y-3 mb-8">
            {items.map((item) => (
              <li
                key={item._id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.duration}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">${item.coursePrice}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Remove from cart"
                    onClick={() => removeFromCart.mutate(item._id as string)}
                  >
                    <Trash className="h-4 w-4" color="red" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
            {appliedCoupon ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  Coupon <span className="font-semibold">{appliedCoupon.code}</span> applied
                </span>
                <button
                  onClick={() => removeCoupon.mutate()}
                  className="text-gray-500 underline"
                  type="button"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <Button type="submit" variant="outline" disabled={applyCoupon.isPending}>
                  Apply
                </Button>
              </form>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>${subtotal}</span>
            </div>

            <Button
              className="w-full"
              disabled={checkoutCart.isPending}
              onClick={() => checkoutCart.mutate(undefined)}
            >
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
