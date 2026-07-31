import { createCheckout } from '../payment.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(async (req: Request) => {
  return createCheckout(req);
});
