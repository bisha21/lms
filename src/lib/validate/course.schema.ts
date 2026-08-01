import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  courseDescription: z.string().min(1, 'Description is required'),
  coursePrice: z.coerce.number().min(0).default(0),
  duration: z.string().min(1, 'Duration is required'),
  category: z.string().min(1, 'Category is required'),
  thumbnail: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  promoVideoUrl: z.string().optional(),
  promoVideoPublicId: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  language: z.string().min(1).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  status: z.enum(['draft', 'published']).optional(),
});
