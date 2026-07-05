# Musion MVP Architecture

**Version:** 0.1 (Pre-launch MVP)
**Owner:** Gaya Ben-Simon & David
**Last updated:** July 2026
**Stack:** Next.js 15 (App Router) + Supabase + Vercel

This document is the source of truth for the Musion MVP. GitHub Copilot should treat every convention here as canonical. When in doubt, follow this spec over any pattern learned elsewhere.

---

## 1. Positioning Guardrails (read this first, Copilot)

Musion is a **structured marketplace connecting independent artists with human music professionals** across a six-stage production workflow. Musion is NOT:

- An AI music generation tool
- A distribution platform (we route to licensed partners like Revelator or SonoSuite)
- A DAW or in-browser production tool
- A social network

**AI's role at Musion is orchestration, not creation.** The AI matches artists with the right human collaborators. Music is made by people.

### Language rules for all code, copy, UI text, and comments

**Never use:**
- "AI-powered distribution engine" or any variation
- "AI Launch" as a workflow step name
- "Upload once, grow everywhere"
- "AI grows your audience"
- "AI generates" anything music-related
- The phrase "not because X, but because Y" (permanently banned across all Musion assets)
- Startup filler: revolutionize, disrupt, empower, unlock, leverage, next-gen, game-changing

**Use instead:**
- "AI matches you with the right team"
- "Structured workflow, real people"
- "Launch & Promote" (the renamed fourth stage, formerly labeled "AI Launch" on legacy site)
- "Human-verified production"
- "The production layer music never had"

**Six-stage workflow, canonical names:**
1. Ideation
2. Recording
3. Mixing & Mastering
4. Promotion & Design (customer-facing label: "Launch & Promote")
5. Distribution
6. Community

Note: internal DB values use snake_case (`ideation`, `recording`, `mixing_mastering`, `promotion_design`, `distribution`, `community`). UI labels come from a single mapping constant in `lib/workflow/stages.ts`.

---

## 2. Tech Stack

### Runtime & framework
- **Node.js:** 20 LTS
- **Package manager:** pnpm 9
- **Framework:** Next.js 15 with App Router (React 19, Server Components by default, Client Components only when interactivity is needed)
- **TypeScript:** strict mode, no `any` unless explicitly justified in a comment
- **Hosting:** Vercel

### Backend
- **Supabase:** Postgres 15 + Auth + Storage + Realtime + Edge Functions (Deno)
- **pgvector** extension for embedding-based matching
- **Row Level Security (RLS)** enabled on every table (no exceptions)

### UI & design
- **Tailwind CSS 3.4** with custom design tokens (see Section 4)
- **shadcn/ui** for component primitives (Radix under the hood)
- **Framer Motion 11** for animations (used sparingly, mobile-performance first)
- **Lucide React** for iconography

### Data & forms
- **Zod** for schema validation (single source of truth for form + API validation)
- **React Hook Form** for form state
- **TanStack Query 5** for client-side data fetching and caching
- **Supabase JS SDK v2** for auth and DB access

### AI matching engine
- **OpenAI `text-embedding-3-small`** for content embeddings (cheap, fast, good enough for MVP)
- **pgvector cosine similarity** for retrieval
- Optional later: rerank with an LLM call (Claude Sonnet 4.6 via Anthropic API)

### Email
- **Resend** for transactional email (waitlist confirms, match notifications, project updates)

### Analytics
- **Vercel Analytics** for traffic
- **PostHog** for product analytics (funnel tracking, feature usage)

### What's NOT in MVP (defer)
- Stripe Connect / payments / escrow
- Direct Credits.fm API push (data structure ready, integration deferred)
- Full C2PA signing pipeline for Musion Verified (data model ready, cryptographic layer deferred)
- Real-time collaborative editing
- Mobile native app

---

## 3. Repository Structure

