'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RiUserVoiceLine, RiToolsLine, RiArrowRightLine } from '@remixicon/react';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function SignupPage() {
  const router = useRouter();

  const chooseRole = (role: 'artist' | 'pro') => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('signup-role', role);
    }

    router.push(role === 'artist' ? '/signup/artist' : '/signup/pro');
  };

  return (
    <AuthLayout
      title="Welcome to the Musician Community."
      subtitle="Tell us about yourself so we can personalize your experience."
    >
      <h2 className="text-3xl font-extrabold text-app-fg-1">Get started now</h2>
      <p className="mt-2 text-[15px] text-app-fg-2">Choose how you will work with Musion.</p>

      <div className="mt-8 grid gap-4">
        <button
          type="button"
          onClick={() => chooseRole('artist')}
          className="group flex items-start gap-4 rounded-app-xl border border-app-border bg-app-surface p-5 text-left shadow-app-sm transition hover:border-app-primary hover:shadow-app-md"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-app-md bg-app-primary-light text-app-primary">
            <RiUserVoiceLine size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-app-fg-1">I make music</p>
            <p className="mt-1 text-[13px] text-app-fg-2">
              Start with your goals, your sound, and the kind of support you want from collaborators.
            </p>
          </div>
          <RiArrowRightLine size={18} className="mt-1 shrink-0 text-app-fg-3 transition group-hover:text-app-primary" />
        </button>

        <button
          type="button"
          onClick={() => chooseRole('pro')}
          className="group flex items-start gap-4 rounded-app-xl border border-app-border bg-app-surface p-5 text-left shadow-app-sm transition hover:border-app-primary hover:shadow-app-md"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-app-md bg-app-primary-light text-app-primary">
            <RiToolsLine size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-app-fg-1">I work with artists</p>
            <p className="mt-1 text-[13px] text-app-fg-2">
              Share your services, your experience, and the work you want to take on.
            </p>
          </div>
          <RiArrowRightLine size={18} className="mt-1 shrink-0 text-app-fg-3 transition group-hover:text-app-primary" />
        </button>
      </div>

      <p className="mt-8 text-[13px] text-app-fg-2">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-app-primary hover:text-app-primary-hover">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
