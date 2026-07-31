import { createConnection } from '@/database/db';
import { getInstructorsWithCourses } from '../course.Controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  await createConnection();
  return getInstructorsWithCourses();
});
