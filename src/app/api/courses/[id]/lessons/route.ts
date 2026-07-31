import { createConnection } from '@/database/db';
import { getCourseLessons } from '../../course.Controller';
import { createLessonForCourse } from '@/app/api/lessons/lesson.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await createConnection();
    const { id } = await params;
    return getCourseLessons(id);
  }
);

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return createLessonForCourse(req, id);
  }
);
