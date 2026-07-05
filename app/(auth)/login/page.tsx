'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    <div className="rounded-[1.75rem] border border-white/10 bg-canvas-black/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Sign in</p>
        <h2 className="font-display text-2xl font-semibold text-white">Welcome back.</h2>
        <p className="text-sm text-slate-300">
          Continue to your Musion workspace with the email you used to create your account.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
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

        {formError ? (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in…' : 'Continue to your workspace'}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <Link href="/signup" className="font-medium text-cyan-200 transition hover:text-cyan-100">
          Create an account
        </Link>
        <a href="#" className="transition hover:text-white">
          Reset password
        </a>
      </div>
    </div>
  );
}
