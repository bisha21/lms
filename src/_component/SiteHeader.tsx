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
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <Link href="/" className="text-lg font-bold text-foreground">
        LMS
      </Link>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">
          Courses
        </Link>
        {session && (
          <>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/my-courses" className="hover:text-foreground">
              My Courses
            </Link>
            <Link href="/wishlist" className="relative hover:text-foreground" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {!!wishlist?.items.length && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.items.length}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative hover:text-foreground" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {!!cart?.items.length && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.items.length}
                </span>
              )}
            </Link>
            <Link href="/payments" className="hover:text-foreground">
              Payments
            </Link>
            {can(session.user?.role, 'admin:overview') && (
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
            )}
            {can(session.user?.role, 'instructor:overview') && (
              <Link href="/instructor" className="hover:text-foreground">
                Instructor
              </Link>
            )}
          </>
        )}
        {status === 'loading' ? null : session ? (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{session.user?.name}</span>
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
