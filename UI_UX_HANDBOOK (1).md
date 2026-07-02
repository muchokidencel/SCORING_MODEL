# The UI/UX Handbook

> A generic, reusable reference for building good-looking, usable applications — web and mobile.
> Two halves: **Part I — the visual system** (how to make UI *look* premium) and
> **Part II — the design discipline** (the process, laws, and checklists that make UI *work*,
> structured to map onto a QA mindset: TDD/BDD, unit/integration/e2e, STLC).
>
> Core thesis: great UI is **not** a "good hand" or luck. It is a **system** — tuned design tokens +
> a curated component layer + a small number of rules applied consistently — verified by a
> **discipline** with a lifecycle, levels of checking, and objective checklists. Copy the system and
> follow the discipline, get the result.

---

# PART I — THE VISUAL SYSTEM

## 1. The one idea that matters most

**~90% of the "premium" feel comes from your design tokens, not your components.** Modern component
libraries (e.g. shadcn/ui) are ~95% the same everywhere. What makes an app look custom and expensive
is the *theme tokens* the components read from (colors, radius, shadows, typography, spacing) and the
*discipline* of always composing with those tokens instead of hard-coded values.

If you do nothing else: tune the **token block in §6** and reuse everything above it.

## 2. A reference stack (and what each piece is *for*)

This is one proven, modern combination. Swap equivalents freely — the *roles* are what matter.

| Tool / concept | Role in the look |
|---|---|
| **Tailwind CSS (v4)** | Utility engine; v4 is CSS-first — theme lives in `@theme` in your CSS, no JS config. |
| **A copy-paste component library** (e.g. shadcn/ui, "new-york" style) | Components you *own* and can theme freely — not a locked npm dependency. |
| **Headless accessible primitives** (e.g. Radix UI) | Where keyboard nav, focus traps, and ARIA come from for free. |
| **OKLCH color** | Author colors in `oklch()`, not hex/hsl — perceptually uniform (§3.1). The single biggest "designer" tell. |
| **A token generator** (e.g. tweakcn.com) | Generates the colored-shadow + radius + tracking token block visually. The "secret weapon." |
| **CSS animation utilities** (e.g. tw-animate-css) | `animate-in`, `fade-in`, `zoom-in`, `slide-in-*`. Reach for CSS first. |
| **A JS motion lib** (e.g. framer-motion) | Reserve for the 1–2 genuinely complex motions only. |
| **One icon set** (e.g. lucide) | Consistency of icon family is itself a polish signal. |
| **Variant helper** (e.g. cva) | Define component variants as data, not ad-hoc classes. |
| **clsx + tailwind-merge** (`cn()`) | Merge classes and resolve conflicts so overrides win cleanly. |
| **Theme switcher** (e.g. next-themes) | Dark mode via a `.dark` class + `prefers-color-scheme`. |

**Differentiators:** utility CSS + an ownable component layer + **OKLCH tokens (ideally generated)**.
Everything else is supporting cast.

## 3. The token decisions that create the "premium" feel

Each maps to a **named, researched principle** — it's not vibes.

### 3.1 Color in OKLCH, not hex — *perceptual uniformity*
```css
--primary: oklch(0.4865 0.2423 291.8661);
```
OKLCH = **L**ightness, **C**hroma, **H**ue. Equal lightness numbers *look* equally bright across
hues, so generated tints/shades and dark-mode variants stay balanced instead of muddy.
**Apply it:** author colors in OKLCH; use a tool (oklch.com, tweakcn) instead of guessing hex.

### 3.2 Brand-tinted (colored) shadows — the single biggest upgrade
```css
--shadow-color: 263 70% 50%;   /* your brand hue, NOT black */
--shadow-sm: 0px 8px 30px 0px hsl(var(--shadow-color) / 0.08), 0px 1px 2px -1px hsl(var(--shadow-color) / 0.08);
```
Default shadows are black at high opacity → "cheap drop shadow." Tint the shadow with your **primary
hue at very low opacity (0.04–0.08) and a large blur (~30px)**. Cards then look softly lit by the
brand color and float. This is the trick that makes plain grey cards look expensive.
**Principle:** long, soft, low-opacity, color-matched shadows (*Refactoring UI*).

