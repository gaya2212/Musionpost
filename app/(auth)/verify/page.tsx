import Link from 'next/link';
import { RiMailCheckLine } from '@remixicon/react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { buttonClasses } from '@/components/ui/Button';

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Almost there."
      subtitle="One more step and you're in — confirm your email to unlock your Musion workspace."
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-app-lg bg-app-primary-light text-app-primary">
        <RiMailCheckLine size={22} />
      </div>

      <h2 className="mt-5 text-3xl font-extrabold text-app-fg-1">Check your inbox</h2>
      <p className="mt-2 text-[15px] text-app-fg-2">
        We&apos;ll send you a verification link after you create the account. Once it&apos;s confirmed, you can
        continue into the Musion workspace.
      </p>

      <div className="mt-6 rounded-app-xl border border-app-border bg-app-surface-2 p-5 text-[13px] text-app-fg-2">
        <p className="font-semibold text-app-fg-1">What happens next</p>
        <ul className="mt-3 space-y-2">
          <li>• Open the verification email and confirm your address.</li>
          <li>• Return here to sign in and continue with your onboarding details.</li>
          <li>• Your profile will stay pending until verification is complete.</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className={buttonClasses('gradient', 'lg')}>
          Go to sign in
        </Link>
        <Link href="/signup" className={buttonClasses('secondary', 'lg')}>
          Start again
        </Link>
      </div>
    </AuthLayout>
  );
}
