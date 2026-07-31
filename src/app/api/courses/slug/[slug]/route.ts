import { createConnection } from '@/database/db';
import { getCourseBySlug } from '../../course.Controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
    await createConnection();
    const { slug } = await params;
    return getCourseBySlug(slug);
  }
);
