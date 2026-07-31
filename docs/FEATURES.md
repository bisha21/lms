# Feature Documentation — dp_lms

Auto-generated overview of the features implemented in this codebase, based on a full read-through of the source. Stack: **Next.js 15 (App Router, Turbopack) + MongoDB/Mongoose + NextAuth + Redux Toolkit + Stripe + Cloudinary**.

## 1. Course Catalog & Content

- **Public course catalog** (`/`) — searchable, category-filterable, paginated grid of published courses (thumbnail, title, description, duration, price/Free badge).
- **Course detail page** (`/courses/[slug]`) — shows curriculum (lesson list), and one of: Enroll (free course), Buy for $X (paid → Stripe Checkout), or Continue Learning (already enrolled).
- **Course player** (`/courses/[slug]/learn`) — authenticated video player with lesson sidebar, per-lesson completion checkmarks, progress bar, and "Mark as complete" action.
- **Categories** — courses are grouped under `Category` documents (unique name, auto-generated slug).
- **Lessons** — ordered per course (`order` field, compound index `{course, order}`), each with a video hosted on Cloudinary (`videoUrl` + `videoPublicId` for later deletion) and a duration in seconds.
- **Soft delete for courses** — `DELETE /api/courses/:id` sets `isDeleted=true` rather than removing the document; non-admin course listings automatically exclude deleted/unpublished courses.
- **Draft / Published workflow** — courses have a `status` enum (`draft`/`published`); admins can toggle publish state from the admin course table.

## 2. Authentication & Authorization

- **NextAuth** with two providers: **Google OAuth** and **email/password (Credentials)**. Google sign-in auto-creates a `User` document on first login.
- **Roles**: `admin` and `student` (default `student`) stored on the `User` model and attached to the JWT/session on every token refresh.
- **Registration** (`POST /api/auth/register`) — Zod-validated, duplicate-email rejection (409), rate-limited to 5 requests/minute/IP (in-memory, single-instance only).
- **Server-side guards**:
  - `authMiddleware()` — hard 401 gate requiring an admin session (used on category routes).
  - `requireAuth()` — throws a 401 `AppError` if there's no session (used broadly across enrollments/payments/progress/lessons/courses).
  - Admin-only mutations additionally check `role === 'admin'` (403 otherwise) and enforce **course ownership** — an admin can only edit/delete courses and lessons where they are the `instructor`.
- **Client-side guards**: `useRequireAuth()` redirects unauthenticated/wrong-role users away from admin pages and student-only pages (`/my-courses`, `/payments`, course player); `useRedirectIfAuthed()` bounces already-logged-in users away from `/login` and `/register`.
- **Public (unauthenticated) endpoints**: `GET /api/courses`, `GET /api/courses/slug/:slug`, `GET /api/category` — everything else requires at least a session.

## 3. Enrollment

- **Free enrollment** (`POST /api/enrollments`) — self-service, but only permitted when `coursePrice === 0`; paid courses are rejected with a 400 telling the client to use checkout instead.
- **My enrollments** (`GET /api/enrollments/me`) — returns the current user's enrollments populated with course + category data; powers the `/my-courses` page.
- **Uniqueness** — a compound unique index on `{student, course}` prevents duplicate enrollments.
- **Enrollment via payment** — for paid courses, enrollment is granted automatically by the Stripe webhook once payment completes (see below), not by the enrollment endpoint directly.

## 4. Payments (Stripe)

