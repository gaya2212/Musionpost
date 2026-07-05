'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();

  const chooseRole = (role: 'artist' | 'pro') => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('signup-role', role);
    }

    router.push(role === 'artist' ? '/signup/artist' : '/signup/pro');
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-canvas-black/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Create your account</p>
        <h2 className="font-display text-2xl font-semibold text-white">Choose how you will work with Musion.</h2>
        <p className="text-sm text-slate-300">
          Artists and professionals each follow a tailored onboarding flow.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        <button
          type="button"
          onClick={() => chooseRole('artist')}
          className="rounded-3xl border border-cyan-400/20 bg-canvas-elevated/80 p-5 text-left transition hover:border-cyan-400/40 hover:bg-canvas-elevated"
        >
          <p className="text-sm font-semibold text-white">I make music</p>
          <p className="mt-2 text-sm text-slate-300">
            Start with your goals, your sound, and the kind of support you want from collaborators.
          </p>
        </button>

        <button
          type="button"
          onClick={() => chooseRole('pro')}
          className="rounded-3xl border border-white/10 bg-canvas-elevated/80 p-5 text-left transition hover:border-cyan-400/40 hover:bg-canvas-elevated"
        >
          <p className="text-sm font-semibold text-white">I work with artists</p>
          <p className="mt-2 text-sm text-slate-300">
            Share your services, your experience, and the work you want to take on.
          </p>
        </button>
      </div>

      <p className="mt-6 text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-cyan-200 transition hover:text-cyan-100">
          Sign in
        </Link>
      </p>
    </div>
  );
}
