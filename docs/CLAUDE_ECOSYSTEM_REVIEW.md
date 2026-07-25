# Koinophobia Labs Ecosystem Review — Independent Audit

**Date:** 2026-07-17 (evening, America/Chicago)
**Reviewer:** Claude (independent design + infrastructure review; no changes made)
**Scope:** koinophobialabs.com, koinophobia.dev, repo `koinophobia-labs/koinophobia-labs-site`, Vercel project `koinophobia-labs`

Verification methods: `git fetch` + branch/merge-base analysis of the authoritative checkout; Vercel API (project, deployment list, current production deployment); rendered browser inspection of both live domains at 320/375/768/1280 (spot checks at other widths); full HTTP crawl of both domains (status, titles, canonicals, redirects, sitemap, robots, link check); code audit of the working tree (`d083a97`) and `origin/main` (`fe8cfc9`).

---

## 1. Executive Verdict

**Is the two-domain strategy correct?** Yes. "Labs shows what Blake can build for a client; .dev shows what Blake has built as a founder" is the right split, and the commercial rebuild proves the .com half of it works. The strategy is not the problem.

**Is the current implementation achieving it?** Half of it. koinophobialabs.com now does its commercial job well — honest, priced, restrained. **koinophobia.dev does not exist as a product portfolio.** It is a single networking card (`/connect`) plus a résumé, served from the *same deployment* as the commercial site via a host-scoped root redirect. There are no `/products/*` case studies, no You Know Ball presence at all on the founder page, and no independent identity (no own sitemap, robots, or navigation). Meanwhile, the founder-first, product-theater homepage that .dev needs was actually built — but it was built as the **koinophobialabs.com homepage on `main`**, where it was wrong (its `<title>` literally leads with "Career Forge beta"). The ecosystem currently has the right content for both domains, deployed to the wrong places, on two divergent branches.

**Is the live ecosystem ready for prospects, employers, collaborators?** Prospects: conditionally — the commercial site is credible today but is one `git push` away from being silently reverted (see below). Employers/collaborators: the .dev page works as a business card, not as the promised portfolio.

**Largest current risk:** **Production is serving an unmerged feature branch promoted by CLI.** All six domains alias a `source: "cli"` deployment of `codex/commercial-proof-rebuild` @ `d083a97` (promoted 2026-07-18 03:39 UTC). The Vercel project remains git-connected with `productionBranch: main`, and `origin/main` (`fe8cfc9`) does **not** contain the rebuild. The next push to `main` — any push, by any agent or session — auto-deploys `main` and silently replaces the entire commercial site with the old founder-editorial homepage. This exact revert already happened once tonight in the other direction: `main`'s 02:55 UTC auto-deploy was overwritten by the CLI promotion 44 minutes later. Until the branches are reconciled, production is unstable by construction.

---

## 2. What Is Actually Live

| Item | Value |
|---|---|
| Live domains | koinophobialabs.com, www.koinophobialabs.com, koinophobia.dev, www.koinophobia.dev, koinophobia-labs.vercel.app (+1 project alias) |
| Deployments | **One single deployment serves all domains** — `dpl_NTZhkbeA6EEJbcDjdfjJVxwpRKGj` |
| Source | **Vercel CLI promotion (`source: "cli"`, actor "codex")** — not the git integration |
| Branch / commit | `codex/commercial-proof-rebuild` @ `d083a97` — **not merged to main** |
| `origin/main` | `fe8cfc9` — 9 commits of branding/visual-worlds work **not in production** |
| Merge-base | `e47014d` (2026-07-13 narrative pass); the two lines diverged from there (main +9 / rebuild +2) |
| Local checkout | `~/Documents/Codex/2026-07-11/you-are-finishing-the-existing-stripe/koinophobia-labs-site`, on `codex/commercial-proof-rebuild`, clean except untracked `.claude/` |
| Primary purpose (live) | Commercial studio site (services-first) on .com; `/connect` founder card on .dev |
| Major live routes | `/`, `/services`, `/work`, `/work/[slug]`×3, `/process`, `/about`, `/products`, `/audit`, `/intake`, `/trendi`, `/you-know-ball/{play,privacy,support,safety}`, `/connect`, `/resume`, `/crm/*` (gated), `/payment/*`, `/demos/[slug]` |
| Stale/conflicting behavior | `main`'s koi brand system (BrandLogo/BrandIntro, `/brand/social-card`, `/brand/apple-icon`, `manifest.ts`, brand.css, founder-editorial/career-forge/product-worlds CSS) is **not live anywhere public**; conversely `robots.ts`, `sitemap.ts`, and the whole commercial surface exist **only** on the rebuild branch |