```
musion/
├── .github/
│   ├── copilot-instructions.md      # Copilot behavioral rules (see file)
│   └── workflows/
│       ├── ci.yml                   # lint, typecheck, test on PR
│       └── deploy-preview.yml       # Vercel preview per PR
│
├── app/                             # Next.js App Router
│   ├── (marketing)/                 # Public-facing marketing pages
│   │   ├── layout.tsx               # Marketing shell (nav, footer)
│   │   ├── page.tsx                 # Homepage
│   │   ├── for-artists/page.tsx
│   │   ├── for-pros/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── verified/page.tsx        # Musion Verified explainer
│   │   ├── manifesto/page.tsx       # The "why"
│   │   └── about/page.tsx
│   │
│   ├── (auth)/                      # Auth flow
│   │   ├── layout.tsx               # Minimal shell, no nav
│   │   ├── login/page.tsx
│   │   ├── signup/
│   │   │   ├── page.tsx             # Role selection (artist / pro)
│   │   │   ├── artist/page.tsx      # Artist onboarding wizard
│   │   │   └── pro/page.tsx         # Pro onboarding wizard
│   │   ├── verify/page.tsx          # Email verification landing
│   │   └── forgot-password/page.tsx
│   │
│   ├── (app)/                       # Authenticated app shell
│   │   ├── layout.tsx               # Auth guard + sidebar shell
│   │   ├── dashboard/page.tsx       # Role-aware home (artist vs pro)
│   │   ├── projects/
│   │   │   ├── page.tsx             # Project list
│   │   │   ├── new/page.tsx         # New project wizard
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx         # Project overview / timeline
│   │   │       ├── team/page.tsx    # Collaborators + matches
│   │   │       ├── ideation/page.tsx
│   │   │       ├── recording/page.tsx
│   │   │       ├── mixing/page.tsx  # Mixing & Mastering
│   │   │       ├── promotion/page.tsx  # Launch & Promote
│   │   │       ├── distribution/page.tsx
│   │   │       └── community/page.tsx
│   │   ├── discover/
│   │   │   ├── page.tsx             # Browse pros (filtering)
│   │   │   └── [proSlug]/page.tsx   # Public pro profile
│   │   ├── matches/page.tsx         # AI match feed
│   │   ├── messages/
│   │   │   ├── page.tsx             # Thread list
│   │   │   └── [threadId]/page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx             # My profile
│   │   │   └── edit/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── account/page.tsx
│   │       └── verification/page.tsx  # Musion Verified opt-in (stub)
│   │
│   ├── api/                         # Route handlers (server actions preferred where possible)
│   │   ├── waitlist/route.ts
│   │   ├── matching/
│   │   │   ├── generate/route.ts    # Trigger match generation
│   │   │   └── feedback/route.ts    # Accept/reject match
│   │   ├── projects/
│   │   │   ├── route.ts             # POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── stage/route.ts   # Advance stage
│   │   └── webhooks/
│   │       └── supabase/route.ts    # Auth events
│   │
│   ├── layout.tsx                   # Root layout (fonts, providers)
│   ├── globals.css                  # Tailwind entry + CSS vars
│   ├── not-found.tsx
│   └── error.tsx
│
├── components/
│   ├── ui/                          # shadcn primitives (button, dialog, form, etc.)
│   ├── brand/
│   │   ├── Logo.tsx                 # Full logo with wordmark
│   │   ├── LogoMark.tsx             # Just the X-wing mark
│   │   ├── Wordmark.tsx             # Text-only
│   │   └── CentralGlow.tsx          # Hero-only glow effect
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── SixStageWorkflow.tsx     # THE core diagram
│   │   ├── ProCategoryGrid.tsx      # Producers, engineers, studios, marketing
│   │   ├── WhyMusion.tsx
│   │   ├── Testimonial.tsx
│   │   └── WaitlistForm.tsx
│   ├── workflow/                    # Stage-specific components
│   │   ├── StageTimeline.tsx        # Visual six-dot progress
│   │   ├── StageCard.tsx
│   │   ├── IdeationPanel.tsx
│   │   ├── RecordingPanel.tsx
│   │   ├── MixingPanel.tsx
│   │   ├── PromotionPanel.tsx       # Launch & Promote
│   │   ├── DistributionPanel.tsx
│   │   └── CommunityPanel.tsx
│   ├── matching/
│   │   ├── MatchCard.tsx
│   │   ├── MatchFeed.tsx
│   │   └── MatchFeedbackControls.tsx
│   ├── project/
│   │   ├── ProjectHeader.tsx
│   │   ├── ProjectTeam.tsx
│   │   ├── CollaboratorAvatar.tsx
│   │   └── ProjectActions.tsx
│   ├── profile/
│   │   ├── ProProfileCard.tsx
│   │   ├── ArtistProfileCard.tsx
│   │   └── VerifiedBadge.tsx        # Renders per Musion Verified tier
│   └── shared/
│       ├── Nav.tsx
│       ├── Footer.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server client (RSC + route handlers)
│   │   ├── middleware.ts            # For middleware.ts session refresh
│   │   └── types.ts                 # Generated types from `supabase gen types`
│   ├── matching/
│   │   ├── engine.ts                # Main matching function
│   │   ├── embeddings.ts            # OpenAI embedding calls
│   │   ├── filters.ts               # Hard filters (genre, location, budget)
│   │   └── scoring.ts               # Combined scoring
│   ├── workflow/
│   │   ├── stages.ts                # Stage enum + labels + transitions
│   │   └── state-machine.ts         # Legal stage transitions
│   ├── verification/                # Musion Verified (stubbed for MVP)
│   │   ├── types.ts                 # WitnessedCredential, DocumentedCredential
│   │   └── stub.ts                  # Returns unverified for MVP
│   ├── credits/                     # Credits.fm export (stubbed for MVP)
│   │   ├── types.ts                 # ISRC/ISWC/IPI shapes
│   │   └── export.ts                # Formats project data for future push
│   ├── auth/
│   │   ├── guards.ts                # requireAuth, requireRole
│   │   └── session.ts
│   ├── validation/                  # Zod schemas
│   │   ├── artist.ts
│   │   ├── pro.ts
│   │   └── project.ts
│   ├── analytics/
│   │   └── track.ts                 # PostHog wrapper
│   ├── email/
│   │   ├── client.ts                # Resend wrapper
│   │   └── templates/               # React Email components
│   └── utils/
│       ├── cn.ts                    # clsx + tailwind-merge
│       └── format.ts
│
├── styles/
│   └── tokens.css                   # CSS custom properties (brand tokens)
│
├── supabase/
│   ├── schema.sql                   # Full initial schema (see file)
│   ├── migrations/                  # Timestamped migration files
│   └── seed.sql                     # Dev seed data
│
├── public/
│   ├── brand/
│   │   ├── logo-full.svg
│   │   ├── logo-mark.svg
│   │   ├── logo-white.png
│   │   └── og-default.png
│   └── favicon.ico
│
├── types/
│   ├── database.ts                  # Generated Supabase types
│   ├── domain.ts                    # App-level types (Project, Match, etc.)
│   └── index.ts
│
├── middleware.ts                    # Auth session refresh + route protection
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── .env.example
├── package.json
├── pnpm-lock.yaml
└── README.md
```

