import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  course: z.string().min(1, 'Course is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Message is required'),
});
