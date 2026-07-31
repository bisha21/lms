import { reorderLessonsInSection } from '@/app/api/lessons/lesson.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return reorderLessonsInSection(req, id);
  }
);
