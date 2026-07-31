import { describe, expect, it } from 'vitest';
import { can, bypassesOwnership, Action } from '@/lib/rbac/permissions';
import { Role } from '@/lib/rbac/roles';

const ADMIN_ONLY_ACTIONS: Action[] = ['category:create', 'category:update', 'category:delete', 'admin:overview'];
const INSTRUCTOR_ACTIONS: Action[] = [
  'course:create',
  'course:update',
  'course:delete',
  'lesson:create',
  'lesson:update',
  'lesson:delete',
];

describe('permission matrix', () => {
  it('grants super_admin and admin every admin-only action', () => {
    for (const action of ADMIN_ONLY_ACTIONS) {
      expect(can(Role.SUPER_ADMIN, action)).toBe(true);
      expect(can(Role.ADMIN, action)).toBe(true);
    }
  });

  it('denies instructor and student every admin-only action', () => {
    for (const action of ADMIN_ONLY_ACTIONS) {
      expect(can(Role.INSTRUCTOR, action)).toBe(false);
      expect(can(Role.STUDENT, action)).toBe(false);
    }
  });

  it('grants super_admin, admin, and instructor every course/lesson action', () => {
    for (const action of INSTRUCTOR_ACTIONS) {
      expect(can(Role.SUPER_ADMIN, action)).toBe(true);
      expect(can(Role.ADMIN, action)).toBe(true);
      expect(can(Role.INSTRUCTOR, action)).toBe(true);
    }
  });

  it('denies student every course/lesson action', () => {
    for (const action of INSTRUCTOR_ACTIONS) {
      expect(can(Role.STUDENT, action)).toBe(false);
    }
  });

  it('denies everything when role is undefined or null', () => {
    expect(can(undefined, 'course:create')).toBe(false);
    expect(can(null, 'admin:overview')).toBe(false);
  });

  it('only super_admin and admin bypass ownership', () => {
    expect(bypassesOwnership(Role.SUPER_ADMIN)).toBe(true);
    expect(bypassesOwnership(Role.ADMIN)).toBe(true);
    expect(bypassesOwnership(Role.INSTRUCTOR)).toBe(false);
    expect(bypassesOwnership(Role.STUDENT)).toBe(false);
    expect(bypassesOwnership(undefined)).toBe(false);
  });
});
