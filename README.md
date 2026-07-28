# Koinophobia Labs + Founder OS

[![CI](https://github.com/koinophobia-labs/koinophobia-labs-site/actions/workflows/ci.yml/badge.svg)](https://github.com/koinophobia-labs/koinophobia-labs-site/actions/workflows/ci.yml)

One Next.js codebase powers two connected public surfaces:

- [koinophobialabs.com](https://koinophobialabs.com) — the studio front office for websites, AI workflows, audits, inquiries, proposals, and payments
- [koinophobia.dev](https://koinophobia.dev) — Blake Taylor's living Founder OS: products, build log, experiments, current priorities, résumé, and release evidence

The shared idea is simple: turn messy workflows into useful systems, then make the product state and proof inspectable.

## What this repository demonstrates

- a dual-domain product architecture with host-specific routing
- public studio acquisition and a founder portfolio from one deployment
- structured intake, concierge routing, CRM persistence, and proposal workflows
- Stripe Checkout with signed webhooks, idempotent event handling, and payment-state persistence
- staged Google authentication with an exact administrator allowlist
- secret and sensitive-pattern redaction before CRM and email persistence
- rate limiting, trusted-origin checks, deduplication, and preview isolation
- an evidence-backed product status model with freshness budgets and explicit limitations
- targeted regression suites for commercial, security, CRM, concierge, product, and Founder OS behavior

## Product surfaces

| Surface | Purpose | Representative routes |
| --- | --- | --- |
| Studio | Diagnose business friction and route the right engagement | `/`, `/audit`, `/intake`, `/concierge` |
| Founder OS | Show what Blake is building, testing, learning, and shipping | `/products`, `/log`, `/lab`, `/now`, `/about`, `/resume` |
| Private operations | Manage leads, proposals, audits, and payment state | `/internal/*`, protected API routes |

## Architecture

| Layer | Technology and responsibility |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS, Framer Motion, shared design tokens, host-specific product worlds |
| Data | PostgreSQL with explicit migrations and environment guards |
| Authentication | NextAuth with staged Google authentication and an administrator allowlist |
| Payments | Stripe Checkout, raw-body webhook signature verification, idempotent event storage |
| Documents | `pdf-lib` for founder sales packets and résumé artifacts |
| Quality | Node test runner through `tsx`, Playwright QA scripts, lint, typecheck, production build |
| Deployment | Vercel with production, preview, and exact-host behavior |

## Trust boundaries

This codebase treats commercial and portfolio claims as product behavior, not marketing decoration.

- Visitor free text is redacted for high-signal secrets before supported persistence and email sinks.
- Intake requests use origin checks, platform-derived client identity, rate limits, and deterministic deduplication.
- Stripe webhooks are signature-verified and processed idempotently.
- Private CRM routes require staged authentication and exact administrator authorization.
- Preview and production database behavior is explicitly separated.
- Product pages carry evidence, current reach, verified dates, and `not yet` limitations.
- Public client claims are not invented or published without evidence and permission.

See:

- [Founder OS governing plan](docs/FOUNDER-OS.md)
- [CRM Google authentication boundary](docs/CRM_GOOGLE_AUTH.md)
- [Database migrations](migrations)

## Development

```bash
npm ci
npm run dev
```

Primary verification:

```bash
npm run lint
npm run typecheck
npm run test:crm
npm run test:concierge
npm run test:commercial
npm run test:dev-routing
npm run test:now
npm run test:migrations
npm run build
```

Some routes require environment variables for connected services. Follow the linked boundary documents and use test-mode credentials before enabling payment or private CRM behavior.

## Ownership and AI collaboration

Blake Taylor is the founder, product owner, and final approver. AI coding agents contribute implementation, inspection, testing, and documentation under Blake's direction.

The repository records AI co-authorship where applicable. Product decisions, release claims, tradeoffs, and final acceptance remain Blake's responsibility.

## Repository status

This repository is public for portfolio transparency and technical inspection. It is not an open-source product; no license is granted for reuse unless a license is added explicitly.

