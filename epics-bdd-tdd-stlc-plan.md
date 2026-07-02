# COSEKE Scoring Model — Epics, BDD/TDD, STLC & Design Plan

Builds directly on `full-system-implementation-plan.md` (the sprint-by-sprint backend/frontend plan)
and `UI_UX_HANDBOOK (1).md` (the design system + design discipline). This document adds the layer
those two don't cover on their own: **epics that group the sprints**, **BDD scenarios** (behavior
specified before it's built), **TDD test lists** (unit tests written before the formula engine code),
an **STLC mapping** (so design/QA verification has a lifecycle, not just a final gate), and a
**concrete design system** applying the Handbook's tokens to this specific product.

---

## 1. Epic map

Each epic = one sprint from the implementation plan, reframed as a deliverable business capability
with acceptance criteria, not just a task list. Epics are the unit stakeholders sign off on; sprints
are how the team executes them.

| Epic | Sprint | Business capability delivered | Formula/logic risk |
|---|---|---|---|
| **E0 — Platform Foundation** | 0 | Auth, roles, branded shell, CI/test scaffolding exist | none (plumbing) |
| **E1 — Client Management** | 1 | Clients can be onboarded, edited, retired; metrics/depts seeded | low |
| **E2 — Quantitative Scoring Engine** | 2 | Reviewer scores 7 metrics; weighted departmental score computed | **highest** |
| **E3 — Qualitative & Composite Scoring** | 3 | 3 maturity dimensions rated; composite score + band computed | high |
| **E4 — Scoring Dashboard** | 4 | Stakeholders see composite score, band, breakdowns at a glance | medium (aggregation only) |
| **E5 — Project Health (SPI/CPI)** | 5 | PV/AC/EV tracked; SPI/CPI + progress scorecard computed | high |
| **E6 — Automation & Integrations** | 6 | Jira/Asana sync feeds PV/AC/EV automatically on a cadence | medium (sync correctness) |
| **E7 — Accessibility, Security & Hardening** | 7 | WCAG AA, audit logging, security pass, usability-tested | n/a (verification epic) |
| **E8 — Launch Readiness** | 8 | Production-ready, monitored, spec-complete against source doc | n/a (release epic) |

**Ordering rationale:** E2/E3/E5 carry the formula correctness risk the source plan flags as highest —
each gets a TDD-first unit-test suite *before* any UI consumes it (§4 below). E4 is pure aggregation
of E2/E3/E5 outputs, so it can't start early. E6 depends on E5's data model existing first. E7/E8 are
verification and release epics that run against everything built in E0–E6.

---

## 2. STLC — applied as the project's verification lifecycle

Per the Handbook's Rosetta Stone (§9), STLC phases aren't a one-time gate — they recur every sprint.
Here's what each phase means *for this project*, and where it lands on the calendar.

| STLC Phase | What it means here | When |
|---|---|---|
| **1. Requirement Analysis** | Confirm each epic's acceptance criteria trace to the source scoring-model doc (formulas, bands, weights) — not paraphrased, not assumed. | Start of each epic, before sprint planning |
| **2. Test Planning** | Pick the test types per epic (unit for formulas, integration for API+DB, BDD/e2e for user flows, visual regression for UI, axe/Lighthouse for a11y/perf). Define entry/exit criteria per Definition of Done in the source plan. | Sprint planning, every sprint |
| **3. Test Case Design** | Write Gherkin BDD scenarios (§4) and TDD unit-test lists (§5) **before** implementation. This is the literal "test design technique" step, done as design-by-example. | Before coding starts, every sprint |
| **4. Test Environment Setup** | CI pipeline (lint/typecheck/test/build), staging DB with seeded fixtures, Playwright+axe+Lighthouse jobs — built once in E0, extended per epic. | E0, then incrementally |
| **5. Test Execution** | Unit tests run on every commit; BDD/e2e scenarios run in CI; manual usability pass in E7; exploratory/cognitive walkthrough ad hoc each sprint. | Continuous, every sprint |
| **6. Test Cycle Closure** | Sprint review against the epic's Design DoD (Handbook §14) + the source plan's "Definition of done" line. Triage any open findings by Nielsen severity (0–4); log, don't silently ship. | End of every sprint |

This closes the loop the Handbook draws between QA and design: **heuristic evaluation = static
analysis**, **usability testing = e2e**, **visual regression = regression testing** — all run on a
cadence, not just checked once in Sprint 7.

