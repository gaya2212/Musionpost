import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas px-6 py-16 text-white sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-canvas-elevated/70 p-8 shadow-2xl shadow-black/20 sm:p-10 lg:flex-row lg:items-stretch lg:justify-between lg:p-12">
        <div className="max-w-xl space-y-6 lg:w-[46%]">
          <Link href="/" className="inline-flex text-sm font-semibold tracking-[0.2em] text-cyan-200">
            MUSION
          </Link>
          <div className="space-y-4">
            <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              A clear path into Musion.
            </h1>
            <p className="max-w-lg text-lg text-slate-300">
              Sign in, choose your role, and start the onboarding flow with the same structure the rest of the platform uses.
            </p>
          </div>
          <div className="space-y-3 rounded-3xl border border-white/10 bg-canvas-black/70 p-5 text-sm text-slate-300">
            <p className="font-medium text-white">What happens here</p>
            <ul className="space-y-2">
              <li>• Create your account with email and password.</li>
              <li>• Choose whether you are an artist or a professional.</li>
              <li>• Complete the onboarding steps that fit your role.</li>
            </ul>
          </div>
        </div>

        <div className="w-full lg:w-[54%]">
          {children}
        </div>
      </div>
    </div>
  );
}
