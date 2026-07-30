import { createCheckoutSession } from '../payment.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(async (req: Request) => {
  return createCheckoutSession(req);
});
