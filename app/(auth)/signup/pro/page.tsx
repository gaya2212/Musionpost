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
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';

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

const labelClass = 'mb-1.5 block text-[13px] font-medium text-app-fg-1';
const errorClass = 'mt-1.5 text-[12px] text-app-red';

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
    <AuthLayout
      title="Welcome to the Musician Community."
      subtitle="Tell us about yourself so we can personalize your experience."
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-app-fg-1">Set up your professional profile</h2>
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
                placeholder="Your name or business name"
                error={Boolean(fieldErrors.displayName)}
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
              />
              {fieldErrors.displayName ? <p id="displayName-error" className={errorClass} aria-live="polite">{fieldErrors.displayName}</p> : null}
            </div>
            <div>
              <label htmlFor="proType" className={labelClass}>
                Professional type
              </label>
              <Select
                id="proType"
                value={form.proType}
                onChange={(event) => updateField('proType', event.target.value)}
                selectSize="lg"
                error={Boolean(fieldErrors.proType)}
                aria-invalid={Boolean(fieldErrors.proType)}
                aria-describedby={fieldErrors.proType ? 'proType-error' : undefined}
              >
                <option value="">Select a type</option>
                {proTypeValues.map((value) => (
                  <option key={value} value={value}>
                    {proTypeLabels[value]}
                  </option>
                ))}
              </Select>
              {fieldErrors.proType ? <p id="proType-error" className={errorClass} aria-live="polite">{fieldErrors.proType}</p> : null}
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
                placeholder="City or remote"
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
              <label htmlFor="specialties" className={labelClass}>
                Specialties
              </label>
              <Input
                id="specialties"
                value={form.specialties}
                onChange={(event) => updateField('specialties', event.target.value)}
                inputSize="lg"
                placeholder="Mixing, vocal editing, campaign planning"
                error={Boolean(fieldErrors.specialties)}
                aria-invalid={Boolean(fieldErrors.specialties)}
                aria-describedby={fieldErrors.specialties ? 'specialties-error' : undefined}
              />
              {fieldErrors.specialties ? <p id="specialties-error" className={errorClass} aria-live="polite">{fieldErrors.specialties}</p> : null}
            </div>
            <div>
              <label htmlFor="genres" className={labelClass}>
                Genres you work in
              </label>
              <Input
                id="genres"
                value={form.genres}
                onChange={(event) => updateField('genres', event.target.value)}
                inputSize="lg"
                placeholder="Pop, folk, hip-hop"
                error={Boolean(fieldErrors.genres)}
                aria-invalid={Boolean(fieldErrors.genres)}
                aria-describedby={fieldErrors.genres ? 'genres-error' : undefined}
              />
              {fieldErrors.genres ? <p id="genres-error" className={errorClass} aria-live="polite">{fieldErrors.genres}</p> : null}
            </div>
            <div>
              <label htmlFor="rateRange" className={labelClass}>
                Rate range
              </label>
              <Select
                id="rateRange"
                value={form.rateRange}
                onChange={(event) => updateField('rateRange', event.target.value)}
                selectSize="lg"
                error={Boolean(fieldErrors.rateRange)}
                aria-invalid={Boolean(fieldErrors.rateRange)}
                aria-describedby={fieldErrors.rateRange ? 'rateRange-error' : undefined}
              >
                <option value="">Select a range</option>
                {rateRangeValues.map((value) => (
                  <option key={value} value={value}>
                    {rateRangeLabels[value]}
                  </option>
                ))}
              </Select>
              {fieldErrors.rateRange ? <p id="rateRange-error" className={errorClass} aria-live="polite">{fieldErrors.rateRange}</p> : null}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div>
              <label htmlFor="notableCredits" className={labelClass}>
                Notable credits
              </label>
              <Textarea
                id="notableCredits"
                value={form.notableCredits}
                onChange={(event) => updateField('notableCredits', event.target.value)}
                placeholder="Track title · artist · role · year"
                className="min-h-24"
                error={Boolean(fieldErrors.notableCredits)}
                aria-invalid={Boolean(fieldErrors.notableCredits)}
                aria-describedby={fieldErrors.notableCredits ? 'notableCredits-error' : undefined}
              />
              {fieldErrors.notableCredits ? <p id="notableCredits-error" className={errorClass} aria-live="polite">{fieldErrors.notableCredits}</p> : null}
            </div>
            <div>
              <label htmlFor="portfolioLinks" className={labelClass}>
                Portfolio links
              </label>
              <Input
                id="portfolioLinks"
                value={form.portfolioLinks}
                onChange={(event) => updateField('portfolioLinks', event.target.value)}
                inputSize="lg"
                placeholder="https://example.com"
                error={Boolean(fieldErrors.portfolioLinks)}
                aria-invalid={Boolean(fieldErrors.portfolioLinks)}
                aria-describedby={fieldErrors.portfolioLinks ? 'portfolioLinks-error' : undefined}
              />
              {fieldErrors.portfolioLinks ? <p id="portfolioLinks-error" className={errorClass} aria-live="polite">{fieldErrors.portfolioLinks}</p> : null}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <div className="rounded-app-xl border border-app-border bg-app-surface-2 p-5 text-[13px] text-app-fg-2">
            <p className="font-semibold text-app-fg-1">Confirm your details</p>
            <ul className="mt-4 space-y-2">
              <li>• Email: {form.email || '—'}</li>
              <li>• Name: {form.displayName || '—'}</li>
              <li>• Type: {form.proType ? proTypeLabels[form.proType as keyof typeof proTypeLabels] : '—'}</li>
              <li>• Location: {form.location || '—'}</li>
              <li>• Specialties: {form.specialties || '—'}</li>
              <li>• Rate range: {form.rateRange ? rateRangeLabels[form.rateRange as keyof typeof rateRangeLabels] : '—'}</li>
            </ul>

            <div className="mt-4">
              <Checkbox
                id="verificationInterest"
                checked={form.verificationInterest}
                onChange={(event) => updateField('verificationInterest', event.target.checked)}
                label="Add me to the Musion Verified review queue once my profile is live."
              />
            </div>

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

      {step < 4 ? (
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
