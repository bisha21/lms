'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const SiteHeader = () => {
  const { data: session, status } = useSession();

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
            <Link href="/payments" className="hover:text-gray-900">
              Payments
            </Link>
            {session.user?.role === 'admin' && (
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