**Route group conventions:**
- `(marketing)` — public, SEO-optimized, static where possible
- `(auth)` — no nav, minimal shell
- `(app)` — authenticated, has sidebar, requires session

---

## 4. Brand System

### Color tokens (CSS custom properties)

Defined once in `styles/tokens.css`, referenced everywhere via Tailwind.

```css
:root {
  /* Canvas */
  --canvas-deep: #10141e;         /* primary background */
  --canvas-black: #0a0a0f;        /* deepest black (hero, marketing) */
  --surface-elevated: #12121f;    /* cards, panels */
  --surface-hover: #1a1a26;

  /* Cyan-blue (left wing) */
  --cyan-start: #00cfff;
  --cyan-end: #4169e1;
  --cyan-solid: #3ac5d8;

  /* Magenta-pink (right wing) */
  --magenta-start: #c850c0;
  --magenta-end: #ff6eb4;
  --magenta-solid: #c81ec8;

  /* Accent */
  --accent-lavender: #c391df;
  --central-glow: #ffffff;

  /* Text */
  --text-primary: #f5f5f0;
  --text-body: #e0e0f0;
  --text-muted: #6b6b8a;
  --text-dim: #45455a;

  /* Semantic */
  --success: #3ac5d8;             /* uses cyan */
  --warning: #f9a825;
  --error: #ef4444;
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.12);

  /* Musion Verified tiers */
  --verified-witnessed: #d4af37;  /* gold */
  --verified-documented: #b0b0c0; /* silver */
}
```

