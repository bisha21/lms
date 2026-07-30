import { getProgress } from '../progress.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: { courseId: string } }) => {
    return getProgress(params.courseId);
  }
);