---

## 3. Design system for this product (applying Handbook Part I)

The Handbook's default token block is a generic starter (violet primary). This product is a
**B2B financial/operational scoring tool** — trust and legibility of bands matter more than
"exciting." Tuning decisions:

### 3.1 Brand hue
A desaturated **blue** (professional, low-risk association, common in enterprise dashboards) as
primary, reserved for the one CTA per view (Handbook §3.5, 60/30/10 rule):

```css
--primary: oklch(0.5240 0.1880 255.0);         /* confident blue, not pure hex */
--shadow-color: 255 55% 45%;                    /* shadow tint matches primary hue, §3.2 */
```

### 3.2 Semantic band colors — the one place color carries real meaning
The composite band (`Excellent / Strong / Average / High risk`) is the single most
decision-critical piece of UI in the product. Handbook rule: **never color-only** (§4.8, §14
accessibility). Each band gets a token, an icon, and mandatory label text — color is reinforcement,
not the signal:

| Band | Score range | Token | Pairing (never color alone) |
|---|---|---|---|
| Excellent | 85–100 | `--band-excellent: oklch(0.62 0.17 145)` (green) | ✓ icon + "Excellent" label |
| Strong | 70–84 | `--band-strong: oklch(0.60 0.14 200)` (teal-blue) | ▲ icon + "Strong" label |
| Average | 50–69 | `--band-average: oklch(0.75 0.15 80)` (amber) | ● icon + "Average" label |
| High risk | <50 | `--band-risk: oklch(0.63 0.21 25)` (red, matches `--destructive`) | ▼ icon + "High risk" label |

These four become `--color-band-*` entries in `@theme inline`, consumed only via a `<BandBadge>`
component (Layer 2) — pages (Layer 3) never hardcode a band color.

### 3.3 Rest of the token block
Everything else follows the Handbook's starter verbatim: OKLCH throughout, `--radius: 1rem` with
derived scale, brand-tinted soft shadows, `"Plus Jakarta Sans"` display font actually loaded (not
just declared — Handbook's flagged §3.4 bug), tight tracking on headings, dark mode with every
role mirrored including band colors (bands must stay legible in dark mode — check contrast against
`--card` in both themes).

### 3.4 Composition rules specific to this app
- **Metric rows** (7 quantitative metrics) use one repeated component: label, weight (fixed,
  muted-foreground), raw input, live-computed score badge — never five different layouts for the
  same row type (Handbook §4.7, variants over one-offs).
- **Charts**: single hue + neutral gray for the weighted-metrics bar (earned vs. ceiling); single
  y-axis for SPI/CPI history (Handbook implicitly via "no dual-axis, no gratuitous color" — chart-1
  and chart-2 tokens only, not five chart colors for two series).
- **Drill-down** dialogs/slide-overs use Radix primitives (focus trap, ARIA free) per Handbook §2.
- **Integration failure states** (Sprint/Epic 6) are the app's best test of Handbook §4.6 (empty/
  loading/error as first-class) — expired token, permission denied, rate-limited each need a
  distinct illustration/copy, not a shared generic toast.

### 3.5 Design DoD — applied per epic, not just once
Every epic listed in §1 runs the full Handbook §14 checklist at its "Test Cycle Closure" STLC step
(§2 above): functionality/flow, heuristics, visual/system, accessibility, mobile/responsive,
regression. E7 is where the *cumulative* pass happens (every screen, real devices, 3–5 users) — but
individual epics don't defer accessibility or states to E7; they self-check as they ship, per the
existing plan's note that "design token discipline... applies for the life of the frontend."

---

## 4. BDD — Gherkin scenarios per epic

Written **before** implementation, as the executable spec the e2e suite (Playwright) will encode.
Each scenario traces to a Definition-of-Done line in the source plan. Not exhaustive — the
highest-risk and highest-ambiguity flows per epic.

```gherkin
Feature: Client management (E1)

  Scenario: Create a client with required fields
    Given I am logged in as a scorer
    When I submit the client form with a valid name, department, and start date
    Then the client appears in the client list within one request
    And the client detail page shows an Overview tab with the data I entered

  Scenario: Viewer role cannot edit a client
    Given I am logged in as a viewer
    When I open a client's detail page
    Then I see no edit or delete controls
    And attempting the edit endpoint directly returns 403

  Scenario: Empty client list
    Given no clients exist yet
    When I visit the client list page
    Then I see a designed empty state with a call to action to add the first client
    And no console errors or raw "[]" are rendered
```