### Tailwind mapping

`tailwind.config.ts` extends theme colors to reference these tokens. Example:

```ts
extend: {
  colors: {
    canvas: {
      DEFAULT: 'var(--canvas-deep)',
      black: 'var(--canvas-black)',
      elevated: 'var(--surface-elevated)',
    },
    cyan: {
      start: 'var(--cyan-start)',
      end: 'var(--cyan-end)',
      solid: 'var(--cyan-solid)',
    },
    magenta: {
      start: 'var(--magenta-start)',
      end: 'var(--magenta-end)',
      solid: 'var(--magenta-solid)',
    },
    verified: {
      witnessed: 'var(--verified-witnessed)',
      documented: 'var(--verified-documented)',
    },
  },
  backgroundImage: {
    'gradient-cyan': 'linear-gradient(90deg, var(--cyan-start), var(--cyan-end))',
    'gradient-magenta': 'linear-gradient(90deg, var(--magenta-start), var(--magenta-end))',
    'gradient-musion': 'linear-gradient(90deg, var(--cyan-start), var(--central-glow), var(--magenta-end))',
  },
}
```

### Typography

Load via `next/font/google` in `app/layout.tsx`:

- **Wordmark (MUSION logotype only):** custom SVG (closest to Exo 2 Bold / Orbitron). Do not use as a system font.
- **Display / headlines:** `Plus Jakarta Sans` (weights 600, 700)
- **Body / UI:** `Inter` (weights 400, 500, 600)
- **Accents / captions:** `Poppins` (weight 500) — use sparingly, one screen shouldn't have all three

Never use serif on dark backgrounds. Never load a fourth font.

### Logo assets

Files in `/public/brand/`:
- `logo-full.svg` — X-wing mark + MUSION wordmark, full color
- `logo-mark.svg` — X-wing mark only (favicon, avatars, small placements)
- `logo-white.png` — monochrome fallback for constrained contexts
- `logo-full-glow.svg` — with central white glow (hero placements only)

Component contract:
```tsx
<Logo variant="full" | "mark" | "wordmark" size="sm" | "md" | "lg" | "hero" glow?={boolean} />
```

The `glow` prop should only render on hero placements, never in nav.

### Spacing & rhythm

- Base unit: 4px (Tailwind default)
- Section vertical padding: `py-20 md:py-28` on marketing, `py-8 md:py-12` on app
- Max content width: `max-w-6xl` for marketing, `max-w-7xl` for app dashboards
- Card radius: `rounded-2xl` for feature cards, `rounded-xl` for interactive cards, `rounded-full` for pills

### Motion

- **Framer Motion** only where it earns its place
- Default transition: `{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }`
- Reduce-motion respected: check `useReducedMotion()` and skip non-essential animations
- No parallax on mobile (kills scroll performance)

---

## 5. Data Model (Supabase)

Full schema in `supabase/schema.sql`. High-level shape here.

### Core tables