### 3.3 Generous, layered radius — *softness*
```css
--radius: 1rem;   /* derive sm/md/lg/xl from this one var */
```
A larger base radius reads modern/friendly; deriving the scale from one `--radius` with `calc()`
keeps every corner in proportion. One knob rounds the whole app.
**Apply it:** one `--radius`, derive the rest. Never hard-code `rounded-[7px]`.

### 3.4 Tight letter-spacing + a real typeface — *typographic polish*
```css
--tracking-normal: -0.015em;   /* slightly negative tracking */
--font-sans: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
body { letter-spacing: var(--tracking-normal); }
```
Slightly **negative letter-spacing** on headings reads as crafted, not browser-default. Pair a
geometric humanist sans over system-ui.
**Principle:** optical tracking — tighten large text, loosen tiny uppercase labels.
⚠️ **Common bug:** declaring a display font in CSS but never *loading* it (e.g. via `next/font`),
so it silently falls back. If you name it, load it.

### 3.5 Semantic color *roles* (why nothing clashes)
Keep the palette tiny and **named by role, not by color**:
`background / foreground / card / popover / primary / secondary / muted / accent / destructive /
border / input / ring`, each with a `-foreground` pair guaranteeing readable contrast (plus
`sidebar-*`, `chart-1..5`). You never ask "what blue?" — only "is this `muted` text or `foreground`?"
**Principles:** semantic design tokens + the **60/30/10 rule** (mostly neutral, some secondary, a
little primary as the accent). Use primary *sparingly* — one CTA per view.

### 3.6 Transparency via `color-mix`, not new colors
```css
background: color-mix(in oklch, var(--primary) 15%, transparent);
```
Build hover/active/selected states by mixing an existing token with transparent, so states stay
on-palette. Never invent "a slightly lighter purple."

## 4. Composition rules (the repeatable "taste")

1. **One page-header pattern everywhere:** `text-2xl font-bold tracking-tight`. Crisp and consistent.
2. **Spacing on a grid.** Base unit 4px; gaps `2/4/6`, card padding `6`. → the **8-point grid**.
3. **Cards as the default container:** `rounded-xl border py-6 shadow-sm`, content `px-6`, inner `flex flex-col gap-6`.
4. **Subtle gradients only:** low-opacity washes (`from-primary/10 to-transparent`) or thin accent bars. Seasoning, not the meal.
5. **Animation is CSS-first, fast (100–200ms), subtle.** JS motion only for the genuinely complex.
6. **Design empty / loading / error states as first-class** (dedicated empty-state component, skeletons, spinners). Biggest perceived-quality lever most teams skip.
7. **Variants over one-off classes.** New visual states go in the variant table, not inline. Stops entropy as the app grows.
8. **Accessibility is built in, so it also *looks* right:** consistent `focus-visible` rings, `aria-invalid` styling.
9. **Dark mode is complete and non-negotiable:** every token has a `.dark` value (often *stronger* shadows). Because components use roles, dark mode "just works."

## 5. The golden rule (keeps everything consistent)

Think in **three layers and never mix them:**

```
LAYER 3 — Composition (pages/features)   ← your "taste" lives here
LAYER 2 — Components (ui/, the library)   ← rarely touched
LAYER 1 — Tokens (CSS @theme + :root)     ← tune ONCE per app
```

**Components only ever reference Layer-1 tokens** (`bg-primary`, `text-muted-foreground`,
`rounded-lg`, `shadow-sm`) — almost never a raw hex or pixel value. So re-theming = editing one file,
and nothing ever drifts off-brand. For a new app you **re-tune Layer 1 and reuse Layers 2 & 3.**

## 6. Copy-paste starter — drop into any new app

1. Init your component library (e.g. `npx shadcn@latest init` → new-york style, slate base, CSS variables = yes).
2. Replace the generated `:root` / `.dark` / `@theme` with the block below (re-brand by changing the
   **one primary hue number**, or regenerate the whole block on tweakcn.com).
