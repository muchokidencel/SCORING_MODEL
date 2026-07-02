# Full-system implementation plan — COSEKE scoring model

Covers backend, frontend, database, and integrations together, sprint by sprint. Each sprint pairs
the API/data work with the UI that consumes it, so nothing gets built ahead of what it needs or sits
unused waiting for the other half.

**Stack recap**
- Backend: Express (Node.js/TypeScript), Prisma ORM, PostgreSQL, Zod validation, node-cron/BullMQ
  for scheduled jobs, OAuth2/SSO auth.
- Frontend: React (Vite or Next.js) + TypeScript, Tailwind v4, shadcn/ui, Radix primitives, OKLCH
  design tokens per the UI/UX Handbook.
- Infra: CI with lint/test/build, axe + Lighthouse + Playwright visual snapshots, staging + prod
  environments.

Nine sprints, two weeks each (Sprint 0 is a one-week spike). Adjust to team size — a small team may
run backend and frontend tasks within a sprint in parallel; a single full-stack dev runs them
sequentially within the sprint.

---

## Sprint 0 — Foundation (1 week, spike)

**Backend**
- Repo scaffold: Express + TypeScript, project structure (routes / services / repositories layers —
  keep the formula engine in its own service module, not in route handlers).
- PostgreSQL provisioned (local + staging); Prisma initialized; first migration for `User`,
  `Client`, `Session`/auth tables.
- Auth scaffold: OAuth2/SSO integration, JWT or session middleware, role field on `User`
  (viewer / scorer / admin).
- Error-handling middleware + request validation middleware (Zod) wired globally.
- CI pipeline: lint, typecheck, test, build on every PR.

**Frontend**
- Vite/Next.js + TS scaffold; `npx shadcn@latest init` (new-york style).
- Branded OKLCH token block in place (one primary hue, tweakcn-generated), brand-tinted shadows,
  one `--radius` knob, real display font loaded.
- Base components installed: `button card badge dialog table form input select tabs skeleton
  empty-state toast`.
- Typed API client pointed at the Express backend (env-based base URL).
- Login page + protected route wrapper against the auth scaffold above.
- CI: axe/Lighthouse/Playwright jobs wired now, even with little to test.

**Definition of done:** a user can log in through the real auth flow, hit a protected page, and see
a branded (empty) shell. Nothing else functional yet — this sprint is plumbing.

---

## Sprint 1 — Client management (2 weeks)

**Backend**
- `Client` CRUD endpoints (`GET/POST/PATCH/DELETE /clients`), with Zod schemas matching frontend
  validation.
- `Department`/`EvaluationCategory` reference tables seeded from the scoring model doc's seven
  quantitative metrics (digitization efficiency, data accuracy, SLA, sales velocity, financial
  health, project delivery, software quality) with their default weights.
- Role-based access checks: who can create/edit clients vs. only view.

**Frontend**
- App shell: sidebar/topbar nav, one consistent page-header pattern used everywhere from here on.
- Client list page: table, search/filter, empty state.
- Client create/edit form (Zod-validated, mirrors backend schema).
- Client detail page shell with tabs (Overview / Scoring / Health / History) — tabs exist now,
  content fills in over the next sprints.

**Definition of done:** full client CRUD works end-to-end through the real API; loading/empty/error
states designed for every screen; passes axe with no critical issues.

---

## Sprint 2 — Quantitative scoring engine (2 weeks)

**Backend**
- Data model: `MetricScore` (client, metric, period, raw measurement, computed score, weight
  snapshot).
- Formula engine service: implements `Final Departmental Score = Σ(Metric Score × Weight)` and the
  per-metric scoring bands (5/4/3/2/1 by variance from benchmark). Unit-tested against known
  input/output pairs before anything touches the API.
- Endpoints: `POST /clients/:id/metrics/:metricId/score`, `GET /clients/:id/quantitative-score`.

**Frontend**
- Quantitative scoring form: seven metric rows, weight shown as fixed label, raw measurement input
  with the score auto-computed and displayed live (mirrors backend formula, <400ms feedback).
- Save-draft or autosave, since scoring is filled out over a review session.
- Inline validation errors, not just toasts.

**Definition of done:** a reviewer can score all seven metrics for a client; computed values match
the backend engine in a spot check; formula engine has unit test coverage for every score band.

---

## Sprint 3 — Qualitative model and composite scoring (2 weeks)

**Backend**
- Data model: `MaturityRating` (client, dimension, level 1/3/5, notes) for the three dimensions
  (system adoption, data privacy/compliance, change management/onboarding).
- Composite scoring service: `Total Composite = 60% Quantitative + 40% Qualitative`, plus the
  banding lookup (Excellent 85–100 / Strong 70–84 / Average 50–69 / High risk <50).
- Endpoint: `GET /clients/:id/composite-score`.

**Frontend**
- Qualitative form: three rubric selectors as segmented/radio cards showing the actual rubric text
  at the point of choice (not hidden in a tooltip).
- Composite score preview component, reused later on the dashboard.
- Band badge component: semantic color per band, never color-only (paired with the label text).

**Definition of done:** full scoring pass (quantitative + qualitative) produces a composite score
and correct band for a test client; formula matches backend exactly.

---

## Sprint 4 — Scoring dashboard (2 weeks)

**Backend**
- Aggregation endpoints for the dashboard: composite score + band, per-metric breakdown (earned vs.
  weight ceiling), qualitative summary — bundled into one `GET /clients/:id/dashboard` payload to
  avoid the frontend making five separate calls.
