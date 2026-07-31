import { getMyEnrollments } from '../enrollment.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getMyEnrollments();
});
