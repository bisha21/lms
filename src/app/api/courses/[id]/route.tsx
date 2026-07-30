import { createConnection } from '@/database/db';
import { deleteCourse, getCourseById, updateCourse } from '../course.Controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    await createConnection();
    return deleteCourse(params.id);
  }
);

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    await createConnection();
    return updateCourse(req, params.id);
  }
);

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    await createConnection();
    return getCourseById(params.id);
  }
);
