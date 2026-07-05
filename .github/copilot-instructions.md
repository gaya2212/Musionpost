# Copilot Instructions for Musion

Read this file before generating any code, comment, or copy for the Musion repo. These rules override anything you learned elsewhere.

Full architectural context lives in `/MVP_ARCHITECTURE.md`. This file is the fast-reference behavioral spec.

---

## What Musion is

Musion is a **structured marketplace connecting independent artists with human music professionals** across a six-stage production workflow: Ideation → Recording → Mixing & Mastering → Launch & Promote → Distribution → Community.

Musion's AI matches people. It does not generate music.

## What Musion is not (and never claim it is)

- Not an AI music generator
- Not a distribution engine (we route to licensed distribution API partners)
- Not a DAW
- Not a social network

## Banned language (never write in code, UI, comments, or docs)

- "AI-powered distribution engine" or any variation
- "AI Launch" (the fourth stage is called "Launch & Promote" for users, `promotion_design` in the database)
- "Upload once, grow everywhere"
- "AI grows your audience"
- "AI generates" anything music-related
- "not because X, but because Y" (permanently banned across all Musion assets, per Gaya)
- Startup buzzwords: revolutionize, disrupt, empower, unlock, leverage, next-gen, game-changing, world-class
- Vague hype: "take your music to the next level", "the future of music"

## Preferred language

- "AI matches you with the right team"
- "Structured workflow, real people"
- "Launch & Promote"
- "Human-verified production"
- "The production layer music never had"

---

## Tech conventions

### Framework
- Next.js 15 App Router. React Server Components by default. Add `'use client'` only where interactivity requires it.
- TypeScript strict. Never use `any` without a comment explaining why.
- Package manager: pnpm 9.

### Styling
- Tailwind CSS with brand tokens from `styles/tokens.css`. Reference tokens through Tailwind's theme, never hex codes inline.
- shadcn/ui primitives in `components/ui/`. Compose, don't fork.
- Mobile-first breakpoints. Test at 375px before medium.

### Data
- Supabase for auth, DB, storage, realtime.
- **RLS enabled on every table.** No exceptions.
- Service role key is server-only. Never import it in a component that could ship to the browser.
- Every form validated with a Zod schema that's shared between client and server.

### Forms
- React Hook Form + Zod resolver.
- Single Zod schema per form, colocated in `lib/validation/`.

### Data fetching
- Server Components fetch directly from Supabase using the server client.
- Client Components fetch via TanStack Query when they need cache and mutation semantics.
- Never fetch from `/api/*` inside a Server Component. Call the underlying function directly.

### Auth
- Session via `@supabase/ssr`.
- `middleware.ts` refreshes sessions and protects `(app)/*` and `(auth)/*` routes.
- Use `requireAuth()`, `requireRole()`, `requireOnboarded()` from `lib/auth/guards.ts` at the top of protected Server Components.

### Analytics
- PostHog for product events. Event names use `snake_case`. Wrap all calls through `lib/analytics/track.ts`.

### Email
- Resend via `lib/email/client.ts`. Templates are React Email components in `lib/email/templates/`.

---

## Six-stage workflow rules

The stages, in order:

1. `ideation` → "Ideation"
2. `recording` → "Recording"
3. `mixing_mastering` → "Mixing & Mastering"
4. `promotion_design` → "Launch & Promote"  ← user-facing label, database value stays `promotion_design`
5. `distribution` → "Distribution"
6. `community` → "Community"

Always import `STAGES`, `STAGE_LABELS`, `STAGE_DESCRIPTIONS`, and `STAGE_PROS` from `lib/workflow/stages.ts`. Never inline the values.

Stage transitions must go through `lib/workflow/state-machine.ts::canTransition`. Never manually mutate `projects.current_stage` without calling the state machine first.

---

## Brand rules

### Colors (use tokens, not hex)

- `bg-canvas` for main background (`#10141e`)
- `bg-canvas-black` for hero placements (`#0a0a0f`)
- `bg-canvas-elevated` for cards (`#12121f`)
- `bg-gradient-cyan` for left-energy accents
- `bg-gradient-magenta` for right-energy accents
- `bg-gradient-musion` for hero moments (cyan → white → magenta, use sparingly)

### Typography

- Load via `next/font/google` in `app/layout.tsx`
- Display: Plus Jakarta Sans (600, 700)
- Body/UI: Inter (400, 500, 600)
- Accent: Poppins (500), sparingly
- Never load a fourth font. Never use serif on dark backgrounds.

### Logo

Component: `<Logo variant="full" | "mark" | "wordmark" size="sm" | "md" | "lg" | "hero" glow?={boolean} />`

Rules:
- Nav uses `variant="full" size="sm"`, no glow
- Hero uses `variant="full" size="hero" glow`
- Favicon and tight placements use `variant="mark"`
- Never scale the wordmark independently of the mark

### Motion

- Framer Motion only where it earns the payload
- Default transition: `{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }`
- Respect `useReducedMotion()` and skip non-essential animations when reduced

---

## Voice & copy (for any UI text you write)

Musion's voice:
- **Direct.** Say the thing.
- **Specific.** Name real situations artists face.
- **Warm but not soft.** Empathetic without being sentimental.
- **Confident.** Musion knows what it's building.
- **Conversational.** Reads like a smart friend explaining, not a brand broadcasting.

For any headline, button, or error message you write:
- If it needs explanation, rewrite it.
- No exclamation marks in headlines.
- One idea per section, one CTA per screen.
- Read it out loud. If it sounds like an ad, rewrite it.

If you're writing more than a sentence or two of user-facing copy, stop and let the human write it. Copy is a founder decision at Musion.

---

## Musion Verified (data model ready, integration stubbed)

Ship the data structure and badges. Do not ship any code claiming to sign, verify, or validate C2PA manifests in MVP.

`lib/verification/stub.ts` returns credential metadata without cryptographic proof. UI text says "Verified by Musion", never "C2PA-signed", until the real pipeline lands.

Two tiers:
- Witnessed (gold `#d4af37`) — end-to-end on-platform work with 2+ verified collaborators
- Documented (silver `#b0b0c0`) — off-platform evidence-reviewed work

---

## Credits.fm export (structure ready, push stubbed)

`lib/credits/export.ts` builds a payload matching Credits.fm's expected shape. Writes to `credits_export` table with `status = 'pending'`. Actual API push deferred to post-MVP.

Never write code that calls a Credits.fm endpoint in MVP.

---

## Security non-negotiables

1. RLS enabled on every table
2. Service role key never touches client code
3. Every user input validated server-side with Zod (client validation is UX, not security)
4. Never log PII or auth tokens
5. Rate-limit public endpoints (`/api/waitlist`, `/api/matching/*`) via middleware
6. Sanitize all user-provided markdown / rich text before rendering

---

## Accessibility non-negotiables

- Every interactive element reachable by keyboard
- Every icon-only button has `aria-label`
- Color contrast passes WCAG AA (dark theme is tricky, verify)
- Focus visible on every focusable element
- Form errors announced via `aria-live`

---

## When you're unsure

- Prefer the pattern already used elsewhere in this repo
- Consult `/MVP_ARCHITECTURE.md`
- Ask a clarifying question in the PR description rather than guess

## What Gaya expects from you

- Ready-to-paste code, not partial edits
- Step-by-step terminal commands with a one-line explanation of what each does
- Direct honest feedback if a request would create tech debt or ship broken UX
- One concrete next action per turn

---

*Last synced with `/MVP_ARCHITECTURE.md` v0.1*
