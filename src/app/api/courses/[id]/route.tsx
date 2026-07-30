import { createConnection } from '@/database/db';
import { deleteCourse, getCourseById, updateCourse } from '../course.Controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await createConnection();
    const { id } = await params;
    return deleteCourse(id);
  }
);

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await createConnection();
    const { id } = await params;
    return updateCourse(req, id);
  }
);

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await createConnection();
    const { id } = await params;
    return getCourseById(id);
  }
);
