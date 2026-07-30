import { createConnection } from '@/database/db';
import { createCategory, getAllCategory } from './category.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(async (req: Request) => {
  return createCategory(req);
});

export const GET = withErrorHandling(async () => {
  await createConnection();
  return getAllCategory();
});
