import { addToWishlist } from '../wishlist.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(async (req: Request) => {
  return addToWishlist(req);
});
