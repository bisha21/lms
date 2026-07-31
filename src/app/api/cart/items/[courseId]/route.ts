import { removeFromCart } from '../../cart.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ courseId: string }> }) => {
    const { courseId } = await params;
    return removeFromCart(courseId);
  }
);
