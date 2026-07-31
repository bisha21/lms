'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { can } from '@/lib/rbac/permissions';
import { useCart } from '@/features/cart/hooks';
import { useWishlist } from '@/features/wishlist/hooks';

const SiteHeader = () => {
  const { data: session, status } = useSession();
  const { data: cart } = useCart(!!session);
  const { data: wishlist } = useWishlist(!!session);

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-gray-200 bg-white">
      <Link href="/" className="font-bold text-lg text-gray-900">
        LMS
      </Link>
      <nav className="flex items-center gap-4 text-sm text-gray-700">
        {session && (
          <>
            <Link href="/my-courses" className="hover:text-gray-900">
              My Courses
            </Link>
            <Link href="/wishlist" className="relative hover:text-gray-900" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {!!wishlist?.items.length && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-gray-900 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.items.length}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative hover:text-gray-900" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {!!cart?.items.length && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-gray-900 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.items.length}
                </span>
              )}
            </Link>
            <Link href="/payments" className="hover:text-gray-900">
              Payments
            </Link>
            {can(session.user?.role, 'admin:overview') && (
              <Link href="/admin" className="hover:text-gray-900">
                Admin
              </Link>
            )}
          </>
        )}
        {status === 'loading' ? null : session ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-500">{session.user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default SiteHeader;
