import { z } from 'zod';

export const checkoutSchema = z.object({
  courseIds: z.array(z.string().min(1)).min(1).optional(),
  couponCode: z.string().min(1).optional(),
});
