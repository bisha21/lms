import { uploadCoursePromoVideo } from '../course.Controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const POST = withErrorHandling(async (req: Request) => {
  return uploadCoursePromoVideo(req);
});
