import { getInstructorStudents } from './students.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getInstructorStudents();
});