```
users (Supabase auth.users, extended via public.profiles)
├── profiles
│   ├── id (uuid, FK auth.users)
│   ├── role ('artist' | 'pro' | 'both')
│   ├── display_name, avatar_url, bio, location, timezone
│   ├── onboarding_complete (bool)
│   └── created_at
│
├── artist_profiles
│   ├── profile_id (FK)
│   ├── primary_genres (text[])
│   ├── secondary_genres (text[])
│   ├── influences (text)
│   ├── project_goals (text)
│   ├── budget_range (enum: 'under_500', '500_2k', '2k_10k', '10k_plus')
│   ├── stage (enum: 'first_release', 'building_catalog', 'established')
│   └── embedding (vector(1536))    -- for matching
│
├── pro_profiles
│   ├── profile_id (FK)
│   ├── pro_type (enum: 'producer', 'engineer_mix', 'engineer_master',
│   │             'studio', 'session_musician', 'vocal_coach',
│   │             'marketing', 'pr', 'designer', 'distribution')
│   ├── specialties (text[])
│   ├── genres (text[])
│   ├── notable_credits (jsonb)     -- structured credit list
│   ├── rate_range (enum)
│   ├── availability_status (enum: 'open', 'limited', 'closed')
│   ├── portfolio_urls (text[])
│   ├── verified_status (enum: 'unverified', 'witnessed', 'documented')
│   └── embedding (vector(1536))
│
├── waitlist_entries
│   ├── email, role_interest, referrer, submitted_at
│   └── metadata (jsonb)
│
├── projects
│   ├── id (uuid), artist_profile_id (FK)
│   ├── title, working_title, description
│   ├── current_stage (enum, see workflow)
│   ├── stage_started_at, target_completion_date
│   ├── status (enum: 'active', 'paused', 'completed', 'archived')
│   ├── visibility (enum: 'private', 'team_only', 'public')
│   └── created_at, updated_at
│
├── project_stages       -- per-stage state and artifacts
│   ├── project_id (FK)
│   ├── stage (enum)
│   ├── status (enum: 'not_started', 'in_progress', 'completed', 'skipped')
│   ├── started_at, completed_at
│   └── artifacts (jsonb) -- stage-specific data
│
├── project_collaborators
│   ├── project_id, pro_profile_id, stage
│   ├── role (text)
│   ├── invited_at, accepted_at, completed_at
│   ├── status (enum: 'invited', 'accepted', 'declined', 'completed', 'removed')
│   └── contribution_notes (text) -- for future Credits.fm export
│
├── matches
│   ├── id, project_id, stage, pro_profile_id
│   ├── score (float)
│   ├── reasoning (jsonb) -- explainability data
│   ├── shown_at, decision (enum: 'pending', 'accepted', 'rejected', 'saved')
│   ├── decided_at
│   └── feedback (text)
│
├── messages
│   ├── thread_id, sender_profile_id, project_id (nullable)
│   ├── body, attachments (jsonb)
│   └── created_at, read_at
│
├── verified_credentials  -- Musion Verified data model (stubbed integration)
│   ├── id, project_id, tier (enum: 'witnessed', 'documented')
│   ├── issued_at, issuer_signature (text, nullable for MVP)
│   ├── contributors (jsonb)  -- who's on the credential
│   ├── c2pa_manifest_url (text, nullable)  -- populated when integration lands
│   └── status (enum: 'draft', 'issued', 'revoked')
│
└── credits_export       -- Credits.fm export queue (stubbed integration)
    ├── id, project_id, isrc, iswc
    ├── payload (jsonb)  -- formatted for Credits.fm API shape
    ├── status (enum: 'pending', 'exported', 'failed')
    └── exported_at
```

### RLS policy summary

- Every table has RLS enabled
- Profiles are readable if `visibility = 'public'` or user is the owner
- Projects readable by owner and accepted collaborators only
- Matches readable only by the project's artist
- Messages readable only by thread participants
- Waitlist entries insertable by anyone (public form), readable by service role only

Detailed policies in `supabase/schema.sql`.

---

## 6. Authentication & Onboarding

### Flow

1. `/signup` — role selection screen. Two big buttons: "I make music" (artist) and "I work with artists" (pro). No third "both" option at this stage; pros can add artist mode later from settings.

2. `/signup/artist` — 4-step wizard:
   - Step 1: Email + password (or magic link)
   - Step 2: Display name, primary genres (multi-select), location
   - Step 3: What you're working on (project goals free text), budget range
   - Step 4: Confirm + verify email

3. `/signup/pro` — 5-step wizard:
   - Step 1: Email + password
   - Step 2: Display name, pro type (single-select), location
   - Step 3: Specialties, genres you work in, rate range
   - Step 4: Notable credits (structured entry: track title, artist, role, year), portfolio links
   - Step 5: Verification interest (opt in to Musion Verified queue, or skip) + confirm

4. Post-verification: land on `/dashboard`, role-aware.

### Auth implementation

- Supabase Auth with email/password + magic link fallback
- Server-side session via `@supabase/ssr` package
- `middleware.ts` refreshes sessions on every request and protects `(app)` routes
- Role check via `profiles.role` column, cached in JWT app_metadata

### Guards

```ts
// lib/auth/guards.ts
export async function requireAuth(): Promise<Session>
export async function requireRole(role: 'artist' | 'pro'): Promise<Profile>
export async function requireOnboarded(): Promise<Profile>
```

