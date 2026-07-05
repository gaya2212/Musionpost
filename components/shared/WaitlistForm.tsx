'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { waitlistSchema, type WaitlistFormValues } from '@/lib/validation/waitlist';

const initialValues: WaitlistFormValues = {
  email: '',
  role_interest: '',
};

export function WaitlistForm() {
  const [values, setValues] = useState<WaitlistFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof WaitlistFormValues, string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = waitlistSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors = Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      ) as Partial<Record<keyof WaitlistFormValues, string>>;

      setErrors(nextErrors);
      setStatus('error');
      setMessage('Please fix the highlighted fields and try again.');
      return;
    }

    setErrors({});
    setStatus('submitting');
    setMessage('');

    const supabase = createClient();
    if (!supabase) {
      setStatus('error');
      setMessage('Waitlist submissions are currently unavailable because Supabase is not configured in this environment.');
      return;
    }

    const payload: Database['public']['Tables']['waitlist_entries']['Insert'] = {
      email: parsed.data.email.trim(),
      role_interest: parsed.data.role_interest === '' ? null : parsed.data.role_interest,
    };

    const { error } = await (
      supabase as unknown as {
        from: (table: string) => {
          insert: (values: Array<Record<string, unknown>>) => Promise<{ error: { message: string } | null }>;
        };
      }
    )
      .from('waitlist_entries')
      .insert([payload as Record<string, unknown>]);

    if (error) {
      setStatus('error');
      setMessage(error.message || 'We could not save your submission. Please try again.');
      return;
    }

    setStatus('success');
    setMessage('You are on the list. We will reach out when the first release window opens.');
    setValues(initialValues);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-white/10 bg-canvas-elevated/80 p-6 shadow-2xl shadow-black/20">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/10 bg-canvas-black/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'waitlist-email-error' : undefined}
            required
          />
          {errors.email ? (
            <p id="waitlist-email-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="role_interest" className="mb-2 block text-sm font-medium text-slate-200">
            Your role
          </label>
          <select
            id="role_interest"
            name="role_interest"
            value={values.role_interest}
            onChange={handleChange}
            className="w-full rounded-2xl border border-white/10 bg-canvas-black/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
          >
            <option value="">Select one</option>
            <option value="artist">Artist</option>
            <option value="pro">Professional</option>
            <option value="both">Both</option>
          </select>
          {errors.role_interest ? (
            <p className="mt-2 text-sm text-rose-300" aria-live="polite">
              {errors.role_interest}
            </p>
          ) : null}
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'submitting' ? 'Joining...' : 'Join the list'}
          </button>
        </div>
      </div>

      {message ? (
        <p
          className={`mt-4 text-sm ${status === 'success' ? 'text-emerald-300' : 'text-slate-300'}`}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
