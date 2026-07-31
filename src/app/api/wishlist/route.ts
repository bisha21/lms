import { getWishlist } from './wishlist.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getWishlist();
});