Use these at the top of Server Components in `(app)` routes.

---

## 7. Six-Stage Workflow

The workflow is a **state machine per project**, with well-defined transitions.

### Stage definitions (`lib/workflow/stages.ts`)

```ts
export const STAGES = ['ideation', 'recording', 'mixing_mastering',
                       'promotion_design', 'distribution', 'community'] as const;

export type Stage = typeof STAGES[number];

export const STAGE_LABELS: Record<Stage, string> = {
  ideation: 'Ideation',
  recording: 'Recording',
  mixing_mastering: 'Mixing & Mastering',
  promotion_design: 'Launch & Promote',   // customer label
  distribution: 'Distribution',
  community: 'Community',
};

export const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  ideation: 'Shape the concept with producers and co-writers.',
  recording: 'Track your project with the right studio and engineer.',
  mixing_mastering: 'Mix and master with verified engineers.',
  promotion_design: 'Plan the release with PR, marketing, and design pros.',
  distribution: 'Route your finished work through licensed distribution.',
  community: 'Build the fanbase around what you released.',
};

export const STAGE_PROS: Record<Stage, ProType[]> = {
  ideation: ['producer', 'session_musician'],
  recording: ['studio', 'producer', 'engineer_mix', 'session_musician'],
  mixing_mastering: ['engineer_mix', 'engineer_master'],
  promotion_design: ['marketing', 'pr', 'designer'],
  distribution: ['distribution'],
  community: ['marketing'],
};
```

### Transitions

Stages can be:
- **Advanced** to the next stage (normal flow)
- **Skipped** (marked complete without collaborators, e.g. an artist who self-produces)
- **Revisited** (returning to a stage that was marked complete)

Not allowed: skipping ahead without marking intermediate stages complete or skipped.

Implement as a pure function in `lib/workflow/state-machine.ts`:

```ts
export function canTransition(
  from: Stage | null,
  to: Stage,
  currentStages: ProjectStage[]
): { ok: boolean; reason?: string }
```

### Project pages

Each stage gets its own page under `app/(app)/projects/[projectId]/[stage]/page.tsx`. The page shell is shared (`ProjectHeader`, `StageTimeline`), the panel is stage-specific.

Every stage page shows:
- Stage description + guidance
- Matched pros (from the matching engine, filtered by `STAGE_PROS[stage]`)
- Active collaborators for this stage
- Stage-specific artifact upload/notes (audio references for Ideation, session files for Recording, stems for Mixing, etc.)
- "Mark stage complete" action

---

## 8. AI Matching Engine

### Architecture

Hybrid recommender: hard filters → content-based similarity → optional rerank.

```
Input: { project_id, stage, artist_profile, project_context }

Step 1: Hard filter (SQL)
  - pro_profiles WHERE pro_type IN STAGE_PROS[stage]
  - AND availability_status != 'closed'
  - AND (location match OR remote_ok)
  - AND rate_range overlaps artist budget_range
  - AND genres && artist genres  (any overlap)

Step 2: Vector similarity (pgvector)
  - Build project embedding from: artist profile + project description + stage context
  - Cosine similarity against pro_profiles.embedding
  - Take top 50

Step 3: Score fusion
  - final_score = 0.6 * vector_similarity
               + 0.2 * genre_overlap_score
               + 0.1 * verified_bonus (0.05 witnessed, 0.10 documented)
               + 0.1 * recency_bonus (recently active pros)

Step 4: Take top 10, persist to `matches` table with reasoning

Output: Match[] with score + reasoning shown to user
```

### Embedding strategy

- Pro embedding built from: `pro_type + specialties + genres + notable_credits + bio`
- Project embedding built at match time from: `artist genres + project.description + stage + STAGE_DESCRIPTIONS[stage]`
- Regenerate pro embeddings on profile update via Supabase edge function trigger
- Model: `text-embedding-3-small` (1536 dims, cheap)

### Explainability

Every match stores `reasoning` jsonb like:

```json
{
  "matched_genres": ["indie folk", "americana"],
  "location_match": "same_city",
  "recent_credits_relevance": 0.82,
  "why_shown": "3 shared genres and recent work in a similar sonic space"
}
```

