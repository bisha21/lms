# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Turbopack) at http://localhost:3000
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (eslint-config-next, flat config)
```

There is no test setup in this repo (no test runner in `package.json`, no test files).

## Architecture

Next.js 15 (App Router) + MongoDB/Mongoose + NextAuth + Redux Toolkit LMS admin app.

### API routes: route file + sibling controller

Each API resource under `src/app/api/<resource>/` splits into two files:
- `route.tsx` (or `route.ts`, naming is inconsistent) — the Next.js route handler, just calls into the controller.
- `<resource>.controller.ts` (naming/casing is inconsistent: `course.Controller.ts`, `category.controller.ts`, `entollement.Controller.ts` — note the typo "entollement", `lesson.Controller.ts`) — the actual DB logic (Mongoose queries, response shaping).

Dynamic `[id]/route.ts(x)` files import the same controller functions (delete/update/get-by-id) rather than duplicating logic.

Every controller/handler must call `createConnection()` from `@/database/db` before touching a model — Mongoose connections are not established globally. This is called inconsistently: sometimes in the route handler, sometimes inside the controller function, and frequently without `await` (fire-and-forget) — don't assume ordering guarantees when reading or extending existing code, but do `await` it in new code.

### Auth

- NextAuth (`src/app/api/auth/[...nextauth]/route.ts`) uses Google OAuth only. On sign-in it upserts a `User` document; the `jwt` callback re-reads the user from Mongo on every token refresh to attach `id`/`role` to the token, then `session` callback copies those onto `session.user`.
- Session typing is augmented in `types/next-auth.ts` (`session.user.role`, `.id`).
- `middleware/auth.middleware.ts` (`authMiddleware`) is a manual per-handler guard (not registered as Next.js middleware) — it checks `getServerSession(authOptions)` and requires `role === 'admin'`, returning 401 otherwise. It is currently only invoked from `createCategory`; other mutating endpoints (courses, lessons) do not call it yet, so don't assume admin routes are uniformly protected.
- Client-side, `src/app/admin/layout.tsx` redirects to `/` if `useSession()` has no session or `role !== 'admin'`.
- `.env` defines `MONGOOSE_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_NEXT_AUTH_SECRET` — note the NextAuth route reads `process.env.NEXTAUTH_SECRET`, which does not match the `.env` key name; check this if session/JWT signing behaves unexpectedly.

### Data models (`src/database/models/`)

Mongoose models all follow `mongoose.models.X || mongoose.model('X', schema)` to survive hot-reload re-registration. Key relations: `Course.category` → `Category`, `Lesson.course` → `Course`, `Enrollment.student` → `User` and `Enrollment.course` → `Course`. `Course` has a commented-out `lessonId` array ref to `Lesson` (not currently active — lessons reference their course, not the reverse).

### Redux (`src/redux/`)

State is organized per-feature as slices (`category`, `courses`, `modal`), combined in `src/redux/store.ts` via `makeStore()` (a factory, not a singleton) and provided through `src/app/StoreProvider.tsx` (`'use client'`, one store instance per mount via `useRef`). Use `useAppDispatch`/`useAppSelector` from `src/redux/hooks.ts` instead of the raw `react-redux` hooks.

Each feature slice defines its own thunks as plain functions returning `async (dispatch: AppDispatch) => {...}` (not `createAsyncThunk`) that call the `API` axios instance (`src/http/http.ts`, baseURL hardcoded to `http://localhost:3000/api`) and dispatch plain action creators based on the response status. Follow this same hand-rolled-thunk pattern for new slices rather than introducing `createAsyncThunk`.

The `modal` slice is a single shared modal controller (`isOpen`, `type: 'add' | 'edit' | 'delete'`, `data`) used across admin pages — e.g. `src/app/admin/categories/page.tsx` opens the same `Modal`/`Form` components for both add and edit by passing `defaultValues` conditionally on `type`.

### UI

- shadcn/ui is configured (`components.json`, style "default", Tailwind base color "slate") with primitives in `src/components/ui/`. Non-shadcn shared components (`Form`, `Modal`, `Dashboard`, sidebar) live in `src/_component/`.
- Tailwind config is v3-style (`tailwind.config.ts`) even though `@tailwindcss/postcss` v4 is also a dependency — check both when touching styling/build config.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