3. Load your display font properly and point `--font-sans` at it (don't repeat the §3.4 bug).
4. Add components as needed (`button card badge dialog empty skeleton …`).
5. Build pages with the §4 rules. Never hard-code a color/radius/shadow again.

```css
/* globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

:root {
  --radius: 1rem;                                    /* §3.3 one knob for roundness */
  --background: oklch(0.9838 0.0035 247.8583);
  --foreground: oklch(0.1284 0.0267 261.5937);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1284 0.0267 261.5937);
  --primary: oklch(0.4865 0.2423 291.8661);          /* ← change THIS hue to re-brand */
  --primary-foreground: oklch(0.9838 0.0035 247.8583);
  --secondary: oklch(0.9486 0.0085 303.5068);
  --secondary-foreground: oklch(0.3410 0.1625 292.9477);
  --muted: oklch(0.9679 0.0027 264.5424);
  --muted-foreground: oklch(0.5503 0.0235 264.3620);
  --accent: oklch(0.9546 0.0227 303.2883);
  --accent-foreground: oklch(0.4865 0.2423 291.8661);
  --destructive: oklch(0.6356 0.2082 25.3782);
  --border: oklch(0.9278 0.0058 264.5314);
  --input: oklch(0.9278 0.0058 264.5314);
  --ring: oklch(0.4865 0.2423 291.8661);

  /* §3.2 the magic: brand-tinted, soft, low-opacity shadows */
  --shadow-color: 263 70% 50%;
  --shadow-sm: 0px 8px 30px 0px hsl(var(--shadow-color) / 0.08), 0px 1px 2px -1px hsl(var(--shadow-color) / 0.08);
  --shadow:    0px 8px 30px 0px hsl(var(--shadow-color) / 0.08), 0px 1px 2px -1px hsl(var(--shadow-color) / 0.08);
  --shadow-md: 0px 8px 30px 0px hsl(var(--shadow-color) / 0.08), 0px 2px 4px -1px hsl(var(--shadow-color) / 0.08);
  --shadow-lg: 0px 8px 30px 0px hsl(var(--shadow-color) / 0.08), 0px 4px 6px -1px hsl(var(--shadow-color) / 0.08);

  --tracking-normal: -0.015em;                       /* §3.4 tight tracking */
  --font-sans: "Plus Jakarta Sans", Inter, system-ui, sans-serif;
}

.dark {
  --background: oklch(0.1091 0.0091 301.6956);
  --foreground: oklch(0.9838 0.0035 247.8583);
  --card: oklch(0.1376 0.0118 301.0607);
  --primary: oklch(0.6083 0.2172 297.1153);          /* lighter primary in dark */
  /* …mirror every role; a generator produces this half for you… */
  --shadow-color: 0 0% 0%;                            /* dark shadows go black + deeper */
  --shadow-lg: 0px 20px 40px -10px hsl(var(--shadow-color) / 0.60), 0px 4px 6px -11px hsl(var(--shadow-color) / 0.60);
}

@theme inline {                                       /* expose tokens to utilities */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  /* …one line per role… */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: var(--font-sans);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground font-sans; letter-spacing: var(--tracking-normal); }
}
```

## 7. The 12-point "is my UI boring?" checklist

- [ ] Colors authored in **OKLCH** and referenced by **role** (`bg-primary`, `text-muted-foreground`)?
- [ ] Shadows **tinted with the brand hue**, low opacity, large blur — *not* default black?
- [ ] **One `--radius`** with the rest derived from it?
- [ ] Headings have **tight tracking** and a real **display font that's actually loaded**?
- [ ] Spacing on a **4/8px grid**?
- [ ] **Primary used sparingly** (≈10%, one CTA per view) over mostly neutral surfaces?
- [ ] Hover/focus/selected states use **`color-mix`/opacity of existing tokens**, not new colors?
- [ ] Every interactive element has a **visible focus ring**?
- [ ] **Empty, loading (skeleton), and error states** designed?
- [ ] **Dark mode** fully defined (every role has a `.dark` value)?
- [ ] Animations **CSS-first, fast, subtle**?
- [ ] New visual states added as **variants**, not one-off inline classes?

---

# PART II — THE DESIGN DISCIPLINE (a QA mindset for UX)

## 8. The big idea

You don't ship quality by "testing harder at the end," and you don't ship good UX by "having a good
eye." Both are **disciplines with a lifecycle, levels of verification, named techniques, and
objective checklists.** This half gives you that discipline using vocabulary a QA engineer already
owns (TDD/BDD, unit/integration/e2e, STLC).

## 9. The Rosetta Stone — QA world ↔ design world

| QA | Design equivalent | What it is |
|---|---|---|
| **STLC** (lifecycle) | **Double Diamond / Design Thinking / HCD** (ISO 9241-210) | Research → define → ideate → prototype → validate. |
| **Requirements / acceptance criteria** | **User research, Jobs-To-Be-Done, personas, user/job stories** | "What must this accomplish, for whom?" |
| **Test design techniques** | **Information architecture + interaction patterns** | Proven structures so you don't reinvent flows. |
| **Static analysis / linting** | **Heuristic evaluation** (Nielsen's 10) + **accessibility audit** (WCAG) | Expert review against rules — no users needed; catches cheap bugs early. |
| **Unit test** | **Component/atom review** (Atomic Design) + **token compliance** | Does each component look & behave per the system in isolation? |
| **Integration test** | **Flow consistency + design-system adherence** | Do components compose into a coherent screen and flow? |
| **E2E test** | **Usability testing with real users** | Can a real human complete the task? Ground truth. |
| **Regression test** | **Visual regression** (Chromatic, Percy, Playwright snapshots) | Did a change silently break the look/layout? |
| **BDD** (Given/When/Then) | **Scenario-based design + "Definition of Done" for design** | Specify behavior by scenario before building. |
| **Bug severity (S1–S4)** | **Usability severity rating (0–4, Nielsen)** | Rank by impact × frequency × persistence. |
| **Coverage %** | **State & breakpoint coverage** (empty/loading/error/success/offline × sizes) | The states teams forget = most "cheap-feeling" bugs. |
| **A/B testing** | **A/B & multivariate testing + analytics** | Validate with behavior at scale. |
| **Exploratory testing** | **Cognitive walkthrough / guerrilla testing** | Unscripted "use it as a new user." |

## 10. Process frameworks (your "STLC for design")

Pick one as your spine — they're variations on the same diverge/converge loop.
- **Double Diamond** — Discover → Define → Develop → Deliver. Easiest to adopt.
- **Design Thinking** — Empathize → Define → Ideate → Prototype → Test.
- **Human-Centered Design** — codified as **ISO 9241-210** (an actual standard, like ISTQB/IEEE 829).
- **Lean UX** — hypothesis-driven, build-measure-learn; pairs with Agile.
- **Jobs-To-Be-Done** — frames features as "jobs" users hire the product for; great for requirements.

> Like testing, validation is **continuous**, not a final gate: prototype & usability-test cheaply and often.

## 11. The laws & principles (the citable canon)

**Usability heuristics — Nielsen's 10** (the "lint rules" of UX):
1. Visibility of system status · 2. Match system ↔ real world · 3. User control & freedom ·
4. Consistency & standards · 5. Error prevention · 6. Recognition over recall ·
7. Flexibility & efficiency · 8. Aesthetic & minimalist design · 9. Help users recover from errors ·
10. Help & documentation.

**Laws of UX** (cognitive principles): **Jakob's** (match other apps) · **Fitts's** (big, close targets) ·
**Hick's** (fewer choices = faster) · **Miller's** (~7±2, chunk it) · **Gestalt** (proximity/similarity/closure) ·
**Aesthetic-Usability Effect** (pretty = perceived easier — why Part I matters) · **Doherty Threshold** (< 400ms feedback).

**Don Norman's fundamentals:** affordances, signifiers, feedback, mapping, constraints, conceptual models, discoverability.

**Visual fundamentals:** hierarchy, contrast, balance, alignment, repetition, white space, type scale, grid.

## 12. Accessibility — design's "compliance/non-functional testing"

Measurable, CI-able, often legally required.
- **WCAG 2.2**, mnemonic **POUR**: Perceivable, Operable, Understandable, Robust. Target **level AA**.
- Concrete: contrast ≥ 4.5:1 (text), keyboard operability, visible focus, alt text, labels/ARIA,
  reduced-motion, ≥ 44/48px touch targets, no color-only meaning.
- **ARIA Authoring Practices (APG)** define the patterns (headless primitives implement these for you).
- Tools (your scanners): **axe DevTools**, **Lighthouse**, **WAVE**, **Pa11y** (run it in CI like a test).

## 13. Mobile-specific rules

The platform guidelines are your "API contracts": **Apple Human Interface Guidelines (HIG)** and
**Material Design 3** (`m3.material.io`).

- **Touch targets** ≥ **44×44 pt (iOS)** / **48×48 dp (Android)**, with spacing between them (Fitts's Law).
- **Thumb zones / reachability** — primary actions in the bottom-reachable arc; bottom nav, bottom sheets, FAB.
- **Gestures** discoverable, with visible fallbacks; don't hide core actions behind hidden swipes.
- **Responsive *and* adaptive** — fluid layout + breakpoints + **safe areas** (`env(safe-area-inset-*)`).
- **Real-world states** — offline, slow network, permission denied, empty, loading, error, success.
- **Performance is UX** — skeletons, optimistic UI, lazy loading, < 400ms feedback (Doherty).
- **Input ergonomics** — correct keyboard type per field, autofill, masks, minimize typing.
- **Respect OS settings** — orientation, Dynamic Type / text scaling, dark mode, reduced motion.
- **Forgiveness** — confirm destructive actions, offer undo, no dead-ends.
- **Honor platform conventions** — iOS back-swipe & tab bars vs. Android back button; don't ship an
  Android-feeling iOS app (the "cross-browser testing" of mobile).
- **Mobile-first** — design the smallest screen first, enhance up. Test on **real devices**, not just simulators.

## 14. Design "Definition of Done" (your acceptance gate)

Run on every screen/feature before ship — the design analog of test exit criteria.

**Functionality / flow**
- [ ] Maps to a real user goal (JTBD/user story) with success criteria
- [ ] Happy path validated with 3–5 users (usability test) — *e2e*
- [ ] All states designed: empty, loading, partial, error, success, offline, zero-permission — *coverage*

**Heuristics (static review)**
- [ ] Passes Nielsen's 10 (esp. system status, error prevention, consistency)
- [ ] Hierarchy clear; one primary action per view; Hick's/Miller's respected
- [ ] Copy is plain, action-oriented, in the user's language

**Visual / system**
- [ ] Uses design tokens only (color/spacing/radius/shadow) — no hard-coded values (Part I)
- [ ] On the spacing grid; consistent type scale; aligned
- [ ] Component variants reused, not one-off styles

**Accessibility (compliance)**
- [ ] WCAG AA: contrast, keyboard, visible focus, labels/alt, no color-only meaning
- [ ] Respects reduced-motion, dark mode, text scaling
- [ ] Passes axe/Lighthouse with no critical issues — *automated gate*

**Mobile / responsive**
- [ ] Touch targets ≥ 44/48; thumb-reachable primary actions
- [ ] Works across breakpoints + safe areas; tested on a real device
- [ ] Platform conventions honored (iOS vs Android)
- [ ] Perceived performance: feedback < 400ms, skeletons/optimistic UI

**Regression**
- [ ] Visual regression snapshots updated/reviewed

## 15. Where to study — the curriculum

**Books (in reading order):**
1. *Don't Make Me Think* — Steve Krug (usability; start here)
2. *Refactoring UI* — Wathan & Schoger (the visual layer; maps to Part I)
3. *The Design of Everyday Things* — Don Norman (foundations)
4. *Laws of UX* — Jon Yablonski (cognitive laws, short)
5. *Atomic Design* — Brad Frost (free online; design systems)
6. *Mobile First* — Luke Wroblewski (mobile)
7. *About Face* — Alan Cooper (deep interaction design)
8. *100 Things Every Designer Needs to Know About People* — Susan Weinschenk (psychology)
9. *Universal Principles of Design* — Lidwell, Holden, Butler (encyclopedia of named principles)
10. *Form Design Patterns* — Adam Silver (forms + accessibility)

**Sites:** nngroup.com (research gold standard) · lawsofux.com · developer.apple.com/design (HIG) ·
m3.material.io (Material) · w3.org/WAI + web.dev + a11yproject.com (accessibility) ·
refactoringui.com · smashingmagazine.com · interaction-design.org (IxDF) · growth.design & builtformars.com (UX teardowns).

**Courses / certs (your "ISTQB for design"):** Interaction Design Foundation (IxDF) ·
Google UX Design Certificate (Coursera) · NN/g UX Certification.

---

## 16. TL;DR

- Great UI is a **system** (Part I): OKLCH semantic tokens, brand-tinted soft shadows, one-knob
  radius + tight tracking + a real loaded font, and designed empty/loading/error states. Tune the
  token block, reuse the component & composition layers.
- Great UX is a **discipline** (Part II): it has a lifecycle (Double Diamond), verification *levels*
  (heuristic eval = static analysis, usability test = e2e), citable laws (Nielsen, Laws of UX,
  Gestalt, Norman, WCAG/POUR), and mobile specs (Apple HIG, Material 3).
- Operate it like QA: start with *Don't Make Me Think* + *Refactoring UI*, bookmark nngroup.com +
  lawsofux.com, and use the **Design Definition of Done (§14)** as your exit gate — exactly like test exit criteria.
