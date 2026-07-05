import { z } from 'zod';
import { emailSchema } from './auth';
import { budgetRangeValues, budgetRangeLabels } from './artist';

export const proTypeValues = [
  'producer',
  'engineer_mix',
  'engineer_master',
  'studio',
  'session_musician',
  'vocal_coach',
  'marketing',
  'pr',
  'designer',
  'distribution',
] as const;

export const proTypeLabels: Record<(typeof proTypeValues)[number], string> = {
  producer: 'Producer',
  engineer_mix: 'Mix engineer',
  engineer_master: 'Mastering engineer',
  studio: 'Studio',
  session_musician: 'Session musician',
  vocal_coach: 'Vocal coach',
  marketing: 'Marketing support',
  pr: 'PR',
  designer: 'Designer',
  distribution: 'Distribution',
};

export const rateRangeValues = budgetRangeValues;
export const rateRangeLabels = budgetRangeLabels;

const listSchema = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
    .pipe(z.array(z.string()).min(1, message));

const proTypeSchema = z.string().trim().min(1, 'Select a professional type.').pipe(z.enum(proTypeValues));
const rateRangeSchema = z.string().trim().min(1, 'Select a rate range.').pipe(z.enum(rateRangeValues));

export const proProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required.').max(80, 'Keep it under 80 characters.'),
  proType: proTypeSchema,
  location: z.string().trim().max(120, 'Keep it under 120 characters.').optional(),
  specialties: listSchema('Add at least one specialty.'),
  genres: listSchema('Add at least one genre.'),
  rateRange: rateRangeSchema,
  notableCredits: z.string().trim().max(2000, 'Keep it under 2000 characters.').optional(),
  portfolioLinks: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []))
    .pipe(z.array(z.string().url('Portfolio links must be valid URLs.'))),
  verificationInterest: z.boolean().optional(),
});

export const proOnboardingSchema = proProfileSchema.extend({
  userId: z.string().uuid(),
  email: emailSchema,
});

export type ProProfileValues = z.infer<typeof proProfileSchema>;
export type ProOnboardingPayload = z.infer<typeof proOnboardingSchema>;
