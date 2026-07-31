import { z } from 'zod';

export const createCouponSchema = z
  .object({
    code: z.string().min(1, 'Code is required'),
    discountType: z.enum(['percentage', 'fixed']),
    value: z.coerce.number().positive('Value must be greater than 0'),
    expiresAt: z.coerce.date().optional(),
    maxUses: z.coerce.number().int().positive().optional(),
    courseIds: z.array(z.string().min(1)).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.discountType !== 'percentage' || data.value <= 100, {
    message: 'A percentage discount cannot exceed 100',
    path: ['value'],
  });

export const updateCouponSchema = z
  .object({
    code: z.string().min(1).optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    value: z.coerce.number().positive().optional(),
    expiresAt: z.coerce.date().optional(),
    maxUses: z.coerce.number().int().positive().optional(),
    courseIds: z.array(z.string().min(1)).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.discountType !== 'percentage' || data.value == null || data.value <= 100, {
    message: 'A percentage discount cannot exceed 100',
    path: ['value'],
  });