Domain routing is two `vercel.json` redirect rules — `koinophobia.dev/` → `/connect` (**307, temporary**) and `www.koinophobia.dev` → apex (308). There is no middleware and no host-based content isolation: **every commercial route is reachable on koinophobia.dev and every founder route on koinophobialabs.com.** Canonical tags mitigate this for the main pages (commercial → .com, `/connect` + `/resume` → .dev), but `/you-know-ball/*`, `/crm`, `/payment/*` have **no canonicals** and are indexable duplicates on both hosts. `www.koinophobialabs.com` serves 200 without redirecting to the apex.

Real deployment history tonight (UTC): `main` auto-deploy `fe8cfc9` 02:55 → CLI preview `ad554f6` 03:35 → CLI production promote 03:35 → preview `d083a97` 03:39 → **CLI production promote 03:39 (current)**.

---

## 3. Design Review

Scores are 1–10, deliberately not inflated. "What prevents higher" is the point of each.

| Dimension | Score | Blunt reasoning |
|---|---|---|
| Brand identity | **6** | The koi mark, dark foundation, mono uppercase kickers, and chip labels do read as one family across both properties. But the *official* brand system (approved koi lockup, entry animation, social-card and app-icon routes, manifest) is stranded on `main` and not live; production runs the older gold koi mark. Two accent systems (studio purple vs. founder coral/pink) coexist with no documented relationship — it works by luck, not governance. |
| Commercial credibility | **7** | Genuinely good: pricing on the homepage, honest "concept build" labeling everywhere, restrained motion, working FAQ, six-step process, schema.org markup. Held back by: the only "work" being three fictional businesses (transparently labeled, but still zero external proof), the /audit money page living on a *different* design system than the rest of the funnel, and copy defects on that page ("report.This is" missing a space; an unexplained "he" in the hero — "The email named one problem he could see from outside" reads like it was lifted from a specific outreach email and pasted into a general landing page). |
| Developer credibility | **4** | /connect is a well-made *card*, and /resume is solid. But for the stated job — product founder portfolio — there is nothing to inspect: no case studies, no screenshots, no architecture, no release evidence, no testing story, and **You Know Ball (the deepest engineering effort in the portfolio, 500+ tests) is not mentioned on the founder page at all.** GitHub is one link. A recruiter who clicks around runs out of content in ninety seconds. |
| Visual differentiation | **6** | The studio (restrained purple) and founder (editorial coral) worlds are genuinely distinct, and /trendi is a legitimately strong product world. But the differentiation is an *accident of accretion* — /audit (commercial) wears the founder system; /trendi and /you-know-ball/play carry their own navs; the deliberate product-world system (`product-worlds.css`) sits unmerged on `main`. |
| Navigation clarity | **6** | The StudioNav (Services/Work/Products/Process/About + audit CTA) is exactly right. But leave the homepage funnel and the chrome changes underneath you: /audit and /trendi replace the nav with a "← KOINOPHOBIA LABS" escape hatch, /connect has no nav to the rest of .dev (there is no "rest"), and a visitor on koinophobia.dev browsing /services sees commercial pages on the wrong host with no signal of the transition. Three Nav implementations and three Footer implementations exist in the codebase. |
| Mobile quality | **5** | Commercial pages are solid at 320–768 (clean hamburger menu, sensible stacking; hero headline is ~8 lines at 375px — heavy but not broken). The founder page is buggy: at 375px the bio paragraph renders in a **125px-wide column** (1–2 words per line) and the portrait is displaced by the gradient card; at 320px the "I build systems that create leverage" gradient headline is **clipped mid-word** ("systen", "levera"). These are the pages recruiters see on phones. |
| Accessibility | **5** | Good bones: aria-labels on the menu toggle, real form labels, honeypot rather than CAPTCHA, `qa-a11y.mjs`/`contrast-check.mjs` scripts exist in-repo. Held back by: low-contrast mono kickers (muted violet on near-black), text over animated gradients on founder/audit pages, no visible skip link, and no evidence the a11y scripts gate anything. Not audited to WCAG here — score reflects observed risk, not a formal pass/fail. |
| Product presentation | **5** | Split verdict. On .com the product cards are exactly right (concise, honestly labeled "Internal Product · Live MVP / Working Demo"). /trendi as a product world is an 8. But Career Forge — the flagship "live MVP" — has **no page anywhere** and is linked out to a `*.vercel.app` URL, You Know Ball's presence is a bare /play page plus legal pages, and the portfolio-grade presentation built on `main` is not live. |
| Client-service presentation | **7** | Services, pricing tiers with ranges and timelines, process, revisions/ownership/support language, and the intake form are all present and coherent. Weakest links: the /audit landing page (off-system, copy bugs, unstyled input fields — borderless transparent inputs vs. the properly styled /intake form) and no explicit "what happens if Blake is unavailable" answer anywhere. |
| Overall polish | **6** | The studio surface is close to an 8 by itself; the ecosystem average is dragged down by the off-system money page, founder-page mobile defects, `/crm` title duplication ("… | Koinophobia Labs | Koinophobia Labs"), unbranded default 404s, and the /work/[bad-slug] 404 rendering with no visible 404 copy. |

