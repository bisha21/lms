import { z } from 'zod';

export const addItemSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'code is required'),
});