```gherkin
Feature: Quantitative scoring engine (E2 — highest formula risk)

  Scenario: Metric score computed from raw measurement
    Given a metric with a defined benchmark and scoring bands (5/4/3/2/1)
    When a reviewer enters a raw measurement within the "5" band's variance threshold
    Then the displayed score is 5
    And the score updates within 400ms of input (Doherty threshold)

  Scenario: Departmental score is the weighted sum
    Given all seven metrics have been scored for a client
    When the departmental score is computed
    Then it equals Σ(metric score × metric weight) exactly as returned by the backend engine
    And the frontend-displayed value matches the backend value to two decimal places

  Scenario: Partial scoring is saved without penalty
    Given a reviewer has scored 4 of 7 metrics and navigates away
    When they return to the scoring form
    Then their 4 entries are preserved (autosave/draft)
    And the unscored 3 metrics are visibly marked as not yet scored, not silently zeroed
```

```gherkin
Feature: Qualitative and composite scoring (E3)

  Scenario: Composite score blends quantitative and qualitative correctly
    Given a client has a quantitative score of 80 and a qualitative score of 60
    When the composite score is computed
    Then it equals 80 × 0.60 + 60 × 0.40 = 72
    And the band shown is "Strong" (70–84), with the label text visible, not color alone

  Scenario: Boundary banding is unambiguous
    Given a composite score of exactly 85
    When the band is looked up
    Then the band is "Excellent", not "Strong"
    And a score of 84.99 resolves to "Strong"

  Scenario: Rubric choice shows criteria at decision time
    Given a reviewer is rating "data privacy/compliance" maturity
    When they view the rubric selector
    Then the level 1/3/5 descriptive text is visible inline, not hidden behind a tooltip
```

```gherkin
Feature: Scoring dashboard (E4)

  Scenario: Fully-scored client renders correct aggregation
    Given a client has complete quantitative and qualitative scores
    When I open their dashboard
    Then the composite score, band, and per-metric breakdown match a single
      GET /clients/:id/dashboard response (not five separate calls)

  Scenario: Zero-data client shows a designed empty state, not a broken layout
    Given a client has no scores entered yet
    When I open their dashboard
    Then I see an explicit "not yet scored" state with a path to start scoring
    And no NaN, undefined, or empty chart renders
```

```gherkin
Feature: Project health SPI/CPI (E5)

  Scenario: SPI and CPI computed from PV/AC/EV
    Given PV = 100,000, AC = 90,000, EV = 95,000 for a period
    When SPI and CPI are computed
    Then SPI = EV / PV = 0.95 and CPI = EV / AC ≈ 1.056
    And the scorecard awards points per the documented bands (SPI/CPI: 30/15/0)

  Scenario: History chart uses one axis
    Given three periods of SPI/CPI data exist for a client
    When the history chart renders
    Then SPI and CPI are both plotted against a single shared y-axis
    And no dual-axis distortion is present
```

```gherkin
Feature: Automation and integrations (E6)

  Scenario: Scheduled sync populates PV/AC/EV automatically
    Given a client is connected to a test Jira project with field mapping configured
    When the bi-weekly sync job runs
    Then the client's PV/AC/EV values update to match the mapped Jira fields
    And "last synced" timestamp updates on the integration settings panel

  Scenario: Expired token surfaces a distinct, actionable error
    Given a connected integration's OAuth token has expired
    When the sync job runs or a user opens the integration panel
    Then a specific "reconnect required" state is shown (not a generic error toast)
    And a reconnect action is available inline
```

```gherkin
Feature: Accessibility and audit (E7)

  Scenario: Keyboard-only user can complete the core flow
    Given I am using only a keyboard, no mouse
    When I navigate from client list → score entry → save → dashboard
    Then every interactive element is reachable in a logical tab order
    And focus is always visibly indicated

  Scenario: Score change is attributable
    Given a scored client's "High risk" band is disputed by a client stakeholder
    When an admin opens the audit log for that client
    Then they see who changed which metric, the old and new value, and when
```

---

## 5. TDD — unit test list for the formula engine (write before the code)

