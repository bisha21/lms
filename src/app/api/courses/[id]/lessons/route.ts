import { createConnection } from '@/database/db';
import { getCourseLessons } from '../../course.Controller';
import { withErrorHandling } from '@/lib/catchAsync';

// Flat, section-order-then-lesson-order sorted list — used by the student-facing course
// player. Lesson creation now happens per-section (POST /api/sections/:id/lessons) since
// every lesson belongs to a section; see src/app/api/sections/[id]/lessons/route.ts.
export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await createConnection();
    const { id } = await params;
    return getCourseLessons(id);
  }
);
