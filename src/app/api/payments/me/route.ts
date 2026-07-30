import { getMyPayments } from '../payment.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getMyPayments();
});
