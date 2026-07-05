# Musion — Project Context for Claude Code

Read this file before writing or editing ANY frontend code. All UI work must follow this system. If a request conflicts with this file, flag it before proceeding.

## What Musion is
A platform for independent artists: they get matched to vetted studios/producers/engineers and move through 6 structured stages (Ideation → Recording → Mixing/Mastering → Launch → Distribution → Community), with verified credits and reputation. The visitor is a skeptical independent artist on a phone. Design goal: "this was built for me" in 5 seconds.

## Scope discipline
Build ONLY the feature explicitly requested in the current session. Do not add pages, sections, or features beyond it — even if I suggest scope creep mid-session, remind me of this rule first.

## Brand colors — USE TOKENS ONLY, never raw hex in components
Defined in the design tokens file (tokens.css / tailwind.config). Palette:
- `--bg`: #0a0a0f (deep black — primary canvas, ALL pages are dark)
- `--bg-elevated`: #12121f (cards, elevated surfaces)
- `--bg-section-alt`: #0d0d1a (alternating section depth)
- `--grad-cyan`: linear-gradient #00cfff → #4169e1 (action, CTAs, "artist" energy)
- `--grad-pink`: linear-gradient #c850c0 → #ff6eb4 (creativity, "studio" energy)
- `--text-body`: #e0e0f0 (never pure white for body)
- `--text-muted`: #6b6b8a (labels, metadata)
- White #ffffff: radial glow accents ONLY, used sparingly (max 2 glow elements per page)

## Typography
- One family: Outfit or Plus Jakarta Sans (Google Fonts). Never serif.
- Max 2 weights per screen. H1 large/bold → H2 medium → body regular → labels small/muted.

## Spacing
Generous. More padding than feels necessary. Sections breathe: min ~120px vertical padding desktop, ~64px mobile.

## Motion system (this is why the site must never feel static)
Every section animates, but animation serves emotion, not decoration. If motion is more noticeable than content, reduce it.
1. **Scroll entrance (default for everything):** opacity 0 + translateY(20px) → visible; 400–600ms; ease-out; stagger siblings 80–120ms. Use IntersectionObserver or framer-motion `whileInView`.
2. **Hero load sequence:** background fades in (0–500ms) → logo + glow pulse (500–900ms) → headline reveals word-by-word (300ms/word, 60ms stagger) → subline (1400ms) → CTA slides up (1700ms).
3. **Glow pulse:** logo + primary CTA only. Scale 0.95↔1.05, opacity 60↔100%, 3s loop, ease-in-out. Implement with CSS box-shadow/filter animation, NOT Lottie.
4. **Gradient shift:** section backgrounds slowly shift hue over 8–12s (background-position keyframes). Felt, not seen.
5. **Hover:** cards scale 1.02 + glowing border (cyan or pink); buttons brighten + scale 1.01; ≤200ms. Never scale ≥1.1.
6. **Stat counters:** count up on scroll into view, 1500ms ease-out.

## Hard rules — NEVER do these
- No white/light backgrounds anywhere
- No autoplay video heroes
- No parallax below 768px (disable on mobile)
- No carousels for key info; no on-load popup modals
- No more than 3 animation styles per page
- Nothing that delays content visibility past 2s
- No stock photos of people in studios — abstract brand visuals only
- No raw hex values in components — tokens only

## Mobile first
Design and verify at 390px width first, then scale up. Artists are on phones. Heavy animation must be reduced or disabled on mobile if it affects performance.

## Definition of done for any UI task
1. Uses only design tokens
2. Has entrance animation per the motion system
3. Verified at mobile width
4. I will paste a screenshot back for review before we move to the next section