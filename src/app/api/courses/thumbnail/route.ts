import { uploadCourseThumbnail } from '../course.Controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(async (req: Request) => {
  return uploadCourseThumbnail(req);
});
