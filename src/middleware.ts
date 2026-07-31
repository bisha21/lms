import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { can } from '@/lib/rbac/permissions';

// Edge-level, coarse-grained gate. Complements (does not replace) the per-route
// requireAuth()/authMiddleware() + ownership checks in middleware/auth.middleware.ts,
// which still run for anything that needs a DB lookup (role re-verification, course
// ownership, enrollment checks). This file only has access to the signed JWT cookie.
//
// The public/GET exceptions below mirror exactly what course.Controller.ts and
// category.controller.ts already leave unauthenticated (getAllCourses, getCourseBySlug,
// getCourseById, getAllCategory, getSingleCategory) — this must stay in sync with those
// controllers, not be more permissive or more restrictive than they are.
function isPublicCatalogGet(pathname: string): boolean {
  return (
    /^\/api\/courses\/?$/.test(pathname) ||
    /^\/api\/courses\/slug\/[^/]+\/?$/.test(pathname) ||
    /^\/api\/courses\/[^/]+\/?$/.test(pathname) ||
    /^\/api\/category\/?$/.test(pathname) ||
    /^\/api\/category\/[^/]+\/?$/.test(pathname)
  );
}

function isLearnPage(pathname: string): boolean {
  return /^\/courses\/[^/]+\/learn(\/|$)/.test(pathname);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Stripe calls this unauthenticated and verifies via signature, not session.
  if (pathname === '/api/payments/webhook') {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith('/api');

  if (isApi && req.method === 'GET' && isPublicCatalogGet(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role;

  if (isApi) {
    if (!token) {
      return NextResponse.json({ message: 'You must be logged in' }, { status: 401 });
    }
    // Coarse, role-only pre-filter against the same permission matrix the server-side
    // guards use (src/lib/rbac/permissions.ts) — a fast-fail for the common "wrong role
    // entirely" case. Exact per-action correctness and course/lesson ownership (which
    // needs a DB lookup this layer doesn't have) are still enforced server-side via
    // requirePermission()/assertCourseOwnership().
    // /api/admin/* needs admin for every method (including GET, e.g. the overview report).
    // /api/category/* only needs admin for mutations — GET is public (handled above).
    const needsAdmin =
      pathname.startsWith('/api/admin') ||
      pathname.startsWith('/api/coupons') || // admin for every method — listing codes is itself sensitive
      (req.method !== 'GET' && pathname.startsWith('/api/category'));
    if (needsAdmin && !can(role, 'admin:overview')) {
      return NextResponse.json(
        { message: "You don't have permission to perform this action" },
        { status: 403 },
      );
    }
    // /api/instructor/* — the instructor dashboard, needs instructor:overview for every
    // method (GET-only today, but same "sensitive by default" treatment as /api/admin).
    const needsInstructorOverview = pathname.startsWith('/api/instructor');
    if (needsInstructorOverview && !can(role, 'instructor:overview')) {
      return NextResponse.json(
        { message: "You don't have permission to perform this action" },
        { status: 403 },
      );
    }
    // Course/lesson/section mutations: Super Admin, Admin, and Instructor may all attempt
    // these (ownership is checked server-side); Student may not. GET is exempted for
    // /api/lessons too now — GET /api/lessons/:id (lesson content) must be reachable by
    // enrolled students, not just owners; the real enrollment-or-ownership check happens
    // server-side in getLessonContent().
    const needsCourseManage =
      (req.method !== 'GET' && pathname.startsWith('/api/courses')) ||
      (req.method !== 'GET' && pathname.startsWith('/api/lessons')) ||
      pathname.startsWith('/api/sections'); // POST/PATCH/DELETE only — no GET route exists here
    if (needsCourseManage && !can(role, 'course:create')) {
      return NextResponse.json(
        { message: "You don't have permission to perform this action" },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith('/admin');
  const isProtectedPage =
    isAdminPage ||
    pathname.startsWith('/my-courses') ||
    pathname.startsWith('/payments') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/checkout') ||
    isLearnPage(pathname);

  if (!isProtectedPage) {
    return NextResponse.next();
  }
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (isAdminPage && !can(role, 'admin:overview')) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/my-courses/:path*',
    '/payments/:path*',
    '/cart/:path*',
    '/wishlist/:path*',
    '/checkout/:path*',
    '/courses/:path*/learn',
    '/api/admin/:path*',
    '/api/category/:path*',
    '/api/courses/:path*',
    '/api/lessons/:path*',
    '/api/sections/:path*',
    '/api/enrollments/:path*',
    '/api/progress/:path*',
    '/api/payments/:path*',
    '/api/cart/:path*',
    '/api/wishlist/:path*',
    '/api/orders/:path*',
    '/api/coupons/:path*',
  ],
};
