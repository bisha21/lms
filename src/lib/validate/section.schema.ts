import { z } from 'zod';

export const createSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

export const updateSectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, 'At least one id is required'),
});
