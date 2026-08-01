'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu, Search } from 'lucide-react';

interface InstructorTopNavProps {
  onOpenSidebar: () => void;
}

export default function InstructorTopNav({ onOpenSidebar }: InstructorTopNavProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const initials = (session?.user?.name ?? session?.user?.email ?? '?').slice(0, 1).toUpperCase();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = search.trim();
    router.push(trimmed ? `/instructor/courses?search=${encodeURIComponent(trimmed)}` : '/instructor/courses');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        className="text-foreground lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <form onSubmit={handleSearch} className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses, students, revenue..."
          className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm"
        />
      </form>

      <div className="relative ml-auto">
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
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Visit site
              </Link>
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
