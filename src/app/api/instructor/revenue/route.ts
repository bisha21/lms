import { getInstructorRevenue } from './revenue.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async (req: Request) => {
  return getInstructorRevenue(req);
});
