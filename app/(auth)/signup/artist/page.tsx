'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signupCredentialsSchema } from '@/lib/validation/auth';
import { artistProfileSchema, budgetRangeValues, budgetRangeLabels } from '@/lib/validation/artist';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

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

const labelClass = 'mb-1.5 block text-[13px] font-medium text-app-fg-1';
const errorClass = 'mt-1.5 text-[12px] text-app-red';

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

    // Supabase returns a fake, non-persisted user (error is null, but
    // identities is an empty array) when signUp() is called for an email
    // that's already registered — anti-enumeration behavior, not a new
    // account. Proceeding past this point would POST a made-up userId to
    // the onboarding route and fail there with a confusing 403 instead.
    if (data.user.identities?.length === 0) {
      setFormError('An account with this email already exists. Sign in instead to finish setting up your profile.');
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
    <AuthLayout
      title="Welcome to the Musician Community."
      subtitle="Tell us about yourself so we can personalize your experience."
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-app-fg-1">Set up your artist profile</h2>
        <span className="shrink-0 rounded-app-pill border border-app-border px-3 py-1 text-[12px] font-medium text-app-fg-2">
          Step {step + 1} / {steps.length}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-app-pill bg-app-surface-2">
        <div className="h-full rounded-app-pill bg-app-btn-gradient transition-all" style={{ width: `${progress}%` }} />
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {step === 0 ? (
          <>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>
              <Input
                id="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                type="email"
                inputSize="lg"
                placeholder="you@example.com"
                error={Boolean(fieldErrors.email)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email ? <p id="email-error" className={errorClass} aria-live="polite">{fieldErrors.email}</p> : null}
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <Input
                id="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                type="password"
                inputSize="lg"
                placeholder="Create a password"
                error={Boolean(fieldErrors.password)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password ? <p id="password-error" className={errorClass} aria-live="polite">{fieldErrors.password}</p> : null}
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <label htmlFor="displayName" className={labelClass}>
                Display name
              </label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                inputSize="lg"
                placeholder="Your artist name"
                error={Boolean(fieldErrors.displayName)}
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
              />
              {fieldErrors.displayName ? <p id="displayName-error" className={errorClass} aria-live="polite">{fieldErrors.displayName}</p> : null}
            </div>
            <div>
              <label htmlFor="genres" className={labelClass}>
                Primary genres
              </label>
              <Input
                id="genres"
                value={form.genres}
                onChange={(event) => updateField('genres', event.target.value)}
                inputSize="lg"
                placeholder="Indie, R&B, electronic"
                error={Boolean(fieldErrors.primaryGenres)}
                aria-invalid={Boolean(fieldErrors.primaryGenres)}
                aria-describedby={fieldErrors.primaryGenres ? 'genres-error' : undefined}
              />
              {fieldErrors.primaryGenres ? <p id="genres-error" className={errorClass} aria-live="polite">{fieldErrors.primaryGenres}</p> : null}
            </div>
            <div>
              <label htmlFor="location" className={labelClass}>
                Location
              </label>
              <Input
                id="location"
                value={form.location}
                onChange={(event) => updateField('location', event.target.value)}
                inputSize="lg"
                placeholder="Berlin, London, or remote"
                error={Boolean(fieldErrors.location)}
                aria-invalid={Boolean(fieldErrors.location)}
                aria-describedby={fieldErrors.location ? 'location-error' : undefined}
              />
              {fieldErrors.location ? <p id="location-error" className={errorClass} aria-live="polite">{fieldErrors.location}</p> : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div>
              <label htmlFor="projectGoals" className={labelClass}>
                What you are working on
              </label>
              <Textarea
                id="projectGoals"
                value={form.projectGoals}
                onChange={(event) => updateField('projectGoals', event.target.value)}
                placeholder="Describe the release, the sound, and the support you need."
                className="min-h-32"
                error={Boolean(fieldErrors.projectGoals)}
                aria-invalid={Boolean(fieldErrors.projectGoals)}
                aria-describedby={fieldErrors.projectGoals ? 'projectGoals-error' : undefined}
              />
              {fieldErrors.projectGoals ? <p id="projectGoals-error" className={errorClass} aria-live="polite">{fieldErrors.projectGoals}</p> : null}
            </div>
            <div>
              <label htmlFor="budgetRange" className={labelClass}>
                Budget range
              </label>
              <Select
                id="budgetRange"
                value={form.budgetRange}
                onChange={(event) => updateField('budgetRange', event.target.value)}
                selectSize="lg"
                error={Boolean(fieldErrors.budgetRange)}
                aria-invalid={Boolean(fieldErrors.budgetRange)}
                aria-describedby={fieldErrors.budgetRange ? 'budgetRange-error' : undefined}
              >
                <option value="">Select a range</option>
                {budgetRangeValues.map((value) => (
                  <option key={value} value={value}>
                    {budgetRangeLabels[value]}
                  </option>
                ))}
              </Select>
              {fieldErrors.budgetRange ? <p id="budgetRange-error" className={errorClass} aria-live="polite">{fieldErrors.budgetRange}</p> : null}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <div className="rounded-app-xl border border-app-border bg-app-surface-2 p-5 text-[13px] text-app-fg-2">
            <p className="font-semibold text-app-fg-1">Confirm your details</p>
            <ul className="mt-4 space-y-2">
              <li>• Email: {form.email || '—'}</li>
              <li>• Artist name: {form.displayName || '—'}</li>
              <li>• Genres: {form.genres || '—'}</li>
              <li>• Location: {form.location || '—'}</li>
              <li>• Project goals: {form.projectGoals || '—'}</li>
              <li>• Budget range: {form.budgetRange ? budgetRangeLabels[form.budgetRange as keyof typeof budgetRangeLabels] : '—'}</li>
            </ul>
            {formError ? (
              <p className="mt-4 rounded-app-md border border-app-red/30 bg-app-red/10 px-4 py-3 text-[13px] text-app-red" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="submit" variant="gradient" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </Button>
              <Button type="button" variant="secondary" size="lg" onClick={prevStep}>
                Back
              </Button>
            </div>
          </div>
        ) : null}
      </form>

      {step < 3 ? (
        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Button type="button" variant="secondary" size="lg" onClick={prevStep} disabled={step === 0}>
            Back
          </Button>
          <Button type="button" variant="gradient" size="lg" onClick={nextStep}>
            Continue
          </Button>
        </div>
      ) : null}
    </AuthLayout>
  );
}
