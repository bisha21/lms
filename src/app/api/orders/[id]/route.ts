import { getOrderStatus } from '../order.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return getOrderStatus(id);
  }
);
