import { applyCoupon, removeCoupon } from '../cart.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(async (req: Request) => {
  return applyCoupon(req);
});

export const DELETE = withErrorHandling(async () => {
  return removeCoupon();
});
