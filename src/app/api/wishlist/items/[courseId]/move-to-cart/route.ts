import { moveToCart } from '../../../wishlist.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ courseId: string }> }) => {
    const { courseId } = await params;
    return moveToCart(courseId);
  }
);
