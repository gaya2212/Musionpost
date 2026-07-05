'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signupCredentialsSchema } from '@/lib/validation/auth';
import {
  proProfileSchema,
  proTypeValues,
  proTypeLabels,
  rateRangeValues,
  rateRangeLabels,
} from '@/lib/validation/pro';

type ProFormState = {
  email: string;
  password: string;
  displayName: string;
  proType: string;
  location: string;
  specialties: string;
  genres: string;
  rateRange: string;
  notableCredits: string;
  portfolioLinks: string;
  verificationInterest: boolean;
};

type FieldErrors = Partial<Record<'email' | 'password' | keyof typeof proProfileSchema.shape, string>>;

const initialState: ProFormState = {
  email: '',
  password: '',
  displayName: '',
  proType: '',
  location: '',
  specialties: '',
  genres: '',
  rateRange: '',
  notableCredits: '',
  portfolioLinks: '',
  verificationInterest: false,
};

const steps = ['Account', 'Profile', 'Services', 'Experience', 'Confirm'] as const;

const issuesToFieldErrors = (issues: { path: PropertyKey[]; message: string }[]): FieldErrors =>
  Object.fromEntries(issues.map((issue) => [issue.path[0], issue.message])) as FieldErrors;

export default function ProSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const updateField = <K extends keyof ProFormState>(field: K, value: ProFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
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
      const parsed = proProfileSchema.pick({ displayName: true, proType: true, location: true }).safeParse({
        displayName: form.displayName,
        proType: form.proType,
        location: form.location,
      });
      if (!parsed.success) {
        setFieldErrors(issuesToFieldErrors(parsed.error.issues));
        return false;
      }
      return true;
    }

    if (step === 2) {
      const parsed = proProfileSchema.pick({ specialties: true, genres: true, rateRange: true }).safeParse({
        specialties: form.specialties,
        genres: form.genres,
        rateRange: form.rateRange,
      });
      if (!parsed.success) {
        setFieldErrors(issuesToFieldErrors(parsed.error.issues));
        return false;
      }
      return true;
    }

    if (step === 3) {
      const parsed = proProfileSchema.pick({ notableCredits: true, portfolioLinks: true }).safeParse({
        notableCredits: form.notableCredits,
        portfolioLinks: form.portfolioLinks,
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
    const profile = proProfileSchema.safeParse({
      displayName: form.displayName,
      proType: form.proType,
      location: form.location,
      specialties: form.specialties,
      genres: form.genres,
      rateRange: form.rateRange,
      notableCredits: form.notableCredits,
      portfolioLinks: form.portfolioLinks,
      verificationInterest: form.verificationInterest,
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

    const response = await fetch('/api/onboarding/pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.user.id,
        email: credentials.data.email,
        displayName: form.displayName,
        proType: form.proType,
        location: form.location,
        specialties: form.specialties,
        genres: form.genres,
        rateRange: form.rateRange,
        notableCredits: form.notableCredits,
        portfolioLinks: form.portfolioLinks,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setFormError(result?.error || 'Unable to save your professional profile. Please try again.');
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
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Professional onboarding</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Set up your professional profile.</h2>
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
                placeholder="Your name or business name"
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
              <label htmlFor="proType" className="mb-2 block text-sm font-medium text-slate-200">
                Professional type
              </label>
              <select
                id="proType"
                value={form.proType}
                onChange={(event) => updateField('proType', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.proType)}
                aria-describedby={fieldErrors.proType ? 'proType-error' : undefined}
              >
                <option value="">Select a type</option>
                {proTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {proTypeLabels[value]}
                  </option>
                ))}
              </select>
              {fieldErrors.proType ? (
                <p id="proType-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.proType}
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
                placeholder="City or remote"
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
              <label htmlFor="specialties" className="mb-2 block text-sm font-medium text-slate-200">
                Specialties
              </label>
              <input
                id="specialties"
                value={form.specialties}
                onChange={(event) => updateField('specialties', event.target.value)}
                placeholder="Mixing, vocal editing, campaign planning"
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.specialties)}
                aria-describedby={fieldErrors.specialties ? 'specialties-error' : undefined}
              />
              {fieldErrors.specialties ? (
                <p id="specialties-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.specialties}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="genres" className="mb-2 block text-sm font-medium text-slate-200">
                Genres you work in
              </label>
              <input
                id="genres"
                value={form.genres}
                onChange={(event) => updateField('genres', event.target.value)}
                placeholder="Pop, folk, hip-hop"
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.genres)}
                aria-describedby={fieldErrors.genres ? 'genres-error' : undefined}
              />
              {fieldErrors.genres ? (
                <p id="genres-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.genres}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="rateRange" className="mb-2 block text-sm font-medium text-slate-200">
                Rate range
              </label>
              <select
                id="rateRange"
                value={form.rateRange}
                onChange={(event) => updateField('rateRange', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.rateRange)}
                aria-describedby={fieldErrors.rateRange ? 'rateRange-error' : undefined}
              >
                <option value="">Select a range</option>
                {rateRangeValues.map((value) => (
                  <option key={value} value={value}>
                    {rateRangeLabels[value]}
                  </option>
                ))}
              </select>
              {fieldErrors.rateRange ? (
                <p id="rateRange-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.rateRange}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div>
              <label htmlFor="notableCredits" className="mb-2 block text-sm font-medium text-slate-200">
                Notable credits
              </label>
              <textarea
                id="notableCredits"
                value={form.notableCredits}
                onChange={(event) => updateField('notableCredits', event.target.value)}
                placeholder="Track title · artist · role · year"
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.notableCredits)}
                aria-describedby={fieldErrors.notableCredits ? 'notableCredits-error' : undefined}
              />
              {fieldErrors.notableCredits ? (
                <p id="notableCredits-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.notableCredits}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="portfolioLinks" className="mb-2 block text-sm font-medium text-slate-200">
                Portfolio links
              </label>
              <input
                id="portfolioLinks"
                value={form.portfolioLinks}
                onChange={(event) => updateField('portfolioLinks', event.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-2xl border border-white/10 bg-canvas-elevated/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                aria-invalid={Boolean(fieldErrors.portfolioLinks)}
                aria-describedby={fieldErrors.portfolioLinks ? 'portfolioLinks-error' : undefined}
              />
              {fieldErrors.portfolioLinks ? (
                <p id="portfolioLinks-error" className="mt-2 text-sm text-rose-300" aria-live="polite">
                  {fieldErrors.portfolioLinks}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <div className="rounded-3xl border border-white/10 bg-canvas-elevated/80 p-5 text-sm text-slate-300">
            <p className="font-medium text-white">Confirm your details</p>
            <ul className="mt-4 space-y-2">
              <li>• Email: {form.email || '—'}</li>
              <li>• Name: {form.displayName || '—'}</li>
              <li>• Type: {form.proType ? proTypeLabels[form.proType as keyof typeof proTypeLabels] : '—'}</li>
              <li>• Location: {form.location || '—'}</li>
              <li>• Specialties: {form.specialties || '—'}</li>
              <li>• Rate range: {form.rateRange ? rateRangeLabels[form.rateRange as keyof typeof rateRangeLabels] : '—'}</li>
            </ul>

            <label htmlFor="verificationInterest" className="mt-4 flex items-start gap-3 text-sm text-slate-300">
              <input
                id="verificationInterest"
                type="checkbox"
                checked={form.verificationInterest}
                onChange={(event) => updateField('verificationInterest', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-canvas-black/80"
              />
              <span>Add me to the Musion Verified review queue once my profile is live.</span>
            </label>

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

      {step < 4 ? (
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
