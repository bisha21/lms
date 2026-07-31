import { createSection, getSectionsWithLessons } from '@/app/api/sections/section.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return getSectionsWithLessons(id);
  }
);

export const POST = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return createSection(req, id);
  }
);