Source plan already flags formula correctness as the top risk and requires unit tests exist
*before* the API is touched. This is the concrete list, sequenced so the engine is built
test-first (red → green → refactor) rather than tested after the fact.

**5.1 `scoreMetric(rawMeasurement, benchmark, bandDefinition) → 1|2|3|4|5`**
- [x] Exact benchmark match → band 5
- [x] Variance at each documented threshold boundary (band 5/4/3/2/1) — test *both* sides of every
      boundary (e.g., just-inside-band-5 vs. just-outside)
- [x] Measurement far outside all bands → clamps to band 1, never throws, never returns 0
- [x] Negative/zero/null raw measurement → explicit handled case (per doc's intent), not a silent
      NaN
- [x] Symmetric vs. asymmetric variance (if the doc's bands differ above/below benchmark, both
      directions tested independently)

**5.2 `departmentalScore(metricScores[], weights[]) → number`**
- [x] Σ(score × weight) for a full known input/output pair from the source doc
- [x] Weights sum to 1.0 validated (or documented behavior if they don't, e.g. reject/normalize)
- [x] Missing metric score (not yet entered) excluded correctly, not treated as 0 unless that's the
      documented rule — assert whichever the doc specifies
- [x] Weight snapshot: changing a metric's weight later does not retroactively change a
      historical score already computed with the old weight

**5.3 `compositeScore(quantScore, qualScore) → number`**
- [x] `0.60 × quant + 0.40 × qual` for at least 3 known pairs
- [x] Rounding rule consistent (e.g., 2 decimal places) and matches what the frontend displays
- [x] Missing qualitative score → documented fallback behavior tested explicitly (block composite
      vs. quant-only partial), not left to fall through untested

**5.4 `bandForScore(compositeScore) → "Excellent"|"Strong"|"Average"|"High risk"`**
- [x] Every boundary tested on both sides: 49.99/50, 69.99/70, 84.99/85
- [x] 0 and 100 (extremes) resolve correctly
- [x] Negative or >100 input rejected/clamped per an explicit decision, not silently mis-banded

**5.5 `spi(ev, pv) / cpi(ev, ac) → number`**
- [x] Standard case matches EVM formula exactly (SPI = EV/PV, CPI = EV/AC)
- [x] AC or PV = 0 → explicit handled case (divide-by-zero guard), not `Infinity`/`NaN` reaching the
      UI
- [x] SPI/CPI = 1.0 exactly (on schedule/budget) classified correctly by the scorecard, not
      miscategorized as over or under

**5.6 `progressScorecard(spi, cpi, signoff, benchTime) → 0–100`**
- [x] SPI point bands: 30/15/0 at each documented threshold, both sides of boundaries
- [x] CPI point bands: 30/15/0, same boundary treatment
- [x] Signoff: 20/0 (binary) — both cases
- [x] Bench/resource utilization: 20/10 bands at the boundary
- [x] Sum of all four sub-scores never exceeds 100 and matches a full worked example from the
      source doc

**5.7 Integration-level (still TDD, one layer up)**
- [x] `GET /clients/:id/dashboard` payload's numbers equal calling the four unit-tested functions
      directly with the same stored inputs — catches drift between the aggregation endpoint and the
      engine it's supposed to wrap
- [x] Recalculation cron job (E6) produces identical output to a manual on-demand call with the same
      inputs — no hidden divergent code path


---

## 6. Sprint-by-epic execution checklist

For every epic in §1, the sprint is "done" only when all four of these are true — this is the
practical merge of the source plan's per-sprint DoD, the Handbook's Design DoD (§14), and this
document's BDD/TDD/STLC additions:

1. **TDD**: unit tests for any formula/logic in that epic are written and green (§5 for E2/E3/E5).
2. **BDD**: the epic's Gherkin scenarios (§4) pass as automated e2e/integration tests, not just
   manually eyeballed.
3. **Design DoD**: Handbook §14 checklist passes for every screen touched (states, tokens, a11y,
   mobile, regression snapshot).
4. **STLC closure**: findings triaged by severity, sprint review confirms the epic's acceptance
   criteria trace back to the source scoring-model formulas/bands — nothing paraphrased or assumed.

Epics E7 and E8 are where the *cumulative* versions of all four run across the whole system, not
just that epic's own screens — matching the source plan's Sprint 7/8 scope.
