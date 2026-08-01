'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  BookOpen,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Presentation,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { can } from '@/lib/rbac/permissions';
import { useCart } from '@/features/cart/hooks';
import { useWishlist } from '@/features/wishlist/hooks';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface StudentSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function StudentSidebar({ open, onClose }: StudentSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: cart } = useCart(!!session);
  const { data: wishlist } = useWishlist(!!session);

  const navItems: NavItem[] = [
    { href: '/courses', label: 'Browse Courses', icon: BookOpen },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/my-courses', label: 'My Courses', icon: GraduationCap },
    { href: '/wishlist', label: 'Wishlist', icon: Heart, count: wishlist?.items.length },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, count: cart?.items.length },
    { href: '/payments', label: 'Payments', icon: Receipt },
  ];

  if (can(session?.user?.role, 'admin:overview')) {
    navItems.push({ href: '/admin', label: 'Admin', icon: ShieldCheck });
  }
  if (can(session?.user?.role, 'instructor:overview')) {
    navItems.push({ href: '/instructor', label: 'Instructor', icon: Presentation });
  }

  const initials = (session?.user?.name ?? session?.user?.email ?? '?').slice(0, 1).toUpperCase();

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
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col border-r border-border bg-card transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0',
          open && 'translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/" className="text-lg font-bold text-brand">
            LMS
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'mb-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-palette-1-soft text-brand'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                {!!item.count && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-palette-1-soft text-sm font-semibold text-brand">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{session?.user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