---

## 4. Information Architecture Review

**Where each category of content should live:**

| Content | Correct home | Current location | Verdict |
|---|---|---|---|
| Services, pricing, process, FAQ | koinophobialabs.com | ✅ there (live) | Correct |
| Concept builds / client work | koinophobialabs.com `/work` | ✅ there (live) | Correct |
| Product **teasers** (proof of capability) | koinophobialabs.com `/products` | ✅ there (live) | Correct — keep concise |
| Product **case studies / worlds** | koinophobia.dev `/products/*` | ❌ don't exist; nearest equivalents are `/trendi` on .com and stranded `main` homepage sections | **The core IA gap** |
| Founder identity / résumé | koinophobia.dev | ✅ `/connect` + `/resume` | Correct but thin |
| Live product apps | Operational domains (TestFlight, career-forge app, /you-know-ball/play) | Mixed | Acceptable; CF's `*.vercel.app` URL is the weak point |
| Legal/support (YKB privacy/support/safety) | Stable URLs, never moved | `/you-know-ball/*` on .com | **Must not move** — these are almost certainly referenced by App Store submission metadata |
| CRM, payments, intake API | .com only, non-indexed | ✅ (robots-disallowed, gated) | Correct |

**One app or two?** Today, one Next.js app serves both domains with two redirect rules. That was fine when .dev was one page. It is the wrong architecture for the stated strategy, for concrete reasons observed live:

- **Route leakage both ways** (commercial pages 200 on .dev, founder pages 200 on .com). Canonicals patch most of it; four route groups have no canonicals at all.
- **Single sitemap/robots**: `robots.ts` and `sitemap.ts` hardcode koinophobialabs.com. koinophobia.dev has no sitemap of its own, and the .com sitemap claims `/connect` and `/resume` while those pages' canonicals point at .dev — Google receives contradictory signals.
- **Single metadata/OG system, single analytics stream, single CSS bundle** — every commercial page ships founder/trendi CSS and vice versa (9 global stylesheets, ~12.5k lines).
- Host-based routing in Next (middleware rewrites into route groups) is *possible* but is the highest-maintenance option: every new page must remember its host, previews get ambiguous, and local dev needs host spoofing.

**Recommendation:** keep **one repo**, split into **two Vercel projects** (two Next.js apps — `studio` and `dev` — with a small shared brand/token package). Each domain gets its own sitemap, robots, canonicals, analytics, and 404. The .dev app is small (6–8 routes) and is mostly *new* content anyway, so the split costs little migration. Until the .dev app exists, the current single-app setup is acceptable **if** the canonical/sitemap contradictions and missing canonicals are fixed.

