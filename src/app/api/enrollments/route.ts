import { enrollInCourse } from './enrollment.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(async (req: Request) => {
  return enrollInCourse(req);
});
