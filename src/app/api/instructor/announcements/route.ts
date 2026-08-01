import { createInstructorAnnouncement, getInstructorAnnouncements } from './announcements.controller';
import { withErrorHandling } from '@/lib/catchAsync';

export const GET = withErrorHandling(async () => {
  return getInstructorAnnouncements();
});

export const POST = withErrorHandling(async (req: Request) => {
  return createInstructorAnnouncement(req);
});