- **Checkout session creation** (`POST /api/payments/checkout`) — only for paid courses; blocks if the user is already enrolled; creates a Stripe Checkout Session (single line item priced from `coursePrice`, metadata carries `courseId` + `studentId`) and returns the hosted checkout URL for client-side redirect.
- **Webhook handling** (`POST /api/payments/webhook`) — verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`; on `checkout.session.completed`, upserts a `Payment` record (status `Completed`) **and** upserts the corresponding `Enrollment` — this is the actual mechanism that grants access after a successful payment.
- **Payment history** (`GET /api/payments/me`) — list of the current user's payments (course, amount + currency, status, date); rendered on `/payments`.
- **Stripe client** is a lazily-constructed singleton that throws a clean, catchable error if `STRIPE_SECRET_KEY` is missing, instead of crashing at build/import time.

## 5. Progress Tracking

- `GET /api/progress/:courseId` — requires an active enrollment; returns `completedLessons`, `totalLessons`, and a computed completion `percent`.
- `PATCH /api/progress/:courseId/lessons/:lessonId` — marks a lesson complete via an idempotent `$addToSet` (upsert), so re-marking the same lesson is a no-op.
- The course player shows a live progress bar and per-lesson checkmarks, with an optimistic UI update on "Mark as complete" that rolls back via refetch if the request fails.

## 6. Admin Panel (`/admin`, admin-role only)

- **Categories** (`/admin/categories`) — full CRUD via a shared modal/form pattern (add/edit/delete), backed by Redux thunks.
- **Courses** (`/admin/courses`) — full CRUD, client-side title search/filter, inline publish/draft toggle, add/edit modal form, delete confirmation. Clicking a course routes to its lesson manager.
- **Lessons** (`/admin/courses/[id]/lessons`) — add lesson (multipart upload: title/description/duration/video file → Cloudinary), edit, delete (also removes the Cloudinary asset), and manual reorder via up/down controls that swap `order` values.
- **Enrollments & Revenue report** (`/admin/students`) — aggregate stat tiles (total enrollments, total revenue) plus a per-course breakdown table, powered by `GET /api/admin/overview`.
- Sidebar also lists **Stats** and **Settings** links, but these are not yet implemented (the `/admin` root page is a placeholder, and Settings has no destination route).

## 7. Media Handling

- **Cloudinary** integration for lesson videos: `uploadVideoBuffer` streams uploaded video files to a `lms/lessons` folder as `resource_type: video`; `destroyVideo` cleans up the asset when a lesson is deleted.

## 8. Client-side Architecture

- **TanStack Query** (`src/features/*/hooks.ts`) now owns all server-state fetching (categories, courses, enrollments, lessons, payments, progress) — query hooks (`useCourses`, `useCategories`, ...) and mutation hooks (`useCreateCourse`, `useEnrollInCourse`, ...) replace the old hand-rolled Redux thunks, with a central key factory in `src/lib/queryKeys.ts`. Mutations invalidate the relevant query key and drive `react-toastify` success/error feedback; `useMarkLessonComplete` does an optimistic update with rollback via React Query's `onMutate`/`onError`/`onSettled`.
- **Redux Toolkit** is kept only for UI-only shared state: a single `modal` slice (`isOpen` / `type: 'add'|'edit'|'delete'` / `data`) driving every admin CRUD modal, via `makeStore()` (one instance per app mount).
- All HTTP calls (both React Query hooks and the axios instance) share `src/http/http.ts` (`baseURL: /api`).
- **shadcn/ui** is configured (Tailwind v3-style config + `@tailwindcss/postcss` v4 present); currently only `button` and `dialog` primitives are in use, with the rest of the UI (forms, tables, sidebar) as hand-built components under `src/_component/`.

## 9. Cross-cutting Infrastructure

- **Centralized error handling** — every API route is wrapped in `withErrorHandling`, which normalizes Zod validation errors (400), custom `AppError`s (custom status), Mongoose `CastError` (400), Mongo duplicate-key errors (409), and anything else (500) into consistent JSON responses.
- **Zod validation** on all mutating endpoints (auth, category, course, lesson, payment schemas under `src/lib/validate/`).
- **Edge middleware** (`src/middleware.ts`) — coarse-grained session/role gate (via `next-auth/jwt`'s `getToken`) on admin pages, protected site pages (`/my-courses`, `/payments`, `/courses/:slug/learn`), and API mutation routes, complementing (not replacing) the per-route `requireAuth()`/`authMiddleware()` + ownership checks in `middleware/auth.middleware.ts` and the controllers.
- **Rate limiting** (`src/lib/rateLimit.ts`) — Upstash Redis-backed (sliding window) when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are configured, falling back to the original in-memory limiter otherwise (local dev/CI need no cloud account).
- **MongoDB connection handling** — a singleton connector that reuses an existing ready connection, with a Windows-specific DNS override (`8.8.8.8`/`1.1.1.1`) to work around an `mongodb+srv://` SRV-lookup bug.
- **Slug generation** — shared `slugify` helper used by both `Category` and `Course` pre-save hooks.
- **Automated tests** — Vitest (`tests/unit`, `tests/integration`, `tests/hooks`) with `mongodb-memory-server` for DB-backed controller tests, and Playwright (`e2e/`) covering register/login, free enrollment, paid checkout → webhook → enrollment, and progress tracking; both run in GitHub Actions (`.github/workflows/ci.yml`) alongside lint/typecheck.

---

## Known Gaps / Not Yet Implemented

- Admin **Settings** page and **Stats/dashboard charts** are unimplemented placeholders.
- Rate limiting still falls back to an in-memory, single-instance limiter when Upstash env vars aren't configured.
