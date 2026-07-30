import { z } from 'zod';

export const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  durationSeconds: z.coerce.number().optional(),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  order: z.coerce.number().optional(),
  durationSeconds: z.coerce.number().optional(),
});
