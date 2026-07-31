import { createConnection } from '@/database/db';
import { deleteCategory, getSingleCategory, updateCategory } from '../category.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await createConnection();
    const { id } = await params;
    return deleteCategory(id);
  }
);

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await createConnection();
    const { id } = await params;
    return updateCategory(req, id);
  }
);

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    await createConnection();
    const { id } = await params;
    return getSingleCategory(id);
  }
);
