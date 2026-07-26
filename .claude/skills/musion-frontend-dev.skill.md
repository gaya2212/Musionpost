---
name: musion-frontend-dev
description: >
  Implement Musion's brand and animation system in real code (React, Next.js,
  HTML/CSS, Tailwind, framer-motion). Use this skill whenever Gaya is building
  or reviewing musion.one frontend code, asks why the site looks static or
  off-brand, wants animation code, hero sections, scroll effects, component
  styling, or prepares prompts/specs for Claude Code sessions. Triggers:
  "build this section", "the site looks static", "write the animation code",
  "review this component", "prep a Claude Code prompt", or any musion.one
  implementation question. Companion to musion-web-design (design decisions)
  — this skill owns the CODE.
---
 
# Musion Frontend Dev Skill
 
Companion to `musion-web-design`. That skill decides WHAT the design is.
This skill defines HOW it's implemented in code. Gaya builds with Claude Code
+ GitHub — never give Webflow/Wix/Framer-app instructions.
## Stack assumptions
- React/Next.js (or plain HTML/CSS if repo dictates), Tailwind allowed
- Animations: **framer-motion** for React, CSS keyframes for everything simple
- Fonts: Outfit or Plus Jakarta Sans via Google Fonts / next/font
- Mobile-first: verify at 390px before desktop
## Design tokens (single source of truth — mirror of repo CLAUDE.md)
Always use tokens, never raw hex in components:
 
```css
:root {
  --bg: #0a0a0f;
  --bg-elevated: #12121f;
  --bg-alt: #0d0d1a;
  --text-body: #e0e0f0;
  --text-muted: #6b6b8a;
  --cyan-a: #00cfff; --cyan-b: #4169e1;
  --pink-a: #c850c0; --pink-b: #ff6eb4;
  --grad-cyan: linear-gradient(135deg, var(--cyan-a), var(--cyan-b));
  --grad-pink: linear-gradient(135deg, var(--pink-a), var(--pink-b));
}
```
 
## The anti-static toolkit
"Static" almost always means: no entrance motion, no hover states, flat
backgrounds. Every section gets all three. Reference implementations:
 
### 1. Scroll entrance (default for every section/card)
```jsx
import { motion } from "framer-motion";
 
export const FadeUp = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.5, ease: "easeOut", delay }}
  >
    {children}
  </motion.div>
);
// Stagger siblings: delay={i * 0.1}
```
No-framer version: IntersectionObserver adds `.visible`; CSS transitions
opacity 0→1 and translateY 20px→0 over 500ms ease-out.
 
### 2. Hero load sequence (homepage only)
Order with framer-motion `delay`: background 0s → logo+glow 0.5s →
headline words 0.9s (60ms stagger per word via `staggerChildren: 0.06`) →
subline 1.4s → CTA 1.7s. Word-by-word headline:
```jsx
const words = headline.split(" ");
<motion.h1 initial="hidden" animate="show"
  variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.9 } } }}>
  {words.map((w, i) => (
    <motion.span key={i} style={{ display: "inline-block", marginRight: "0.3em" }}
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0,
        transition: { duration: 0.3, ease: "easeOut" } } }}>{w}</motion.span>
  ))}
</motion.h1>
```
 
### 3. Glow pulse (logo + primary CTA only, max 2 per page)
```css
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 24px 4px rgba(0,207,255,.35); transform: scale(.98); }
  50%      { box-shadow: 0 0 44px 10px rgba(0,207,255,.6);  transform: scale(1.02); }
}
.glow-cta { animation: glowPulse 3s ease-in-out infinite; }
```
Never Lottie for glows — CSS is lighter and on-brand.
 
