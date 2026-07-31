import { getAllCourses, createCourse } from './course.Controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async (req: Request) => {
  return getAllCourses(req);
});

export const POST = withErrorHandling(async (req: Request) => {
  return createCourse(req);
});
