'use client';

import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useWishlist } from '@/features/wishlist/hooks';
import CourseCard from '@/_component/course/CourseCard';

export default function WishlistPage() {
  const { status } = useRequireAuth();
  const { data: wishlist, isLoading } = useWishlist(status === 'authenticated');

  if (status === 'loading' || isLoading) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-muted-foreground">Loading...</p>;
  }

  const items = wishlist?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Your Wishlist</h1>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your wishlist is empty.{' '}
          <Link href="/courses" className="font-medium text-primary hover:underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CourseCard key={item._id} course={item} />
          ))}
        </div>
      )}
    </div>
  );
}
