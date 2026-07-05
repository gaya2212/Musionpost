import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-canvas-black/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Verify your email</p>
        <h2 className="font-display text-2xl font-semibold text-white">Check your inbox.</h2>
        <p className="text-sm text-slate-300">
          We will send you a verification link after you create the account. Once it is confirmed, you can continue into the Musion workspace.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-canvas-elevated/80 p-5 text-sm text-slate-300">
        <p className="font-medium text-white">What happens next</p>
        <ul className="mt-4 space-y-2">
          <li>• Open the verification email and confirm your address.</li>
          <li>• Return here to sign in and continue with your onboarding details.</li>
          <li>• Your profile will stay pending until verification is complete.</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
          Go to sign in
        </Link>
        <Link href="/signup" className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:text-cyan-200">
          Start again
        </Link>
      </div>
    </div>
  );
}
