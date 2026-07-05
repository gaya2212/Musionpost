import Link from 'next/link';
import { Hero } from '@/components/marketing/Hero';
import { WaitlistForm } from '@/components/shared/WaitlistForm';

const stages = [
  {
    title: 'Ideation',
    description: 'Shape the brief, define the scope, and align the first decisions.',
  },
  {
    title: 'Recording',
    description: 'Bring in the right engineer or studio to capture the work cleanly.',
  },
  {
    title: 'Mixing & Mastering',
    description: 'Move the release into a polished, release-ready state.',
  },
  {
    title: 'Launch & Promote',
    description: 'Plan the rollout with the people who know how to position it.',
  },
  {
    title: 'Distribution',
    description: 'Route the release through trusted partners without the usual noise.',
  },
  {
    title: 'Community',
    description: 'Keep the project moving after release with the right support.',
  },
];

const categories = [
  'Producers',
  'Mix engineers',
  'Mastering engineers',
  'Studios',
  'Marketing support',
  'PR and brand support',
];

export default function MarketingPage() {
  return (
    <main className="bg-canvas">
      <Hero />

      <section id="workflow" className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Six-stage workflow</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
            A practical route from first idea to release support.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage) => (
            <div key={stage.title} className="rounded-2xl border border-white/10 bg-canvas-elevated/80 p-6">
              <h3 className="font-display text-xl font-semibold text-white">{stage.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{stage.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why-musion" className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-canvas-elevated/80 p-8 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Why Musion</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
                Clear structure without losing the human side of music work.
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">
                Musion keeps project decisions visible and makes it easier to bring the right collaborators into each stage at the right time.
              </p>
            </div>
            <div className="space-y-4">
              {[
                'Artists get a clear production path instead of scattered messages and tools.',
                'Professionals see the context behind each request before they commit.',
                'Projects stay organized from first concept through release and beyond.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-canvas-black/70 p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-canvas-black/70 p-8 sm:p-10 lg:p-12">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Who Musion supports</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
            A practical network for the people behind the release.
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <div key={category} className="rounded-2xl border border-white/10 bg-canvas-elevated/70 p-4 text-sm text-slate-300">
                {category}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-transparent to-fuchsia-500/10 p-8 sm:p-10 lg:p-12">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Musion Verified</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
            Verified by Musion for work that is documented and traceable.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            The badge marks projects with clear collaboration history and reviewable evidence, without making claims about cryptographic signing.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-canvas-elevated/70 p-8 sm:p-10 lg:p-12">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Manifesto</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
            The production layer music never had.
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            Musion brings structure to the people side of making music. It gives artists and professionals a shared path, with the context needed to move from idea to release with less friction.
          </p>
          <Link href="/manifesto" className="mt-6 inline-flex text-sm font-semibold text-cyan-200 transition hover:text-cyan-100">
            Read the manifesto →
          </Link>
        </div>
      </section>

      <section id="waitlist" className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-canvas-black/90 p-8 sm:p-10 lg:p-12">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Join the waitlist</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              Get early access when Musion opens for artists and professionals.
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Share your email and role interest. We will reach out when the first release window opens.
            </p>
          </div>
          <WaitlistForm />
        </div>
      </section>
    </main>
  );
}
