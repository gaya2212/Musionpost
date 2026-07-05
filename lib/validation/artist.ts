import { z } from 'zod';
import { emailSchema } from './auth';

export const budgetRangeValues = ['under_500', '500_2k', '2k_10k', '10k_plus'] as const;

export const budgetRangeLabels: Record<(typeof budgetRangeValues)[number], string> = {
  under_500: 'Under $500',
  '500_2k': '$500 - $2k',
  '2k_10k': '$2k - $10k',
  '10k_plus': '$10k+',
};

const genresListSchema = z
  .string()
  .trim()
  .min(1, 'Add at least one genre.')
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(z.string()).min(1, 'Add at least one genre.'));

const budgetRangeSchema = z
  .string()
  .trim()
  .min(1, 'Select a budget range.')
  .pipe(z.enum(budgetRangeValues));

export const artistProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'Artist name is required.').max(80, 'Keep it under 80 characters.'),
  location: z.string().trim().max(120, 'Keep it under 120 characters.').optional(),
  primaryGenres: genresListSchema,
  projectGoals: z.string().trim().max(2000, 'Keep it under 2000 characters.').optional(),
  budgetRange: budgetRangeSchema,
});

export const artistOnboardingSchema = artistProfileSchema.extend({
  userId: z.string().uuid(),
  email: emailSchema,
});

export type ArtistProfileValues = z.infer<typeof artistProfileSchema>;
export type ArtistOnboardingPayload = z.infer<typeof artistOnboardingSchema>;
