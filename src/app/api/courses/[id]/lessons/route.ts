import { createConnection } from '@/database/db';
import { getCourseLessons } from '../../course.Controller';
import { createLessonForCourse } from '@/app/api/lessons/lesson.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    await createConnection();
    return getCourseLessons(params.id);
  }
);

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    return createLessonForCourse(req, params.id);
  }
);
