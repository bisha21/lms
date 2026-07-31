import { createCoupon, getAllCoupons } from './coupon.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getAllCoupons();
});

export const POST = withErrorHandling(async (req: Request) => {
  return createCoupon(req);
});