- Basic caching (or at minimum, avoid recomputing the formula on every request if scores haven't
  changed).

**Frontend**
- Metric cards row: composite score, band, progress score.
- Weighted metrics chart: horizontal bar, points earned vs. ceiling, one hue + neutral gray.
- Qualitative maturity cards.
- Empty/loading states for unscored vs. partially-scored vs. loading clients.
- Drill-down dialog/slide-over per metric (measurement formula, history) using Radix primitives.

**Definition of done:** dashboard renders correctly against real backend data for a fully-scored,
partially-scored, and zero-data client; matches the earlier reviewed mockup; visual regression
baseline captured.

---

## Sprint 5 — Project health: SPI/CPI tracking (2 weeks)

**Backend**
- Data model: `ProjectMetricSnapshot` (client, period, PV, AC, EV) plus computed SPI/CPI.
- Endpoints for manual entry and for history retrieval (`GET /clients/:id/health-history`).
- Progress scorecard calculation (schedule health, budget health, client signoff, resource
  utilization → 0–100 points) as its own service function, unit tested against the doc's point
  bands (30/15/0 for SPI and CPI, 20/0 for signoff, 20/10 for bench time).

**Frontend**
- Manual PV/AC/EV entry form with live SPI/CPI computed preview.
- SPI/CPI history chart (single y-axis, one series per index, no dual-axis).
- Project progress scorecard breakdown table/stacked bar.

**Definition of done:** SPI/CPI and scorecard values computed correctly from manual entry; history
chart renders multi-period data; matches backend calculation exactly.

---

## Sprint 6 — Automation and integrations (2 weeks)

**Backend**
- Bi-weekly recalculation job (node-cron or BullMQ) that recomputes SPI/CPI and scores per the
  "bi-weekly sprint review" cadence in the doc.
- Jira/Asana integration: OAuth connect flow, field-mapping storage (which Jira/Asana fields feed
  PV/AC/EV), scheduled sync job, sync-status tracking (last synced, last error).
- Webhook or polling fallback depending on what the PM tool APIs support.

**Frontend**
- Integration settings panel: connect Jira/Asana, map fields, manual "sync now," sync-status display
  (system status visibility, per Nielsen heuristic #1).
- Designed failure states: expired token, permission denied, rate-limited — each distinct, not a
  generic error toast.

**Definition of done:** a connected client's PV/AC/EV populates automatically from a test Jira/Asana
project on the scheduled cadence; all integration failure states are reachable and designed.

---

## Sprint 7 — Accessibility, security, and hardening (2 weeks)

**Backend**
- Security pass: input sanitization audit, rate limiting on public endpoints, dependency audit,
  auth/role checks re-verified on every endpoint (not just the ones built early).
- Load/perf check on the dashboard aggregation endpoint and the recalculation job at realistic data
  volume (years of history, dozens of clients).
- Audit logging on score changes (who changed what score, when — likely to matter given these scores
  drive client-facing decisions).

**Frontend**
- Full WCAG AA pass across every screen built so far: contrast, keyboard-only walkthrough, focus
  rings, `aria-invalid`, alt text/labels.
- Mobile pass: touch targets, thumb zones, safe areas, tested on real iOS and Android devices.
- Dark mode audit: every token has a working `.dark` value.
- Usability test with 3–5 real users on the core flow (score entry → dashboard); triage findings by
  Nielsen severity, fix S1/S2.

**Definition of done:** full Design Definition of Done checklist passes on every screen; backend
passes its security/audit checklist; usability findings triaged.

---

## Sprint 8 — Launch readiness (1–2 weeks)

**Backend**
- Staging → production deployment pipeline finalized; environment config, secrets management,
  backups/migrations tested in a prod-like environment.
- Monitoring/alerting (error tracking, uptime, job-failure alerts for the recalculation cron).

**Frontend**
- Offline/slow-network states for score entry and dashboard.
- Large-data edge cases: pagination/virtualization for long client lists and multi-year history.
- Final copy pass (plain, action-oriented, sentence case).
- Cross-browser sanity check.

**Both**
- Stakeholder walkthrough against the original scoring-model document to confirm nothing from spec
  was dropped: composite formula, banding, all seven quantitative metrics, all three qualitative
  dimensions, both health indices, the progress scorecard.

**Definition of done:** ready for limited internal rollout; monitoring in place; known issues logged
and triaged, not silently shipped.

---

## Deliberately out of scope for this plan (Phase 2)

The document's "Analytics-as-a-Service" layer — OCR ingestion, ETL pipelines, NLP/ML insight
extraction, multi-tenant SaaS billing — is a separate initiative with different infrastructure
(Python/FastAPI microservice, data warehouse, OCR/ML APIs) and should be scoped as its own
sprint sequence once the core scoring system above is live and validated with real users. Bolting
it onto this Express/React system mid-build would blur two very different engineering efforts.

## Cross-cutting notes

- **Formula correctness is the highest-risk item in this whole system** — every scoring calculation
  (metric score, composite, SPI/CPI, progress scorecard) should have unit tests written against the
  document's stated bands *before* the frontend consumes it, not after.
- **Backend and frontend validation must stay in sync** (Zod schemas mirrored). Consider generating
  frontend types from the backend schema to prevent drift as the model evolves.
- **Design token discipline** (from the Handbook) applies for the life of the frontend — review it
  in every PR, not just Sprint 7.
- **Audit trail on scores** matters more than it might first seem: if a client disputes a "High risk"
  banding, you need to show exactly which inputs produced it and when they were entered.