### 4. Living backgrounds (kills flatness)
```css
.gradient-shift {
  background: linear-gradient(120deg, rgba(0,207,255,.08), rgba(200,80,192,.08), rgba(0,207,255,.08));
  background-size: 300% 300%;
  animation: shift 10s ease-in-out infinite;
}
@keyframes shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
```
Hero particles: one absolutely-positioned canvas or 12–18 blurred divs
drifting slowly (translate + opacity keyframes, 12–20s loops, will-change:
transform). Disable below 768px if FPS suffers.
 
### 5. Hover states (every card, button, link)
```css
.card { transition: transform .2s ease, box-shadow .2s ease; }
.card:hover { transform: scale(1.02); box-shadow: 0 0 0 1px var(--cyan-a), 0 0 24px rgba(0,207,255,.25); }
```
Buttons: brighten + scale(1.01). Links: underline slides in from left
(background-size trick). Never scale ≥ 1.1.
 
### 6. Stat counters
IntersectionObserver + requestAnimationFrame count-up, 1500ms ease-out.
Never render numbers that aren't real.
 
## Premium effects (landing page / musion.one — NOT the dashboard app)
Techniques adapted from top-tier SaaS heroes, re-skinned to Musion tokens.
Use on the public marketing site; the dashboard stays calmer.
 
### Liquid glass navbar (sticky floating pill)
```css
.glass-nav {
  position: sticky; top: 24px; z-index: 100;
  max-width: 1200px; margin: 24px auto 0;
  height: 72px; padding: 0 24px; border-radius: 100px;
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 4px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05);
}
```
Same glass recipe for mobile drawer and secondary buttons
(`background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1)`).
 
### Gradient text on the key headline word
Use the existing `.text-grad-cyan` utility (globals.css), or for the full
brand spectrum: `linear-gradient(135deg, #00cfff, #c850c0, #ff6eb4)` +
background-clip: text. ONE word or phrase per headline, never whole lines.
 
### Cursor-reactive 3D background (hero only)
Option A (fastest, vanilla page): TubesCursor from
`https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js`
on a fixed full-screen canvas, z-index -1, pointer-events none.
**Musion colors, not defaults:** tubes/lights `#00cfff, #4169e1, #c850c0, #ff6eb4`,
white highlight, no color randomization on click.
Option B (React/Next): load the script via next/script or dynamic import
inside a client component; guard with `typeof window !== "undefined"`.
Rules either way: hero section only; disable below 768px (render the
CSS `.gradient-shift` background instead — mobile GPUs + battery); respect
prefers-reduced-motion by not initializing.
 
### Badge pill (announcements)
`rgba(255,255,255,0.03)` bg + `rgba(255,255,255,0.1)` border, small
cyan-gradient tag ("New") + one line of text + arrow. Good pre-launch use:
"Pilot opening in LA · NYC · Nashville · Atlanta →".
 
### What NOT to copy from template specs
- Their palette/fonts (Musion = Outfit/Plus Jakarta + our tokens, always)
- Fake social proof ("10,000+ teams", "1,200+ reviews") — real numbers only
- Cursor effects on app/dashboard pages — marketing site only
## Performance & mobile rules
- `viewport={{ once: true }}` on all scroll animations (no re-triggering)
- `prefers-reduced-motion`: wrap loops in a media query check
- No parallax below 768px; reduce particle count on mobile
- Animate only transform/opacity (compositor-friendly); never top/left/width
## Claude Code session protocol (Gaya's known failure modes, enforced)
1. **One section per session.** State it up front; refuse scope creep even
   from Gaya mid-session — remind first.
2. **Definition of done:** tokens only, entrance animation present, hover
   states present, verified at 390px.
3. **Feedback loop is mandatory:** session isn't finished until Gaya pastes
   a screenshot back and gets 1–2 refinement rounds. "Looks static" is not
   actionable — always convert to one adjective + one location
   ("hero glow too strong", "cards enter too slowly").
4. Ensure repo has `CLAUDE.md` + tokens file; if missing, create them first.
## Results log (append real outcomes here)
- [date] — [section built] — [what worked / what still felt off]