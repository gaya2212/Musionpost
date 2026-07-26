import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-app-auth-panel px-12 py-12 text-white lg:flex">
        <Link href="/login" className="flex items-center gap-3">
          <Image src="/logo-mark.png" alt="" width={40} height={34} priority />
          <span className="text-2xl font-extrabold tracking-tight">MUSION</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">{title}</h1>
          <p className="mt-4 text-lg text-white/80">{subtitle}</p>
        </div>

        <p className="text-sm text-white/50">Musion — structured workflow, real people.</p>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12 sm:px-10">
        <div
          className="pointer-events-none absolute -top-24 right-[-12%] h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(185,70,255,0.16), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-[-18%] left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(28,99,255,0.14), transparent 70%)' }}
        />

        <div className="relative w-full max-w-md">
          <Link href="/login" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Image src="/logo-mark.png" alt="" width={32} height={28} priority />
            <span className="text-lg font-extrabold tracking-tight text-app-fg-1">MUSION</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
