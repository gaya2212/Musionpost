import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20 text-white">
      <div className="rounded-[1.75rem] border border-white/10 bg-canvas-black/70 p-8 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Dashboard</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Welcome to your Musion workspace.</h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-300">
          This is the first authenticated destination for the MVP. The full production workspace will be added in the next phase.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
