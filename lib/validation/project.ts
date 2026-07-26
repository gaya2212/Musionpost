import { z } from 'zod';

export const projectSchema = z.object({
  title: z.string().trim().min(1, 'Give the project a title.').max(200, 'Keep it under 200 characters.'),
  workingTitle: z.string().trim().max(200, 'Keep it under 200 characters.').optional(),
  description: z.string().trim().max(4000, 'Keep it under 4000 characters.').optional(),
  targetCompletionDate: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Enter a valid date.'),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
