import { Role } from './roles';

// Single source of truth for "who can do what." Every guard — edge middleware, server-side
// route guards, the frontend admin-panel gate — checks against this table via can()/
// bypassesOwnership() instead of comparing role strings inline. Course/lesson mutation
// actions additionally require an ownership check (see src/lib/rbac/ownership.ts) unless
// the role bypasses ownership entirely.
export type Action =
  | 'category:create'
  | 'category:update'
  | 'category:delete'
  | 'course:create'
  | 'course:update'
  | 'course:delete'
  | 'lesson:create'
  | 'lesson:update'
  | 'lesson:delete'
  | 'section:create'
  | 'section:update'
  | 'section:delete'
  | 'coupon:manage'
  | 'admin:overview'
  | 'instructor:overview';

const PERMISSIONS: Record<Action, Role[]> = {
  'category:create': [Role.SUPER_ADMIN, Role.ADMIN],
  'category:update': [Role.SUPER_ADMIN, Role.ADMIN],
  'category:delete': [Role.SUPER_ADMIN, Role.ADMIN],
  'course:create': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'course:update': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'course:delete': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'lesson:create': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'lesson:update': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'lesson:delete': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'section:create': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'section:update': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'section:delete': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
  'coupon:manage': [Role.SUPER_ADMIN, Role.ADMIN],
  'admin:overview': [Role.SUPER_ADMIN, Role.ADMIN],
  'instructor:overview': [Role.SUPER_ADMIN, Role.ADMIN, Role.INSTRUCTOR],
};

export function can(role: Role | undefined | null, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[action].includes(role);
}

// Roles that may mutate ANY instructor-owned resource, bypassing the per-resource
// ownership check entirely. Everyone else (currently just Instructor) must own the
// specific course/lesson they're mutating.
export function bypassesOwnership(role: Role | undefined | null): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}
