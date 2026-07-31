import { z } from 'zod';

export const checkoutSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
});
