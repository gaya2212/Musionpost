import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Please enter a valid email address.'),
  role_interest: z.enum(['artist', 'pro', 'both', '']).optional(),
});

export type WaitlistFormValues = z.infer<typeof waitlistSchema>;
