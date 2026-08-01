import { addLessonAttachment } from '../../lesson.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return addLessonAttachment(req, id);
  }
);
