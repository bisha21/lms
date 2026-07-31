import { reorderSections } from '@/app/api/sections/section.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return reorderSections(req, id);
  }
);
