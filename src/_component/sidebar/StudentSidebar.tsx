'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Flame,
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
import { useMyEnrollments } from '@/features/enrollments/hooks';
import { useMyPayments } from '@/features/payments/hooks';
import { useContinueLearning } from '@/features/progress/hooks';
import { Progress } from '@/components/ui/progress';

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
  const authed = !!session;

  const { data: cart } = useCart(authed);
  const { data: wishlist } = useWishlist(authed);
  const { data: enrollments = [] } = useMyEnrollments(authed);
  const { data: payments = [] } = useMyPayments(authed);
  const { data: continueLearning = [] } = useContinueLearning(authed);

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/my-courses', label: 'My Courses', icon: GraduationCap, count: enrollments.length },
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
  const avgProgress =
    continueLearning.length > 0
      ? Math.round(continueLearning.reduce((sum, item) => sum + item.percent, 0) / continueLearning.length)
      : null;

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
          'fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 -translate-x-full flex-col border-r border-border bg-card transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0',
          open && 'translate-x-0'
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
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

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {/* Profile */}
          <div className="flex items-center gap-3 px-1">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="h-11 w-11 shrink-0 rounded-full" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-palette-1-soft text-base font-semibold text-brand">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{session?.user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>

          {/* Learning snapshot — the dashboard's key numbers, always visible */}
          <div className="mt-5 rounded-xl border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-palette-3" />
                Your progress
              </span>
              {avgProgress !== null && <span className="text-xs font-bold text-foreground">{avgProgress}%</span>}
            </div>
            {avgProgress !== null ? (
              <>
                <Progress value={avgProgress} className="mt-2 h-1.5" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Avg. across {continueLearning.length} course{continueLearning.length === 1 ? '' : 's'} in progress
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {enrollments.length > 0 ? "You're all caught up." : 'No courses yet — enroll to get started.'}
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold text-foreground">{enrollments.length}</p>
                <p className="text-[11px] text-muted-foreground">Enrolled</p>
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{wishlist?.items.length ?? 0}</p>
                <p className="text-[11px] text-muted-foreground">Wishlist</p>
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{payments.length}</p>
                <p className="text-[11px] text-muted-foreground">Payments</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Menu
          </p>
          <nav>
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
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        active ? 'bg-brand text-brand-foreground' : 'bg-primary text-primary-foreground'
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 border-t border-border p-4">
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
