'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart, Tag, Trash2 } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useApplyCoupon, useCart, useRemoveCoupon, useRemoveFromCart } from '@/features/cart/hooks';
import { useCheckoutCart } from '@/features/payments/hooks';
import { Button } from '@/components/ui/button';
import Reveal from '@/_component/motion/Reveal';

export default function CartPage() {
  const { status } = useRequireAuth();
  const { data: cart, isLoading } = useCart(status === 'authenticated');
  const removeFromCart = useRemoveFromCart();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const checkoutCart = useCheckoutCart();
  const [couponInput, setCouponInput] = useState('');

  if (status === 'loading' || isLoading) {
    return <p className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">Loading...</p>;
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Reveal>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Your Cart</h1>
      </Reveal>

      {items.length === 0 ? (
        <Reveal>
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Your cart is empty.{' '}
              <Link href="/courses" className="font-medium text-brand hover:underline">
                Browse the catalog
              </Link>
            </p>
          </div>
        </Reveal>
      ) : (
        <>
          <ul className="mb-8 space-y-3">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.duration}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-foreground">${item.coursePrice}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Remove from cart"
                      onClick={() => removeFromCart.mutate(item._id as string)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <Reveal>
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg bg-success-soft px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-success">
                    <Tag className="h-3.5 w-3.5" />
                    Coupon <span className="font-semibold">{appliedCoupon.code}</span> applied
                  </span>
                  <button
                    onClick={() => removeCoupon.mutate()}
                    className="text-muted-foreground underline"
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
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <Button type="submit" variant="outline" disabled={applyCoupon.isPending}>
                    Apply
                  </Button>
                </form>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-lg font-bold text-foreground">${subtotal}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={checkoutCart.isPending}
                onClick={() => checkoutCart.mutate(undefined)}
              >
                {checkoutCart.isPending ? 'Redirecting to checkout...' : 'Proceed to Checkout'}
              </Button>
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}
