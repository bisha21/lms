import { getInstructorDashboard } from '../dashboard.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getInstructorDashboard();
});
