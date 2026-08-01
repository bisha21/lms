'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Only ever rendered for signed-out visitors (and the brief moment the session is
// resolving) — SiteShell swaps to StudentSidebar once a session is confirmed.
const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <Link href="/" className="text-lg font-bold text-brand">
        LMS
      </Link>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link href="/courses" className="hover:text-foreground">
          Courses
        </Link>
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
      </nav>
    </header>
  );
};

export default SiteHeader;
