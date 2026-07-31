import { markLessonComplete } from '../../../progress.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const PATCH = withErrorHandling(
  async (
    req: Request,
    { params }: { params: Promise<{ courseId: string; lessonId: string }> }
  ) => {
    const { courseId, lessonId } = await params;
    return markLessonComplete(courseId, lessonId);
  }
);
