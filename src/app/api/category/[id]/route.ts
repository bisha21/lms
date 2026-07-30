import { createConnection } from '@/database/db';
import { deleteCategory, getSingleCategory, updateCategory } from '../category.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    await createConnection();
    return deleteCategory(req, params.id);
  }
);

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    await createConnection();
    return updateCategory(req, params.id);
  }
);

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: { id: string } }) => {
    await createConnection();
    return getSingleCategory(params.id);
  }
);
