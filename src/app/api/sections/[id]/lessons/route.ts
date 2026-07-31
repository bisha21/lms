import { createLessonForSection } from '@/app/api/lessons/lesson.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return createLessonForSection(req, id);
  }
);
