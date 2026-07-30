import { markLessonComplete } from '../../../progress.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const PATCH = withErrorHandling(
  async (
    req: Request,
    { params }: { params: { courseId: string; lessonId: string } }
  ) => {
    return markLessonComplete(params.courseId, params.lessonId);
  }
);
