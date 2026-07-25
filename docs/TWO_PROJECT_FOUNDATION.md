# Two-Project Foundation — koinophobialabs.com / koinophobia.dev

Status: **approved architecture, not yet executed.** This document is the
foundation for the split described in `docs/CLAUDE_ECOSYSTEM_REVIEW.md` §12.
Production today is ONE Next.js app on ONE Vercel project serving both
domains; do not begin the split until the koinophobia.dev portfolio content
(product case studies) is ready to build.

## Target architecture

```
Repo: koinophobia-labs/koinophobia-labs-site (npm workspaces)
├─ apps/studio        → Vercel project "koinophobia-labs" (existing)
│                       Domains: koinophobialabs.com, www (308 → apex)
├─ apps/dev           → Vercel project "koinophobia-dev" (new)
│                       Domains: koinophobia.dev, www (308 → apex)
└─ packages/brand     → shared koi assets, color tokens, chip/kicker primitives
```

## Route ownership after the split

| Route | Stays on studio (.com) | Moves to dev (.dev) |
|---|---|---|
| `/ /services /work* /process /about /audit /intake` | ✅ | |
| `/products` (teaser cards) | ✅ links out to .dev case studies | |
| `/crm/* /api/* /payment/*` + Postgres + Stripe | ✅ (only the studio app gets DATABASE_URL/STRIPE/RESEND env) | |
| `/you-know-ball/{privacy,support,safety,play}` | ✅ **frozen URLs** — likely referenced by App Store metadata; never move or rename | |
| `/ (founder editorial homepage)` | | ✅ new — replaces the current root 307 → /connect |
| `/products/career-forge /products/trendi /products/you-know-ball [koi-cave]` | | ✅ new case studies |
| `/trendi` product world | redirect → koinophobia.dev/products/trendi | ✅ content moves |
| `/connect /resume` | redirect → koinophobia.dev equivalents | ✅ move as-is |

## What in this repo already belongs to apps/dev

Kept in-tree by the reconciliation merge specifically as raw material:

- `components/home/*` (HomeHero, HomeServices, HomeCareerForge, HomeProof,
  HomeFounder, HomeAudit, HomeNav, HomeFooter) — main's founder-editorial
  homepage, currently unused by any route
- `app/founder-editorial.css`, `app/career-forge-home.css`,
  `app/product-worlds.css` — the editorial + product-world visual systems
- `components/TrendiFeature.tsx`, `components/YouKnowBall*.tsx`,
  `app/trendi/*` + `app/trendi-feature.css`, `app/trendi-hero-visual.css`
- `components/brand/*`, `app/brand/*`, `public/brand/*` → these graduate to
  `packages/brand`
- `app/connect/page.tsx`, `app/resume/page.tsx`, `lib/founderHub.ts`,
  `lib/resume.json`, `scripts/generate-resume-pdf.py`

Known dead files (delete during the split, not before): 
`app/founder-brand-refresh.css`, `app/founder-polish.css` (imported nowhere;
superseded by `founder-editorial.css`), `app/home.css` (old homepage),
`lib/demoConcepts.ts` + `/demos/[slug]` (fold into `lib/commercial.ts` or
retire).

## Execution order (when the portfolio content exists)

1. Convert the repo to npm workspaces; move the current app into
   `apps/studio` **in one commit with no code edits** so git history follows.
2. Update the existing Vercel project's Root Directory to `apps/studio`
   (Settings → General). Deploy and verify BEFORE touching domains.
3. Scaffold `apps/dev` (Next.js, no DB, no Stripe) with the routes above,
   consuming `packages/brand`.
4. Create Vercel project `koinophobia-dev` (same repo, Root Directory
   `apps/dev`, production branch `main`).
5. Move the `koinophobia.dev` + `www.koinophobia.dev` domains from the
   studio project to the dev project (Vercel dashboard → Domains, or
   `POST /v10/projects/{dev}/domains` after `DELETE` on the studio project).
   Do this last — until then .dev keeps serving the studio app's /connect.
6. Add cross-domain redirects in `apps/studio/vercel.json`:
   `/connect`, `/resume`, `/trendi` → the .dev equivalents (308).
7. Each app owns its own `robots.ts`, `sitemap.ts`, canonicals, 404, and
   Vercel Analytics property. Remove the `/connect` + `/resume` canonical
   special-cases from the studio app.

## Guardrails (agreed 2026-07-17)

- Production deploys from `main` via the git integration only. **No
  `vercel deploy`/CLI promotions** — that is what caused the divergent
  production this sprint repaired.
- `vercel-build` is application-build-only. Database migrations are a separate,
  explicitly approved release action with target and connected-database
  identity checks. Never wire migrations into either app's build.
- The dev app must not receive CRM/Stripe/Resend/DB env vars.
