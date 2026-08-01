import { deleteLessonAttachment } from '../../../lesson.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const DELETE = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) => {
    const { id, attachmentId } = await params;
    return deleteLessonAttachment(id, attachmentId);
  }
);
