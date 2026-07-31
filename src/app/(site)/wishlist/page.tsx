'use client';

import Link from 'next/link';
import { Trash } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useMoveToCart, useRemoveFromWishlist, useWishlist } from '@/features/wishlist/hooks';
import { Button } from '@/components/ui/button';

export default function WishlistPage() {
  const { status } = useRequireAuth();
  const { data: wishlist, isLoading } = useWishlist(status === 'authenticated');
  const removeFromWishlist = useRemoveFromWishlist();
  const moveToCart = useMoveToCart();

  if (status === 'loading' || isLoading) {
    return <p className="max-w-3xl mx-auto px-6 py-10">Loading...</p>;
  }

  const items = wishlist?.items ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Wishlist</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">
          Your wishlist is empty.{' '}
          <Link href="/" className="underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item._id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">${item.coursePrice}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={moveToCart.isPending}
                  onClick={() => moveToCart.mutate(item._id as string)}
                >
                  Move to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remove from wishlist"
                  onClick={() => removeFromWishlist.mutate(item._id as string)}
                >
                  <Trash className="h-4 w-4" color="red" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