The UI surfaces a plain-language "Why this match?" line built from this jsonb.

### Feedback loop

Every match has an `accept | reject | save` action. Feedback logged to `matches.decision`. For MVP this data isn't yet used to retrain — it's collected so that once volume exists, a collaborative filtering layer can be added.

### Files

- `lib/matching/engine.ts` — main `generateMatches(projectId, stage)` function
- `lib/matching/filters.ts` — SQL hard filters
- `lib/matching/embeddings.ts` — OpenAI wrapper + embedding builders
- `lib/matching/scoring.ts` — score fusion logic
- `app/api/matching/generate/route.ts` — POST endpoint (server-side, uses service role)
- `app/api/matching/feedback/route.ts` — POST endpoint for user decisions

---

## 9. Discovery & Public Pro Profiles

Even without a full search launch in MVP, we need pro profile pages for two reasons: SEO and direct-share links from outreach.

### `/discover`

Server-rendered browse page. Filters:
- Pro type (chips, multi-select)
- Location (city dropdown)
- Genres (chips)
- Rate range
- Verified status

Grid of `ProProfileCard` components. Server-side pagination (20 per page).

### `/discover/[proSlug]`

Public pro profile page. Server Component, statically regenerated on profile update.

Includes:
- Header: avatar, display name, pro type, location, verified badge (if any)
- Bio + specialties
- Notable credits (structured list)
- Portfolio embeds (SoundCloud, YouTube, Spotify iframes where possible)
- CTA: "Invite to a project" (auth-gated action)

Slug generation: `slugify(display_name) + '-' + short_uuid` on profile create.

---

## 10. Musion Verified (Data Model Ready, Integration Stubbed)

The strategic report identified Musion Verified as B2B-ready. In MVP we ship the **data structure and UI badges**, not the cryptographic pipeline.

### Two tiers

- **Witnessed (gold)** — auto-issued when a project completes end-to-end on Musion with 2+ verified collaborators
- **Documented (silver)** — issued after off-platform work with evidence review (manual queue in MVP)

### MVP surface

- `settings/verification` page: opt in to receive Verified credentials
- `VerifiedBadge` component renders on `ProProfileCard`, `MatchCard`, project outputs
- Data flows into `verified_credentials` table
- `c2pa_manifest_url` column left nullable; integration lands post-MVP

### Copilot instruction

Never write code that claims to sign or verify C2PA manifests in MVP. The stub in `lib/verification/stub.ts` returns credential metadata without any cryptographic proof. All UI text around Verified in MVP should say "Verified by Musion" not "C2PA-signed" until the pipeline is real.

---

## 11. Credits.fm Integration (Data Model Ready, Push Stubbed)

Per the strategic report: when a project completes, credits should be structured for Credits.fm export.

### MVP surface

- Every `project_collaborators` row already captures role and stage
- On project completion, `lib/credits/export.ts` builds a payload matching Credits.fm's expected shape (ISRC, ISWC, contributor list with IPI where known)
- Payload gets written to `credits_export` table with `status = 'pending'`
- Actual API push deferred; when Credits.fm integration is signed, a scheduled job drains the queue

### Files

- `lib/credits/types.ts` — TypeScript shapes matching Credits.fm public API contract
- `lib/credits/export.ts` — payload builder
- `app/api/projects/[id]/credits/route.ts` — GET returns the payload preview so the artist can see the credit list before it exports

---

## 12. Marketing Site Architecture

Public pages under `(marketing)`. All Server Components. SEO metadata via `generateMetadata`.

### `/` (Homepage)

Sections top to bottom:
1. **Hero** — Headline, subhead, dual CTA ("Join as artist" / "Join as pro"), waitlist count social proof
2. **Six-stage workflow** — the core diagram, animated on scroll
3. **Why Musion** — the marketplace positioning (contrast against distribution tools and generative AI)
4. **Pro categories** — grid of pro types with icons
5. **Musion Verified strip** — one-line explainer, link to `/verified`
6. **Manifesto teaser** — pull quote linking to `/manifesto`
7. **Final waitlist CTA**

### `/for-artists`

Artist-focused landing. Emphasizes the six pain points from the copywriter skill.

### `/for-pros`

