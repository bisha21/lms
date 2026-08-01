'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

// The marketing header — shown on the landing page regardless of auth state (so signed-in
// users still land on the normal marketing page, not the app sidebar), and everywhere else
// only for signed-out visitors (SiteShell swaps to StudentSidebar once a session is
// confirmed on any other route).
const SiteHeader = () => {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <Link href="/" className="text-lg font-bold text-brand">
        LMS
      </Link>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">
          Courses
        </Link>
        {status === 'loading' ? null : session ? (
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
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
