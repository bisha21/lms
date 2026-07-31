import { getContinueLearning } from '../progress.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getContinueLearning();
});
