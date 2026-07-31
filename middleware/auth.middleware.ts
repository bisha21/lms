import { authOptions } from '@/lib/auth';
import { getServerSession, Session } from 'next-auth';
import { AppError } from '@/lib/appError';
import { Action, can } from '@/lib/rbac/permissions';

// Throws (rather than returning a sentinel) so callers can rely on `catchAsync`
// to format the response, and get back a real Session with no extra narrowing.
export const requireAuth = async (): Promise<Session> => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AppError('You must be logged in', 401);
  }
  return session;
};

// The role-check guard layer: throws 403 (not 401 — the caller is authenticated, just not
// permitted) unless the session's role is allowed to perform `action` per the single
// permission matrix in src/lib/rbac/permissions.ts. Callers needing a course/lesson
// ownership check on top of this should follow up with assertCourseOwnership()
// (src/lib/rbac/ownership.ts).
export const requirePermission = async (action: Action): Promise<Session> => {
  const session = await requireAuth();
  if (!can(session.user.role, action)) {
    throw new AppError('You dont have permission to perform this action', 403);
  }
  return session;
};
