import { deleteSection, updateSection } from '../section.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return updateSection(req, id);
  }
);

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    return deleteSection(id);
  }
);
