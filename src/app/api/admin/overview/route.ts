import { getOverview } from '../overview.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getOverview();
});