Pro-focused landing. Emphasizes: curated demand, no cold outreach, structured briefs, Musion Verified credentials.

### `/how-it-works`

Detailed walkthrough of the six stages with concrete examples of what happens at each.

### `/verified`

Musion Verified explainer. Two-tier structure, why it matters (referencing the industry shift toward AI music restrictions without being preachy about it), what it means for distribution.

### `/manifesto`

The "why we're building this" long-form page. Founder voice, Gaya and David. This is the page that gets shared.

### `/about`

Team + contact + press.

### SEO

- Every page has `title`, `description`, `openGraph`, `twitter` metadata
- Sitemap generated automatically via `app/sitemap.ts`
- robots.txt allows all public routes, blocks `(app)/*` and `(auth)/*`

---

## 13. Environment Variables

`.env.example`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (matching engine)
OPENAI_API_KEY=

# Anthropic (optional rerank + future features)
ANTHROPIC_API_KEY=

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@musion.one

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Copilot: never hardcode API keys or URLs. Always read from `process.env` and never expose service role keys to the client.

---

## 14. Build Phases for Copilot

Execute these phases in order. Each phase should ship as its own PR.

### Phase 0: Scaffolding
- Init Next.js 15 project with pnpm, TypeScript strict
- Install core deps (Tailwind, shadcn/ui, Supabase, Zod, RHF, TanStack Query, Framer Motion)
- Configure `tailwind.config.ts` with brand tokens
- Set up `styles/tokens.css`, `app/globals.css`, `app/layout.tsx` with fonts
- Add `.env.example`, README
- Wire CI (lint + typecheck)

### Phase 1: Supabase foundation
- Run `supabase/schema.sql`
- Generate types with `supabase gen types typescript`
- Set up `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- Configure `middleware.ts` for session refresh + route protection

### Phase 2: Marketing site
- Build `(marketing)` layout with Nav + Footer
- Ship `/`, `/for-artists`, `/for-pros`, `/how-it-works`, `/verified`, `/manifesto`, `/about`
- Waitlist form connected to `waitlist_entries` table
- Sitemap + robots

### Phase 3: Auth & onboarding
- `/login`, `/signup` role selection
- Artist onboarding wizard (4 steps)
- Pro onboarding wizard (5 steps)
- Email verification flow
- Dashboard shell with role-aware landing

### Phase 4: Projects & six-stage workflow
- Project CRUD
- StageTimeline component
- Stage pages (six total) with panels
- State machine + transition guards
- Project team + collaborator invites

### Phase 5: Discovery & profiles
- `/discover` browse page with filters
- Public pro profile pages at `/discover/[proSlug]`
- SEO metadata on profile pages

### Phase 6: AI matching engine
- Embedding generation on profile save (edge function)
- `lib/matching/engine.ts` full pipeline
- `/matches` feed
- Feedback capture
- Match reasoning display

### Phase 7: Messaging
- Thread list + thread detail pages
- Realtime updates via Supabase Realtime
- Notification emails via Resend

### Phase 8: Musion Verified UI + Credits export queue
- Verification opt-in in settings
- `VerifiedBadge` component wired to `verified_credentials`
- Credits payload preview page

### Phase 9: Polish
- Analytics events
- Empty states, loading states, error boundaries
- Mobile QA pass
- Accessibility audit (axe DevTools)

Each phase should have its own test coverage: unit tests for `lib/`, integration tests for API routes, one Playwright smoke test per critical flow (signup, create project, generate matches).

---

## 15. Non-Negotiables

- **RLS on every table.** No exceptions. Test with the Supabase local CLI before merging.
- **Never expose service role key to the client.** All service-role Supabase calls happen in Server Components, route handlers, or edge functions.
- **Every form validated with Zod both client and server side.** The same schema.
- **No `any` in TypeScript.** If you must, add a comment explaining why.
- **Mobile-first CSS.** Test every screen at 375px before shipping.
- **Accessibility.** Every interactive element keyboard-reachable, every icon-only button has an aria-label, color contrast passes WCAG AA.
- **Never introduce the banned language** from Section 1. Copilot: if you're tempted to write "AI-powered" anything, stop and reread Section 1.

---

*End of MVP Architecture v0.1*
