'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Megaphone, Menu, Search, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, LayoutDashboard, Users, Wallet } from 'lucide-react';

import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructor/courses', label: 'Courses', icon: BookOpen },
  { href: '/instructor/students', label: 'Students', icon: Users },
  { href: '/instructor/revenue', label: 'Revenue', icon: Wallet },
  { href: '/instructor/announcements', label: 'Announcements', icon: Megaphone },
];

export default function InstructorTopNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState('');

  const initials = (session?.user?.name ?? session?.user?.email ?? '?').slice(0, 1).toUpperCase();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = search.trim();
    router.push(trimmed ? `/instructor/courses?search=${encodeURIComponent(trimmed)}` : '/instructor/courses');
    setMobileNavOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="text-foreground lg:hidden"
          >
            {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link href="/instructor" className="flex items-center gap-1.5 text-base font-bold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs text-background">
              BT
            </span>
            <span className="hidden sm:inline">LMS</span>
          </Link>
        </div>

        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={handleSearch} className="relative ml-auto hidden max-w-xs flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, students, revenue..."
            className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm"
          />
        </form>

        <div className="relative ml-auto md:ml-0">
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
      </div>

      {mobileNavOpen && (
        <div className="border-t border-border px-4 py-3 lg:hidden">
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, students, revenue..."
              className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm"
            />
          </form>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-palette-1-soft text-brand'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