**Proposed routes** (matches Blake's proposal, with corrections):

- .com: `/ /services /work /work/[slug] /process /about /audit /intake /products` (products stays as a *teaser* page whose cards link to koinophobia.dev case studies + live apps). `/revenue-leak-audit` → 308 to `/audit`. `/you-know-ball/*` legal routes stay on .com permanently (App Store stability) even after the split.
- .dev: `/ (founder) /products /products/career-forge /products/trendi /products/you-know-ball (/products/koi-cave later) /about /resume /connect` — with `/` becoming a real homepage (the `main` founder-editorial work is 80% of this) rather than a redirect to /connect.
- Cross-links: .dev routes commercial intent to koinophobialabs.com/audit (already does); .com routes product-depth clicks to .dev.

**Can users answer the key questions?**
Commercial site: What does it sell / cost / how does delivery work / how do I start — **yes, clearly**. What has it built for businesses vs. what is concept — **yes**, the labeling is exemplary. On the developer site: Who is Blake / how do I reach him — yes. What has he built, what did he own, what's live vs. beta, what's the engineering depth — **no**; the content doesn't exist yet.

**Duplicated/contradictory content found:** two overlapping concept datasets (`lib/commercial.ts` `workProjects` vs. `lib/demoConcepts.ts` `/demos/[slug]` — same three fictional businesses in two systems); `/audit` + legacy `/revenue-leak-audit`; three Nav and three Footer implementations; the two divergent homepages on the two branch lines.

---

## 5. Product Placement Matrix

| Product | Business teaser (.com) | Developer case study (.dev) | Live product destination | Current status (verified) | Recommended changes |
|---|---|---|---|---|---|
| **Career Forge** | ✅ Live card, honestly labeled "Internal Product · Live MVP" | ❌ None anywhere (main's `HomeCareerForge` is a homepage section, not a case study) | `career-forge-lite.vercel.app` (200) | Live public-beta web MVP with Stripe packaging work | Highest-priority case study on .dev (it has the richest commercial story: licensing, pilots, acceptance scripts). Put the app on a custom domain (`careerforge.koinophobia.dev` or similar) — a `*.vercel.app` URL undercuts both properties. |
| **Trendi** | ✅ Card, "Internal Product · Working Demo" | ⚠️ `/trendi` product world exists but lives on the **.com** domain with canonical → labs.com | TestFlight (invite-only; page says "Available through TestFlight," honest) | iOS beta (build 115 lineage) + polished web presentation | Move the product world to `koinophobia.dev/products/trendi`; keep the .com card. Its canonical currently cements the wrong domain. |
| **You Know Ball** | ✅ Card, "Internal Product · Live Web MVP" | ❌ **Absent from the founder page entirely** | `/you-know-ball/play` (200, works) | Live web MVP + iOS build 26 shipped to TestFlight lineage, 500+ tests | The most technically defensible product Blake has (multi-sport debate engine, tournament gates, safety systems) and the least presented. Full case study on .dev. Keep `/you-know-ball/{privacy,support,safety}` URLs frozen on .com. |
| **Koi Cave** | ❌ none | ❌ none | none (repo: certified-with-limitations, deployment gap) | Not public | Correctly absent. Add a .dev case study only when there's something to show; no business teaser. |
| *(demos: Blackline Ritual / Iron Method / Forge & Foam)* | ✅ `/work` + `/work/[slug]` as labeled concepts | n/a — these are client-facing concepts, not products | `/demos/[slug]` interactive previews | Fictional concept builds, transparently labeled | Keep on .com only. Consolidate `demoConcepts.ts` into `commercial.ts` so the same fictional business isn't defined in two data systems. |

The internal-product vs. client-proof distinction **is currently obvious and well-executed on .com** — the "Original software, not client proof" framing, the sidebar disclaimer, and the status chips do exactly what the strategy requires. The failure is on the other side: the products' *depth* (the thing .dev exists to show) is either unbuilt, stranded on `main`, or parked on the wrong domain.

---

## 6. Infrastructure Review

**Architecture at the time of this review:** one git-connected Vercel project (`prj_vrNiN0q9…`, productionBranch `main`, Next.js 15/Turbopack, `nodejs` lambdas in iad1), one Next.js app, domain behavior implemented entirely as two `vercel.json` redirects. `next.config.ts` is trivial (`images.unoptimized: true`). No middleware. DB migrations ran inside `vercel-build` (`migrate-crm.mjs` before `next build`); the 2026-07-25 release-boundary update below replaces that behavior.

**Main risks, in order:**

1. **Divergent production (critical).** Production = CLI-promoted unmerged branch; `productionBranch` = main; main ≠ production content. Any main push reverts the live site; any rebuild-branch push updates previews nobody is watching. This already caused one same-night overwrite. Additionally, CLI promotions bypass the PR/review flow entirely.
2. **Migrations on every deploy with no rollback story.** `vercel-build` runs DB migrations; a bad merge deploy can mutate the production DB. Rollback via Vercel restores code, not schema. (Migrations are append-only so far; risk is procedural, not observed.)

   **Release-boundary update (2026-07-25):** PR #40 removes migrations from
   `vercel-build` and replaces that path with an explicit, environment-guarded,
   database-identity-verified, transactional migration command. Preview and
   ordinary production builds are application-build-only.
3. **Per-endpoint CRM auth.** `verifyCrmSession` is correctly called in all current CRM pages/routes (HMAC-SHA256, timing-safe, httpOnly/secure/strict cookies) — but there is no central middleware guard, so the next CRM route someone adds is unprotected by default.
4. **In-memory rate limiting** on `/api/intake` (Map keyed by IP, 5/10min) resets per serverless instance/cold start — it's a speed bump, not a limit. Honeypot + validation are the real defenses; fine at current traffic, insufficient if the site gets promoted hard.
5. **Sprawl.** 15+ stale branches (`agent/*` ×7 for the logo/intro alone, `design/*`, `media/*`, `backup/*`, `audit/founding-funnel-production-probe`), two overlapping concept data systems, three nav/footer systems, 12.5k lines of accreted global CSS across 12 files with explicit patch-layers (`founder-brand-refresh` → `founder-polish` → `you-know-ball-home-fix`). This is textbook "multiple sites sewn together," and it is the direct cause of the /audit page wearing the wrong design system.

**Maintainability:** `lib/commercial.ts` as single-source-of-truth for the commercial surface is genuinely good (sitemap and pages both consume it; publishing rules documented in `COMMERCIAL_PROOF_GAPS.md`). Everything outside the studio system is archaeology.

**Deployment safety:** currently poor (risk #1). After reconciliation it's fine: git-integration auto-deploy from main with preview branches is the correct setup for a solo operator — the CLI-promotion habit is the thing to stop.

**Domain-routing quality:** minimal but functional; the 307 (should be 308 once /connect is confirmed permanent), the non-redirecting www.koinophobialabs.com host, and the four canonically-unprotected route groups are the concrete defects.

---

## 7. Performance, Accessibility, SEO, Security

**Performance** (qualitative; no Lighthouse run was performed in this audit):

| Finding | Severity |
|---|---|
| `images.unoptimized: true` disables Next image optimization site-wide; homepage twitter card asset is a **923KB PNG**; portrait/brand PNGs served raw | Medium |
| 9 global stylesheets (~12.5k lines) loaded on every route — every commercial visitor downloads founder+trendi+CRM CSS and vice versa | Medium |
| Founder/audit pages composite large fixed radial-gradient fields; in the review harness, any programmatic scroll on /audit froze the compositor's captured frame (DOM stayed healthy; likely harness-specific, but the paint cost is real) | Low–Medium (verify on real mobile hardware) |
| ISR with 5-min revalidate + prerender: good; no render-blocking third-party scripts (there are *no* third-party scripts at all) | Positive |

**Accessibility:** see design score. Specific items: muted-violet kickers and gray-on-black body text in the founder system sit near contrast minimums; gradient-text hero on /connect clips at 320px (also an a11y failure — content loss); form labels and aria attributes are present; `/work/[bad-slug]` 404 renders visually empty (screen-reader users get a titled page with no h1/no content).

**SEO:**

| Finding | Severity |
|---|---|
| Sitemap lists `koinophobialabs.com/connect` + `/resume` while those pages canonical to `koinophobia.dev` — contradictory signals for the two pages that define the founder's search identity | **High** |
| `/you-know-ball/*` (4 pages), `/payment/*`, `/crm` have no canonicals and are live on both hosts — indexable duplicates | Medium |
| Homepage (and /services /work /process /about /products) missing `og:image` — twitter:image only, so LinkedIn/Slack/iMessage shares render imageless. The fix (`/brand/social-card` route) exists on `main`, unmerged | **High** for a site whose leads arrive via shared links |
| www.koinophobialabs.com serves 200 without host redirect (canonical mitigates) | Low |
| koinophobia.dev root redirect is 307 (temporary) — tells crawlers the .dev root has no stable content | Medium |
| `/intake` is robots-disallowed yet is the primary conversion target of every CTA; harmless for ads, but Google can't see or index the conversion page | Low (flag as deliberate-or-not) |
| Live titles/descriptions on .com are correctly *studio*-framed. The Career-Forge-first title exists only on unmerged `main` — do not ship it to .com during reconciliation | Note |
| koinophobia.dev has zero owned sitemap/robots identity; "Blake Taylor" search equity rests on two canonical tags | Medium |

**Security:**

| Finding | Severity |
|---|---|
| Stripe webhook signature verification correct; CRM cookie auth HMAC + timing-safe; no secrets in git; `.env*` ignored; robots + noindex on /crm; API methods restricted (GET /api/intake → 405, body-less) | Positive |
| No central auth guard for `/crm/*` (per-page checks only) — one forgotten check = exposed admin page | Medium |
| Rate limiting is per-instance in-memory; no spam protection beyond honeypot on a mailto-fallback form | Low–Medium |
| `sk_live` previously transited chat transcripts (prior sessions); key roll was recommended then and there is no evidence it happened | Medium (operational hygiene, outside this codebase) |
| Public GitHub repo contains full CRM/proposal/payment implementation — by design (portfolio), but means admin route shapes are public knowledge; defense rests entirely on the secret | Informational |

---

## 8. Commercial Trust Review (skeptical-buyer read)

As a tattoo-shop / barbershop / gym owner: the site answers **what it costs** ($250 audit, $149–$499, $499–$1,200, $1,500–$3,500, custom AI work), **how long it takes** (2–3 days → 1–3 weeks), **what I own afterward** ("documented access and handoff", ownership language in process), **what happens after intake** ("Blake reviews fit and replies with the smallest sensible next step. Nothing is charged by this form."), and **scope/revision discipline** ("No implementation starts until scope and price are approved. There are no hidden numerical claims, fake discounts, or forced retainers."). That is more than most solo studios publish. The audit-fee-credit mechanic is a good de-risking move.

What still reads thin to a skeptic:

- **All the "work" is fictional.** The labeling is honest to a fault — but the honest label also confirms there are zero client engagements. The disclosure ("building its external client portfolio in public") is the right play; it will carry the site for the first clients, not beyond. The concept builds *help* trust (they demonstrate craft and the labeling demonstrates integrity); they cannot substitute for one real before/after.
- **Deposit/payment expectations are not stated publicly** (the Stripe deposit flow exists; the site never says "50% deposit" or equivalent).
- **Bus factor is unaddressed**: nothing answers "what happens when Blake is unavailable / sick / gone." One FAQ line about handoff docs + code ownership would cover it.
- **Third-party costs** (hosting, domains, Stripe fees, API usage for AI workflows) are not mentioned anywhere.
- The /audit landing page — the page cold outreach lands on — is the *least* trustworthy-looking page in the funnel: different chrome, unstyled form inputs, and the two copy defects noted above. That is exactly backwards.

No invented claims found: no client counts, no revenue-lift numbers, no testimonials, no logos. `COMMERCIAL_PROOF_GAPS.md` documents evidence rules that most real agencies don't hold themselves to. This is the strongest thing about the site.

---

## 9. Developer Portfolio Review

**Recruiter:** finds a striking card, a location, a LinkedIn/GitHub/email, and a real résumé (with PDF). Ninety seconds of content. No shipped-work evidence beyond three one-line product cards; **no You Know Ball**, no TestFlight links, no screenshots, no "what I personally built." Verdict: memorable business card, not a portfolio. The mobile defects (125px text column at 375, clipped headline at 320) land on exactly this audience.

**Product leader:** the "operating idea" framing (friction → leverage) is genuinely differentiated positioning — most portfolios don't have a thesis. But there is no case-study depth behind it: no decisions, no tradeoffs, no metrics, no post-mortems. The thesis is asserted, not demonstrated.

**Technical collaborator:** one GitHub org link. No architecture, no testing story (the repos have 400–500-test suites that would impress — invisible), no release evidence (TestFlight builds, live deployments — invisible).

**Other founders:** the strongest audience today — the card communicates taste and the koi identity is memorable. Routing back to the commercial site works (audit card + Koinophobia Labs link).

The materials to fix all four exist: `main`'s founder-editorial homepage, the product visual worlds, the /trendi page, and the memory-documented release evidence. They need to be assembled on .dev, not designed from scratch.

---

## 10. Branch Reconciliation Review

**State (verified):** `origin/main` = `fe8cfc9` (main +9 over merge-base `e47014d`: koi brand system, entry animation, founder-first hero, Career Forge homepage promotion + beta-claims fix, product visual worlds, cohort link). `codex/commercial-proof-rebuild` = `d083a97` (+2: the entire commercial surface, `lib/commercial.ts`, studio components, robots/sitemap, analytics bridge, OG asset, 54-test commercial suite). Production serves the latter; the project's production branch is the former. Local `main` is 31 commits behind origin (stale but not diverged). Untracked `.claude/` in the working tree is ignored-tooling debris — safe, keep untracked. Stale branches: ~15 (`agent/*`, `design/*`, `media/*`, `backup/*`, `feature/*`, `fix/*`, one `audit/*` probe) — none dangerous, all clutter; do not delete during the audit.

**Hard conflicts on merge** (files modified on both sides since `e47014d`): `app/page.tsx`, `app/layout.tsx`, `app/trendi-feature.css`, `app/crm/layout.tsx`, `components/Nav.tsx`, `components/Footer.tsx`, `components/home/{HomeHero,HomeNav,HomeProof,HomeFooter}.tsx`. The homepage is a philosophical conflict, not a textual one: main's founder-editorial home vs. the rebuild's studio home. **Per the two-domain strategy, the studio homepage wins on .com** — and main's homepage content is precisely the raw material for the future .dev homepage, so it must be *preserved*, not discarded.

**Safest reconciliation path (recommended, in order):**

1. **Freeze pushes to `main`** (and stop all CLI production promotions) until reconciliation lands. This is the single most important operational rule right now.
2. Cut `reconcile/studio-plus-brand` from **`origin/main`** (per repo history, always branch from origin, not local).
3. Merge `codex/commercial-proof-rebuild` into it (no history rewrite). Resolve: homepage/layout/nav → **rebuild (studio) versions**; keep from main → `components/brand/*`, `app/brand/*` routes, `brand.css`, `manifest.ts`, the koi lockup assets, and the beta-claims-corrected Career Forge copy. Park main's founder-editorial homepage components (`components/home/*`, `founder-editorial.css`, `career-forge-home.css`, `product-worlds.css`) in the tree unused (or a `dev-portfolio/` staging directory) for the .dev build — do not delete them in the merge.
4. Wire the recovered brand into the studio shell where cheap: BrandLogo in StudioNav, `/brand/social-card` as `og:image` across commercial pages (fixes the High-severity OG gap), manifest + apple-icon.
5. Run the full gate (`test:commercial` + `test:crm` + `test:ykb` + `test:trendi`, lint, build) — note `test:commercial` is *not* part of `test:crm`'s aggregate; run it explicitly.
6. PR → merge to `main` → let the **git integration** auto-deploy production. Verify live, then confirm `main` == production == the only lineage. From then on, normal push-to-deploy is safe again.
7. Only after that: branch cleanup (archive/delete the ~15 stale branches) and the .dev split.

Alternative rejected: fast-forwarding main to the rebuild (`git push origin d083a97:main` after merging main *into* the rebuild branch) — same end state but inverts review flow and makes the brand-recovery deltas harder to see in one PR.

---

## 11. Prioritized Recommendations

### Critical before more promotion

1. **Reconcile `main` and production** (Section 10). Until then, any main push silently reverts the commercial site. Nothing else on this list matters while this is true.
2. **Stop CLI production promotions**; production changes go through main via PR only.
3. **Fix the /audit money page**: mount it on the studio design system (StudioNav/StudioFooter), style the form inputs (compare /intake, which is correct), fix "report.This is" and the orphaned "he" sentence. This is the page paid outreach lands on.
4. **Resolve the sitemap/canonical contradiction** for `/connect` + `/resume`, add canonicals to `/you-know-ball/*`, `/payment/*` (or noindex the latter), and ship an `og:image` for the commercial pages (main's `/brand/social-card` route does this).
5. **Fix /connect mobile defects** (125px text column at 375px; clipped gradient headline at 320px) — recruiters and QR-code scans are overwhelmingly mobile.

### High impact

6. **Build koinophobia.dev as a real (small) portfolio site**: founder homepage (recycle main's editorial work), `/products/{career-forge,trendi,you-know-ball}` case studies (the evidence — test counts, releases, architecture — already exists in repos/memory), keep `/connect` as the card and `/resume` as-is. This is the entire second half of the strategy and it is currently 10% built.
7. **Split into two Vercel projects** (one repo) when the .dev app is built: own sitemap/robots/canonicals/404/analytics per domain; kill cross-host route leakage; change the .dev root redirect to a real homepage.
8. **Put Career Forge on a custom domain** and move the Trendi product world (and its canonical) to .dev.
9. **Make analytics real**: the AnalyticsBridge currently dispatches to gtag/plausible **that are never loaded — every event is a no-op in production.** Smallest useful model: load one provider (Plausible or Vercel Analytics), keep the existing commercial events, add `intake_start`/`intake_submit`, `service_view`, and on .dev `resume_view`/`product_case_view`/`live_product_click`/`email_click`, with a host/property dimension. Nothing more.
10. **Central CRM guard**: move `verifyCrmSession` into middleware (or a shared layout-level server check) so new CRM routes are protected by default.
11. Answer the three missing trust questions on .com: deposit/payment expectations, third-party costs, "what if Blake is unavailable."

### Useful polish

12. `/revenue-leak-audit` → 308 redirect to `/audit`; www.koinophobialabs.com → 308 to apex; .dev root redirect 307→308 (or better, remove once .dev has a homepage).
13. Branded 404 (both hosts), fix the empty `/work/[bad-slug]` 404, de-duplicate the `/crm` title, give `/payment/*` pages real titles.
14. Consolidate `demoConcepts.ts` into `lib/commercial.ts`; delete the two unused Nav/Footer systems and the patch-layer CSS files as pages migrate; archive the ~15 stale branches.
15. Re-enable Next image optimization (or pre-compress the 923KB OG PNG and portrait assets).
16. Homepage mobile hero: tighten the 8-line headline at 375px.
17. Roll the live Stripe key (prior-session hygiene item; unverified as done).

---

## 12. Recommended Final Architecture

```
Repo: koinophobia-labs/koinophobia-labs-site (monorepo)
├─ apps/studio        → Vercel project A → koinophobialabs.com (www → apex 308)
│   Routes: / /services /work /work/[slug] /process /about /audit /intake
│           /products (teaser cards → .dev case studies + live apps)
│           /you-know-ball/{privacy,support,safety} (frozen legal URLs)
│           /crm/* /api/* /payment/* /demos/[slug]
│   Own: sitemap, robots (disallow /crm /api), canonicals → .com,
│        og:image via /brand/social-card, analytics property "studio"
├─ apps/dev           → Vercel project B → koinophobia.dev (www → apex 308)
│   Routes: / (founder editorial) /products /products/career-forge
│           /products/trendi /products/you-know-ball [/products/koi-cave]
│           /about /resume /connect
│   Own: sitemap, robots, canonicals → .dev, analytics property "dev"
└─ packages/brand     → koi assets, color tokens, type scale, chip/kicker
                        primitives shared by both apps
Deployment: both projects git-connected, productionBranch main, PR-only,
            no CLI promotions. DB (CRM) stays with apps/studio.
Live apps:  careerforge.koinophobia.dev (or .com) · TestFlight (Trendi/YKB)
            · koinophobialabs.com/you-know-ball/play
Cross-domain: .dev → "Hire the studio" → koinophobialabs.com/audit
              .com /products cards → koinophobia.dev/products/* case studies
```

Interim (until apps/dev exists): current single app, with reconciliation done, canonicals/sitemap fixed, and the .dev root redirect left in place.

---

## 13. Go / No-Go Decisions

| Decision | Verdict | Why |
|---|---|---|
| Send small-business prospects to koinophobialabs.com | **CONDITIONAL GO** | The live site is honest, priced, and credible enough to convert a warm prospect today. Conditions: (a) reconciliation done or a hard freeze on main pushes — otherwise the site can vanish mid-campaign; (b) /audit page fixed (it's the landing page for exactly these prospects). Without those two, treat it as NO-GO for *paid or bulk* outreach; one-off warm intros are fine right now. |
| Send recruiters to koinophobia.dev | **CONDITIONAL GO** | As a contact card + résumé behind a QR code: it works and looks distinctive — GO. As "my developer portfolio": NO — there is nothing to evaluate and the mobile bugs land on this exact audience. Fix /connect mobile first (days), and don't describe it as a portfolio until the /products case studies exist. |
| Publish the ecosystem publicly (active promotion) | **NO-GO** | Production is an unmerged CLI deploy that any main push reverts; the OG-image gap means shared links render bare; the .dev half of the story isn't built. Promotion multiplies traffic into an unstable deployment. Reconcile first — it's days, not weeks. |
| Begin another design sprint | **NO-GO** | Design is not the bottleneck; both design systems needed are already built (studio + brand/editorial). Another design pass now would add a fourth CSS layer to the pile. The only design-adjacent work justified is defect-fixing (items 3, 5, 16). |
| Begin another infrastructure sprint | **GO** | This is the correct next sprint, tightly scoped: reconcile branches → recover brand assets → fix canonicals/sitemap/OG → make analytics real → then the two-project split alongside building apps/dev. |

---

## Appendix: Defects log (verified live)

| # | Where | Defect |
|---|---|---|
| D1 | Vercel | Production = CLI deploy of unmerged branch; productionBranch=main diverged (9 vs 2 commits since `e47014d`) |
| D2 | /audit | Off-system page chrome (no StudioNav/Footer); unstyled borderless form inputs (contrast: /intake) |
| D3 | /audit copy | "prioritized report.This is" (missing space); "one problem **he** could see" (orphaned outreach pronoun) |
| D4 | /connect @375 | Bio paragraph renders in ~125px column (1–2 words/line); portrait displaced by gradient card |
| D5 | /connect @320 | Gradient hero headline clipped mid-word ("systen", "levera") |
| D6 | SEO | Sitemap claims labs.com/connect+/resume; canonicals claim koinophobia.dev — contradiction |
| D7 | SEO | No og:image on / /services /work /process /about /products (twitter:image only) |
| D8 | SEO | /you-know-ball/* ×4, /crm, /payment/* live on both hosts with no canonicals |
| D9 | Redirects | www.koinophobialabs.com no host redirect; .dev root redirect 307 (temporary) |
| D10 | Analytics | trackStudioEvent fans out to gtag/plausible; no provider script loaded → all events no-ops |
| D11 | 404s | /work/[bad-slug] renders empty (no h1/copy, homepage title); global 404 unbranded; /payment/* generic titles; /crm title doubled |
| D12 | Founder page | You Know Ball absent from /connect; Career Forge links to *.vercel.app |
| D13 | Perf | images.unoptimized; 923KB OG PNG; ~12.5k lines of CSS global on all routes |
| D14 | Harness note | Programmatic scroll on /audit froze captured frames in the review browser (DOM healthy; verify paint cost on real mobile hardware; likely harness artifact) |
