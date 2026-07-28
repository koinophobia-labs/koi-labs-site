# koinophobia.dev as a Founder OS

**Date:** 2026-07-26 · **Owner:** Blake Taylor (founder, product owner, and final approver) · **AI collaborator:** Claude · **Status:** governing plan for the Founder OS missions

Blake's brief: turn koinophobia.dev from a personal portfolio into a **living Founder OS** — a public record of what he is building, testing, learning, and shipping. Within 30 seconds a visitor should know (1) who Blake is, (2) what Koinophobia Labs builds, (3) which products are active, (4) how Blake approaches product development, and (5) where to go next based on who they are.

This document is the required plan-before-code: the audit verdict, the information architecture with every section tied to a visitor need, the status data model, the Build Log spec, the homepage copy direction, and the smallest valuable first slice.

---

## 1. Audit verdict (2026-07-26)

Audited: repo at `origin/main` `8018cdf`, live production on both domains, all `/dev/*` routes, the truth layer (`lib/dev/universe.ts`, `lib/now.ts`, `lib/dev/lab.ts`), and the test suite's honesty invariants.

### What already exists and is right (KEEP)

| Piece | Why it stays |
|---|---|
| `lib/dev/universe.ts` | The brief asks for "a consistent status system such as Exploring / Building / Testing / Live / Paused / Archived." The site already has a **stronger** one: a 9-stage release ladder + a `reach` fact + per-stage freshness budgets + mandatory `evidence[]` + `notYet[]` honesty blocks, enforced by tests. Coarse labels are exactly what let the site lie the first time. We keep the fine ladder and add a coarse **display family** on top (§4). |
| `/products` + per-product worlds | This *is* the Product Constellation. It needs new data, not a new design. |
| `/now` + homepage "Right now" | This *is* the Now section, single-sourced so surfaces can't contradict. It needs a refresh (data is from July 20), not a rebuild. |
| `/about`, `/connect`, `/resume` | Sound, on-voice, live. Untouched this slice. |
| `/lab` experiments | Real experiments with findings. Stays. |
| Field notes + dual publication gate | Every note is held until Blake reads it. That gate is load-bearing and stays exactly as is. The Build Log is a different register (see §5) and does not weaken it. |
| Personal koi + front office | Already the "koi companion provides subtle guidance" the brief asks for. Untouched. |
| Design system (`dev-system.css` tokens, product worlds) | Tokens defined once, AA-checked. The Founder OS look builds on it. |

### What is missing (BUILD)

1. **Build Log** — the one genuinely absent section. `/notes` holds five *essays*, all gated and unpublished, so the site currently shows **no chronological record at all**. New: `lib/dev/log.ts` + `/log` + a homepage strip.
2. **Concierge in the constellation** — the AI front office is live on both domains and absent from `/products`.
3. **Explicit operating loop** — the homepage has three principles but never states the cycle: *live the pain → build the system → pressure-test it → watch real use → refine or refuse → ship again.*
4. **Start Here paths** — the homepage routes 4 visitor types; the brief names 6 (founders/customers, product-curious, collaborators, recruiters, beta testers, followers).

### What is stale (REWRITE — urgent)

