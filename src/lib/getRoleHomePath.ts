import { Role } from '@/lib/rbac/roles';

// Single source of truth for "where does this role land after login" — used by the
// login/register pages and useRedirectIfAuthed so an already-authenticated visitor is
// never bounced to a page their role can't see.
export function getRoleHomePath(role?: Role | string | null): string {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return '/admin';
    case Role.INSTRUCTOR:
      return '/instructor';
    default:
      return '/dashboard';
  }
}
