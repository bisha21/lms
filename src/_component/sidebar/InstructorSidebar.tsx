'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, LayoutDashboard, Megaphone, Users, Wallet, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

interface InstructorSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function InstructorSidebar({ open, onClose }: InstructorSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col border-r border-border bg-card transition-transform md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0',
          open && 'translate-x-0'
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5 md:hidden">
          <span className="text-base font-bold text-brand">LMS</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-5">
          <span className="inline-flex items-center rounded-full bg-palette-1-soft px-2.5 py-1 text-xs font-semibold text-brand">
            Instructor Studio
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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

        <div className="shrink-0 border-t border-border p-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Visit site
          </Link>
        </div>
      </aside>
    </>
  );
}