- `universe.ts` was verified **2026-07-20**. Trendi and You Know Ball sit on 7-day freshness budgets: **the honesty tests start failing 2026-07-27.** Reality also moved: Trendi is now at build **122** (site says 118), Career Forge now *has* a durable order store (site says it isn't provisioned), Koi Cave's operator loop closed its first real proof-receipt on July 23.
- `lib/now.ts` (July 20) predates all of the above.

### What to REMOVE

Nothing structural. One homepage section (the 3-principle grid) is *absorbed* into the operating-loop section rather than deleted — its best lines survive as loop steps.

### Explicitly out (no evidence exists)

**Project Reach Back** is named in the brief but has zero artifacts on this machine, in the site repo, or in email. Under the site's own rule — *nothing publishes without a source* — it cannot appear yet. **Ask for Blake:** one paragraph of truth (what it is, what has actually happened, what stage) and it gets a constellation entry at the honest stage, likely `concept`. Same for any client systems he wants listed: no invented client work.

---

## 2. Information architecture

Every route, tied to the visitor need it serves:

| Route | Section | Visitor need it answers |
|---|---|---|
| `/` | Founder OS front door: hero → **Right now** → **The systems** → **From the build log** → **How I build** → **Start here** | The 30-second test: who Blake is, what's active, how he works, where to go |
| `/products` | Product Constellation index (reach + stage on every card) | "What has he actually built, and what state is it in?" — customers, recruiters, founders |
| `/products/[slug]` | Product worlds: problem → thesis → state → decisions → evidence → notYet | "Is this real? Can I use it? What did he learn?" — the deep-dive reader |
| `/log` **(new)** | Build Log: chronological record — releases, defects, decisions, milestones, lessons | "Is this person actually shipping?" — followers, recruiters, founders judging execution |
| `/lab` | Experiments with findings | "How does he test things?" — collaborators, technical readers |
| `/notes` | First-person essays (each published only after Blake reads it) | "How does he think?" — currently dark until Blake approves notes |
| `/now` | The full field report | "What is he focused on this week, and what would count as proof?" |
| `/about` | The person, the word, the beliefs | "Who is this?" — anyone deciding whether to trust the rest |
| `/connect` | The fast card | Met-you-somewhere networking |
| `/resume` | The conventional artifact + PDF | Recruiters and hiring teams |

Nav order: **Products · Log · Lab · Now · About · Connect** (Notes appears only when something is published there — existing rule, unchanged).

**Start Here mapping** (homepage section, each path ends in a specific action, not a contact page):

| Visitor | Path | Action |
|---|---|---|
| Founder / business with a leak | Studio | koinophobialabs.com — audit-first intake, or describe the problem to the koi right here |
| Wants to try the products | `/products` | Two are open today; the pages say which, and why the others aren't |
| Beta tester | Email CTA | Trendi TestFlight is invite-only; tell Blake what you make |
| Recruiter / hiring team | `/resume` | Plus `/log` as the living interview |
| Collaborator / fellow builder | Email / `/connect` | Compare notes, build together |
| Following the journey | `/log` | The record itself; LinkedIn for the slower cadence |

---

## 3. The 30-second homepage

Structure (top to bottom) and the question each block answers:

1. **Hero** — who Blake is + the operating idea ("I build systems that turn chaos into leverage"). *Kept: it's live, on-voice, and true.*
2. **Right now** — this week's priorities from `lib/now.ts`, stamped with its update date. *Kept, data refreshed.*
3. **The systems** — the constellation snapshot: every product with reach + stage chip, one origin line, one honest status. *Extended: stage chips, five products.*
4. **From the build log** *(new)* — the three latest entries: proof the record is alive.
5. **How I build** *(new, replaces the principles grid)* — the loop, each step carrying a real receipt from the log, connecting to the way Blake actually works: adversarial self-audits, safety gates (claims gate, betting guardrails), human-centered fixes (shorter first-run, honest refusals).
6. **Start here** — the six paths above.

Copy rules (from the standing ownership brief, unchanged): first-person Blake, no corporate jargon, no invented users/revenue/testimonials, honest labels beat launch language, ambition visible without exaggerating maturity.

---

## 4. Product status data model

**Decision: keep the existing model, add a display layer, add one product.**

- `reach` (fact: who can use it today) and `stage` (9-step release ladder) stay the source of truth with per-stage freshness budgets and `evidence[]`.
- New `stageFamily` maps every stage onto the brief's coarse vocabulary for at-a-glance chips — `exploring · building · testing · live · paused` — while the precise stage stays printed beside it. (`archived` joins the enum the day something is actually archived; adding an unused state today would be decoration.)

| Brief's label | Existing stages it maps to |
|---|---|
| Exploring | `concept` |
| Building | `local`, `internally-validated` |
| Testing | `release-candidate`, `uploaded`, `internal-testers`, `external-testers` |
| Live | `public` |
| Paused | `paused` |

- **New product entry: `concierge`** (Koinophobia Labs Concierge / the front office). It is live on both domains, evidence-backed (merged PRs, live SSR checks, audit trail), and belongs in the constellation. Reach `public`, stage `public`, its own visual world.
- **Refreshed entries** (all `verifiedAt: 2026-07-26`, all against artifacts checked today):
  - **Trendi** — build 122 on TestFlight (deliveries `e5cbeefe` / `caa3229b` / `d811be60`, archives on disk); two on-device defects found and fixed within hours of genuine installs; original cross-Apple-account isolation gate still open.
  - **Career Forge** — live and free; durable order store now passes health checks (`neon-postgres`, verified via `/api/commerce-health` today); checkout stays closed because certification is pinned to an exact commit and the deployment moved past it. That is the *system working as designed* and the page says so.
  - **You Know Ball** — unchanged Apple-side (builds 26/27 accepted, zero testers); branch work (clutch finishes, comeback-bonus truth fix) verified on the remote-less repo today.
  - **Koi Cave** — operator loop v1 produced its first proof-checked receipt July 23 (verified on disk today); merge deliberately waits on a human-hands gate; mail sync has still never run.

---

## 5. Build Log spec

`lib/dev/log.ts` — same discipline as the universe, different register from the notes:

- **Register:** record, not essay. What changed / why it mattered / what was decided next. Terse, dated, checkable.
- **Publication rule:** a log entry is a *release record* — the same class of factual claim as `universe.ts` `state[]`, which ships via reviewed PR. The first-person *essays* in `/notes` keep their stricter dual gate (Blake must read each one). The log file header states this boundary; the PR lists every entry so Blake reviews the claims before merge.
- **Data model:**

```ts
type LogEntry = {
  slug: string;
  date: string;                // ISO literal, human-typed — never the clock
  title: string;
  product: string;             // product slug | "site" | "studio"
  kind: "release" | "defect" | "decision" | "milestone" | "lesson";
  what: string;                // what changed
  why: string;                 // why it mattered
  next: string;                // what Blake decided next
  evidence?: Evidence[];       // same Evidence type as the universe
};
```

- **Tests** (`tests/dev-log.test.ts`): dates are ISO literals; newest-first order; every `product` resolves to a universe slug or site/studio; `what`/`why`/`next` all non-empty; no launch language; no unsourced statistics (same banned list); slugs unique; specific numeric claims carry evidence.
- **Seed content:** ~12 entries backfilled from July 2026's verifiable record (Stripe live mode, Trendi 118 → 120/121/122, Career Forge release + checkout closure, the release-truth reconciliation, the front office + its 63/100 audit, Koi Cave's first operator receipt, YKB's comeback-bonus truth bug, the studio's sales-packet + CRM-auth releases). The page lede states plainly that entries before July 26 were backfilled from release records on July 26.
- **Routing:** `/log` joins `DEV_ROUTES` (host-rewritten like the rest), the dev sitemap, and both navs.

---

## 6. Smallest valuable first slice (this PR)

1. Truth refresh: `universe.ts` (+ pinned-fact test updates) and `now.ts` — **required before 2026-07-27 regardless of any redesign.**
2. `concierge` product entry + its visual world.
3. `stageFamily` display layer; stage chips on homepage cards and `/products`.
4. `lib/dev/log.ts` + `/log` + tests + homepage strip.
5. Homepage: "How I build" loop section (absorbing the principles), "Start here" six paths.
6. This document.

**Deferred to later missions:** per-product page deep-refresh beyond status/evidence; `/log` filtering by product; control-room visual pass; `/about` extension; RSS/changelog feed; anything Reach Back (blocked on Blake's paragraph).

## 7. Standing asks for Blake

1. **Project Reach Back:** one honest paragraph → it enters the constellation at the true stage.
2. **Field notes:** five essays remain held for your read; approving any lights up `/notes` and the homepage writing section.
3. **Cadence:** the freshness budgets now do their job — Trendi-speed products need a weekly look. The log makes that a two-minute edit, and I maintain it each session I'm invoked.
