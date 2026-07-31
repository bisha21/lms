'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/lib/rbac/roles';

export function useRequireAuth(role?: Role | Role[]) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const allowedRoles = role === undefined ? undefined : Array.isArray(role) ? role : [role];
  // Callers often pass an inline array literal (`useRequireAuth([Role.ADMIN, ...])`), which
  // gets a new identity every render — depend on this stable string instead so the effect
  // doesn't re-run (and re-push the router) on every render.
  const roleKey = allowedRoles?.join(',');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(session.user?.role)) {
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, roleKey, router]);

  return { session, status };
}
