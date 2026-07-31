import { getProgress } from '../progress.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ courseId: string }> }) => {
    const { courseId } = await params;
    return getProgress(courseId);
  }
);
