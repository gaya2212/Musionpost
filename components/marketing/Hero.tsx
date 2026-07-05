'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const TubesCursorCanvas = dynamic(
  () => import('./TubesCursorCanvas').then((mod) => mod.TubesCursorCanvas),
  { ssr: false },
);

const EASE = [0.22, 1, 0.36, 1] as const;

const headlineWords = ['Built', 'for', 'artists', 'who', 'take', 'it'];
const HEADLINE_START = 0.9;
const WORD_DURATION = 0.3;
const WORD_STAGGER = 0.06;

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-bg">
      {/* 0–500ms: background */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_35%,rgba(65,105,225,0.16),transparent_70%)]" />
        <div className="gradient-shift absolute inset-0 bg-[linear-gradient(120deg,rgba(0,207,255,0.10),rgba(200,80,192,0.10),rgba(255,110,180,0.10))] opacity-70" />
        <TubesCursorCanvas />
        {/* content shield: keeps the tube strands vivid at the edges while
            fading behind the text column so copy stays legible */}
        <div className="absolute inset-0 bg-[radial-gradient(48%_42%_at_50%_46%,var(--bg)_0%,transparent_75%)] opacity-90" />
      </motion.div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-32 text-center sm:px-8">
        {/* 500–900ms: badge (logo-equivalent glow element) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
        >
          <div className="glow-pulse rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-sm font-medium text-text-body backdrop-blur-xl">
            Pilot opening in LA · NYC · Nashville · Atlanta
          </div>
        </motion.div>

        {/* headline: word-by-word reveal, 300ms/word, 60ms stagger */}
        <h1 className="mt-8 font-display text-4xl font-bold leading-tight text-text-body sm:text-5xl lg:text-6xl">
          {headlineWords.map((word, index) => (
            <motion.span
              key={word}
              className="mr-[0.28em] inline-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: HEADLINE_START + index * WORD_STAGGER,
                duration: WORD_DURATION,
                ease: EASE,
              }}
            >
              {word}
            </motion.span>
          ))}
          <motion.span
            className="inline-block bg-grad-brand bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: HEADLINE_START + headlineWords.length * WORD_STAGGER,
              duration: WORD_DURATION,
              ease: EASE,
            }}
          >
            seriously.
          </motion.span>
        </h1>

        {/* 1400ms: subline */}
        <motion.p
          className="mt-6 max-w-xl text-lg text-text-muted"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5, ease: EASE }}
        >
          Get matched with vetted producers, engineers, and studios, then move through one clear path from idea to release.
        </motion.p>

        {/* 1700ms: CTA row */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.5, ease: EASE }}
        >
          <a href="#waitlist" className="glow-pulse rounded-full">
            <span className="block rounded-full bg-grad-cyan px-7 py-3.5 text-sm font-semibold text-bg transition hover:brightness-110 hover:scale-[1.01]">
              Get Early Access
            </span>
          </a>
          <a
            href="#workflow"
            className="rounded-full border border-white/15 bg-white/[0.05] px-7 py-3.5 text-sm font-medium text-text-body backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.08] hover:scale-[1.01]"
          >
            See how it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}
