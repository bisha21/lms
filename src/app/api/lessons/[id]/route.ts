import { updateLesson, deleteLesson } from '../lesson.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    return updateLesson(req, params.id);
  }
);

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    return deleteLesson(params.id);
  }
);
