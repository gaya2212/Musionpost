'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
        ) as Partial<Record<keyof LoginFormValues, string>>,
      );
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const client = createClient();

    if (!client) {
      setFormError('Supabase is not configured for this environment.');
      setIsSubmitting(false);
      return;
    }

    const { error } = await client.auth.signInWithPassword(parsed.data);

    if (error) {
      setFormError(error.message || 'Unable to sign in with those credentials.');
      setIsSubmitting(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <AuthLayout
      title="Welcome back to Musion."
      subtitle="Sign in to pick up your projects, matches, and conversations right where you left them."
    >
      <h2 className="text-3xl font-extrabold text-app-fg-1">Welcome back</h2>
      <p className="mt-2 text-[15px] text-app-fg-2">Enter your credentials to access your account</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            inputSize="lg"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            error={Boolean(fieldErrors.email)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p id="email-error" className="mt-1.5 text-[12px] text-app-red" aria-live="polite">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              inputSize="lg"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="pr-11"
              error={Boolean(fieldErrors.password)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-app-fg-3 hover:text-app-fg-2"
            >
              {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p id="password-error" className="mt-1.5 text-[12px] text-app-red" aria-live="polite">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className="rounded-app-md border border-app-red/30 bg-app-red/10 px-4 py-3 text-[13px] text-app-red" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" variant="gradient" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6">
        <SocialAuthButtons />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[13px] text-app-fg-2">
        <Link href="/signup" className="font-semibold text-app-primary hover:text-app-primary-hover">
          Create an account
        </Link>
        <a href="#" className="hover:text-app-fg-1">
          Reset password
        </a>
      </div>
    </AuthLayout>
  );
}
