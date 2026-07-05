'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signupCredentialsSchema } from '@/lib/validation/auth';
import { artistProfileSchema, budgetRangeValues, budgetRangeLabels } from '@/lib/validation/artist';

type ArtistFormState = {
  email: string;
  password: string;
  displayName: string;
  genres: string;
  location: string;
  projectGoals: string;
  budgetRange: string;
};

type FieldErrors = Partial<Record<'email' | 'password' | keyof typeof artistProfileSchema.shape, string>>;

const initialState: ArtistFormState = {
  email: '',
  password: '',
  displayName: '',
  genres: '',
  location: '',
  projectGoals: '',
  budgetRange: '',
};

const steps = ['Account', 'Profile', 'Goals', 'Confirm'] as const;

const issuesToFieldErrors = (issues: { path: PropertyKey[]; message: string }[]): FieldErrors =>
  Object.fromEntries(issues.map((issue) => [issue.path[0], issue.message])) as FieldErrors;

export default function ArtistSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const updateField = (field: keyof ArtistFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field === 'genres' ? 'primaryGenres' : field]: undefined }));
  };

  const validateStep = () => {
    if (step === 0) {
      const parsed = signupCredentialsSchema.safeParse({ email: form.email, password: form.password });
      if (!parsed.success) {
        setFieldErrors(issuesToFieldErrors(parsed.error.issues));
        return false;
      }
      return true;
    }

    if (step === 1) {
      const parsed = artistProfileSchema.pick({ displayName: true, primaryGenres: true, location: true }).safeParse({
        displayName: form.displayName,
        primaryGenres: form.genres,
        location: form.location,
      });
      if (!parsed.success) {
        setFieldErrors(issuesToFieldErrors(parsed.error.issues));
        return false;
      }
      return true;
    }

    if (step === 2) {
      const parsed = artistProfileSchema.pick({ projectGoals: true, budgetRange: true }).safeParse({
        projectGoals: form.projectGoals,
        budgetRange: form.budgetRange,
      });
      if (!parsed.success) {
        setFieldErrors(issuesToFieldErrors(parsed.error.issues));
        return false;
      }
      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setFieldErrors({});
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const prevStep = () => setStep((current) => Math.max(current - 1, 0));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const credentials = signupCredentialsSchema.safeParse({ email: form.email, password: form.password });
    const profile = artistProfileSchema.safeParse({
      displayName: form.displayName,
      primaryGenres: form.genres,
      location: form.location,
      projectGoals: form.projectGoals,
      budgetRange: form.budgetRange,
    });

    if (!credentials.success || !profile.success) {
      setFormError('Please go back and fix the highlighted fields before creating your account.');
      return;
    }

    setIsSubmitting(true);

    const client = createClient();

    if (!client) {
      setFormError('Supabase is not configured for this environment.');
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await client.auth.signUp({
      email: credentials.data.email,
      password: credentials.data.password,
      options: { data: { display_name: form.displayName } },
    });

    if (error || !data.user) {
      setFormError(error?.message || 'Unable to create your account right now.');
      setIsSubmitting(false);
      return;
    }

    const response = await fetch('/api/onboarding/artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.user.id,
        email: credentials.data.email,
        displayName: form.displayName,
        location: form.location,
        primaryGenres: form.genres,
        projectGoals: form.projectGoals,
        budgetRange: form.budgetRange,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setFormError(result?.error || 'Unable to save your artist profile. Please try again.');
      setIsSubmitting(false);
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('signup-role');
    }

    router.push('/verify');
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-canvas-black/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Artist onboarding</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Set up your artist profile.</h2>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
          Step {step + 1} / {steps.length}
        </div>
      </div>

      <div className="mt-5 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-cyan-400/70 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {step === 0 ? (
          <>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                Email address
              </label>
              <input
                id="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email ? (
                <p id="email-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>
              <input
                id="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                type="password"
                placeholder="Create a password"
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password ? (
                <p id="password-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-slate-200">
                Display name
              </label>
              <input
                id="displayName"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                placeholder="Your artist name"
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
              />
              {fieldErrors.displayName ? (
                <p id="displayName-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.displayName}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="genres" className="mb-2 block text-sm font-medium text-slate-200">
                Primary genres
              </label>
              <input
                id="genres"
                value={form.genres}
                onChange={(event) => updateField('genres', event.target.value)}
                placeholder="Indie, R&B, electronic"
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.primaryGenres)}
                aria-describedby={fieldErrors.primaryGenres ? 'genres-error' : undefined}
              />
              {fieldErrors.primaryGenres ? (
                <p id="genres-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.primaryGenres}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="location" className="mb-2 block text-sm font-medium text-slate-200">
                Location
              </label>
              <input
                id="location"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="Berlin, London, or remote"
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.location)}
                aria-describedby={fieldErrors.location ? 'location-error' : undefined}
              />
              {fieldErrors.location ? (
                <p id="location-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.location}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div>
              <label htmlFor="projectGoals" className="mb-2 block text-sm font-medium text-slate-200">
                What you are working on
              </label>
              <textarea
                id="projectGoals"
                value={form.projectGoals}
                onChange={(event) => updateField('projectGoals', event.target.value)}
                placeholder="Describe the release, the sound, and the support you need."
                className="min-h-32 w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.projectGoals)}
                aria-describedby={fieldErrors.projectGoals ? 'projectGoals-error' : undefined}
              />
              {fieldErrors.projectGoals ? (
                <p id="projectGoals-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.projectGoals}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="budgetRange" className="mb-2 block text-sm font-medium text-slate-200">
                Budget range
              </label>
              <select
                id="budgetRange"
                value={form.budgetRange}
                onChange={(event) => updateField('budgetRange', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.budgetRange)}
                aria-describedby={fieldErrors.budgetRange ? 'budgetRange-error' : undefined}
              >
                <option value="">Select a range</option>
                {budgetRangeValues.map((value) => (
                  <option key={value} value={value}>
                    {budgetRangeLabels[value]}
                  </option>
                ))}
              </select>
              {fieldErrors.budgetRange ? (
                <p id="budgetRange-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.budgetRange}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <div className="rounded-3xl border border-white/10 bg-canvas-elevated/80 p-5 text-sm text-slate-300">
            <p className="font-medium text-white">Confirm your details</p>
            <ul className="mt-4 space-y-2">
              <li>• Email: {form.email || '—'}</li>
              <li>• Artist name: {form.displayName || '—'}</li>
              <li>• Genres: {form.genres || '—'}</li>
              <li>• Location: {form.location || '—'}</li>
              <li>• Project goals: {form.projectGoals || '—'}</li>
              <li>• Budget range: {form.budgetRange ? budgetRangeLabels[form.budgetRange as keyof typeof budgetRangeLabels] : '—'}</li>
            </ul>
            {formError ? (
              <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
              <button type="button" onClick={prevStep} className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:text-cyan-200">
                Back
              </button>
            </div>
          </div>
        ) : null}
      </form>

      {step < 3 ? (
        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={prevStep}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:text-cyan-200"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Continue
          </button>
        </div>
      ) : null}
    </div>
  );
}
