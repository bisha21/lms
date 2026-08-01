'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu } from 'lucide-react';

interface InstructorTopbarProps {
  onOpenNav: () => void;
}

export default function InstructorTopbar({ onOpenNav }: InstructorTopbarProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (session?.user?.name ?? session?.user?.email ?? '?').slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="text-foreground md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/instructor" className="text-lg font-bold text-brand">
          LMS
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Account menu"
          className="flex items-center gap-2"
        >
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-9 w-9 rounded-full" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-palette-1-soft text-sm font-semibold text-brand">
              {initials}
            </div>
          )}
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-30 cursor-default"
            />
            <div className="absolute right-0 top-11 z-40 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium text-foreground">{session?.user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
