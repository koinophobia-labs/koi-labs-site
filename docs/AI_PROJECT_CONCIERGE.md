# AI Project Concierge

## Product purpose

The AI Project Concierge is a finite qualification and routing layer for visitors who understand their business friction but do not know which Koinophobia Labs service fits. It does not replace the homepage, service catalog, Revenue Leak Audit, or standard project intake.

The public route is `/concierge`. Visitors can enter from the homepage, services page, intake page, or audit page and can choose the standard `/intake` form at any point.

The result is preliminary. Scope, fit, price, and timing are confirmed by Blake after review.

## Living koi companion

The concierge is also available as a restrained, contextual koi companion on the public Labs site. The companion is a second entrance to the same finite workflow, not a chatbot and not a second recommendation system.

- `components/companion/KoiCompanion.tsx` owns the small page-level trigger, route context, invitation limits, collision avoidance, and session preferences.
- `components/companion/KoiCompanionPanel.tsx` presents contextual quick actions and lazy-loads the existing `ConciergeFlow` inside a desktop side drawer or mobile bottom sheet.
- `lib/companion/page-context.ts` deterministically maps approved public routes to copy and actions. Unknown, private, transactional, CRM, and full-page concierge routes are suppressed.
- `lib/companion/session.ts` validates versioned session-only UI preferences: invitation count, cooldown, dismissal, and minimized state.
- `lib/companion/motion.ts` holds the bounded, pure motion math and the finite state machine (resting, drifting, noticing, inviting, listening, sleeping, avoiding, paused).
- `lib/companion/site-knowledge.ts` derives the assistant's knowledge — services, service comparison, relevant-work matching, page briefs, next steps, and free-text answers — **from `lib/commercial.ts`**, so nothing is hand-maintained and answers cannot drift from the published pages.
- `lib/companion/site-help.ts` is a thin back-compat adapter over `site-knowledge` (the `SITE_HELP_TOPICS` / `answerSiteQuestion` API).

The trigger can invite at most twice per browser session, observes a ten-minute invitation cooldown, and honors a 30-minute dismissal. **The koi is anchored, not a cursor follower.** It rests at a route-specific corner and drifts only within a small safe region (max 40px from its anchor). The pointer and scroll merely *influence* that drift within hard caps — a shy notice nudge (≤22px) when the cursor comes within 150px, a decaying scroll nudge (≤18px) — and the koi always eases back to its anchor. It never tracks the cursor across the viewport. `requestAnimationFrame` runs only while there is motion to resolve, so the koi rests the majority of page time. Drift freezes entirely while the visitor types, while a dialog is open, on touch devices, under reduced motion, and while the tab is hidden. A throttled collision guard hides the trigger if it would cover an interactive control.

The koi has no circular button backing. Its visual presence comes from the fish silhouette, a subtle body/tail swimming cycle, and two fading wake strokes. A smoothed heading calculation turns the fish and its wake toward its (small) movement vector using the shortest rotational path and eases upright at rest; the interactive hit target remains upright. Focus is visible through the cyan accessibility outline. The panel's entrance animates transform only — its opacity base is 1 — so a throttled/hidden tab can never freeze the dialog invisible.

Opening the panel first shows **page-aware copilot surfaces** distinct per route: "Understand this page" (a grounded brief + facts), "Compare two options" (a real side-by-side of two published services with an audit-first recommendation), "Find the closest work" (relevant concept builds ranked by capability), plus a smallest-sensible-next-step card that is not always a build. These sit alongside the site-question help and the concierge itself, so the koi helps a visitor understand the page before ever asking for project details.

The first invitation appears after six to nine seconds depending on page context and offers one route-relevant action: service comparison on `/services`, proof matching on `/work`, a concrete revenue-leak explanation on `/audit`, or a products-versus-client-services explanation on `/products`. After meaningful engagement on two commercial routes (at least eight seconds and 30% scroll depth on each), one invitation can offer to turn the visitor's exploration into a recommended project plan. The panel can also answer basic questions about services, published starting prices, typical timing, the Revenue Leak Audit, process, work examples, AI behavior, and contacting Blake. Answers are selected from reviewed local content and always link to a relevant public route. Unknown questions fall back to a capability boundary and the project concierge; no free-form model call, invented availability, or automatic quote is used.

The companion is mounted once in the root layout but is eligible only on the canonical Labs host, Labs-owned Vercel preview deployments, localhost, and a route allowlist. Preview support keeps draft PRs visually reviewable without enabling the companion on the separate `koinophobia.dev` site. It does not appear on CRM, API, payment, campaign, game, full-page concierge, or unknown routes.

Opening the workflow uses the same `ConciergeFlow`, deterministic evaluation endpoint, draft key, signed handoff, intake prefill, CRM persistence, and notification path as `/concierge`. Every answer edit is saved immediately to a versioned, tab-scoped `sessionStorage` draft with a 24-hour validity window. Minimizing, refreshing, navigating between pages, or continuing on the full page in that tab therefore preserves progress without creating a parallel source of truth or leaking one visitor's answers into a newly opened tab. The previous origin-wide `localStorage` draft is removed once during migration.

## User flow

The client presents seven truthful steps:

1. Primary problem and free-form description.
2. Adaptive current-process question based on the selected problem.
3. Operational or financial impact.
4. Desired practical outcome.
5. Business, industry, and optional website URL.
6. Budget and timing range.
7. Contact details.

The result explains the recommended starting service, confidence, deterministic reasons, expected intervention, assumptions, a possible alternative when appropriate, and one dominant next action.

Revenue Leak Audit results continue to the existing `/audit` intake anchor. Other viable services continue to `/intake` with an editable, locally recovered prefill. Manual-review and not-a-fit results remain respectful and allow a human review request.

## Architecture

The concerns are separated under `lib/concierge`:

- `types.ts`: shared contracts and service enums.
- `questions.ts`: adaptive prompts, public labels, and intake-field mapping.
- `validation.ts`: server-boundary parsing, length limits, enum checks, email checks, and public URL normalization.
- `routing.ts`: deterministic scoring, conflicts, confidence, reasons, and recommendation copy.
- `ai.ts`: optional server-only OpenAI Responses API enhancement with strict structured output.
- `evaluate.ts`: deterministic-first orchestration and AI fallback.
- `signing.ts`: HMAC-signed evaluation summary handoff.
- `session.ts`: versioned, tab-scoped 24-hour browser-draft validation and legacy cleanup.

Public and commercial integration points:

- `components/concierge/ConciergeFlow.tsx`: the finite accessible client workflow.
- `app/api/concierge/evaluate/route.ts`: validated, rate-limited, deduplicated evaluation.
- `components/acquisition/IntakeForm.tsx`: editable concierge prefill and stable idempotency key.
- `app/api/intake/route.ts`: server recomputation, persistence, and notification formatting.
- `lib/acquisition/leads.ts`: backward-compatible CRM persistence.
- `db/007_ai_project_concierge.sql`: JSONB lead envelope and operational indexes.

No chat framework or client-side model SDK is shipped.

## Service-routing rules

The typed service set is:

- `revenue_leak_audit`
- `website_rebuild`
- `ai_automation`
- `custom_product`
- `quick_fix`
- `manual_review`
- `not_a_fit`

The selected problem supplies the strongest auditable signal. Bounded keyword signals from the visitor's descriptions add evidence for website, workflow, product, quick-fix, or diagnostic work. Prompt-like instructions are removed from scoring input before classification.

The route becomes manual review when regulated or sensitive requirements appear, the highest services are too close, the selected category conflicts with a materially different scope, or evidence is too weak. Harmful requests and irreconcilable custom-product budget/timing combinations become not-a-fit.

Confidence is derived from score strength and the margin between the top two services:

- High: `0.80` or above.
- Medium: `0.60` through `0.79`; an alternative can be shown.
- Low: below `0.60`; human review is required.

Uncertain answers are intentionally capped and usually start with diagnosis rather than an implementation prescription.

## AI role and deterministic fallback

The deterministic route, confidence, reasons, next action, prices, URLs, and business rules are authoritative.

When `OPENAI_API_KEY` exists, the server sends only the minimum qualification context—never the visitor's name or email—to the OpenAI Responses API. The request uses:

- A strict JSON Schema.
- `store: false`.
- A hashed session safety identifier.
- Low verbosity and no tool calls.
- A four-second timeout per attempt by default, clamped to at most five seconds.
- At most two attempts for transient provider errors or timeouts.
- Runtime validation that rejects extra fields or malformed output.

AI may tighten the qualification summary and structured extraction. It cannot choose the service or control recipients, database objects, authentication, checkout IDs, raw HTML, or navigation.

With no key, the response source is `deterministic`. If the configured provider fails, it is `fallback`. In both cases the user receives a complete recommendation.

## Evaluation contract

The browser posts a validated body equivalent to:

```ts
type ConciergeEvaluationRequest = {
  sessionId: string;
  answers: ConciergeAnswers;
  currentStep: string;
  locale?: string;
};
```

The response includes extracted qualification fields, the deterministic recommendation, missing information, the recommendation source, and an optional signed evaluation token.

The token binds the session ID, normalized answer digest, issue time, source, and qualification summary. It expires after 24 hours. Production signing uses `CONCIERGE_SIGNING_SECRET` or the existing `CRM_ADMIN_SECRET` when it contains at least 32 characters.

The intake endpoint always overlays the visitor's editable final form values, revalidates all answers, and recomputes the recommendation. A stale or modified handoff invalidates the signed summary and falls back to a deterministic summary. Client-supplied recommendation fields are ignored.

## CRM and notification integration

Migration `007_ai_project_concierge.sql` adds `crm_leads.concierge_data jsonb` with a default empty object. Standard intake records remain compatible.

Concierge leads store:

- Source `ai_project_concierge`.
- Session ID.
- Recommended service and rule confidence.
- Recommendation reasons and source.
- Human-review flag.
- Qualification summary.
- Validated original/final answers.
- Primary problem, current tools, desired outcome, budget, timing, and website.

The CRM list adds a source badge and compact qualification signal. The lead detail page adds the summary, recommendation reasons, constraints, tools, and an expandable answer record while preserving existing status, follow-up, audit, proposal, and payment workflows.

The existing Resend notification path is extended with the same qualification data and a direct CRM link when a durable lead ID exists. All visitor content is HTML escaped.

## Analytics

The existing `trackStudioEvent` abstraction emits privacy-conscious events:

- `concierge_viewed`
- `concierge_started`
- `concierge_question_answered`
- `concierge_back_used`
- `concierge_standard_form_selected`
- `concierge_evaluation_requested`
- `concierge_recommendation_generated`
- `concierge_service_recommended`
- `concierge_human_review_requested`
- `concierge_intake_prefilled`
- `concierge_intake_submitted`
- `concierge_audit_cta_clicked`
- `concierge_error`
- `concierge_recovered_session`
- `koi_companion_viewed`
- `koi_companion_invitation_shown`
- `koi_companion_invitation_dismissed`
- `koi_companion_opened`
- `koi_companion_minimized`
- `koi_companion_action_selected`
- `koi_companion_page_understood`
- `koi_companion_services_compared`
- `koi_companion_relevant_work_selected`
- `koi_concierge_started`
- `koi_concierge_resumed`
- `koi_concierge_completed`
- `koi_standard_intake_selected`
- `koi_site_question_answered`

Properties are limited to step ID, entry page, recommended service, confidence band, recommendation source, and completion status. Raw visitor text, contact details, and business details are not sent to analytics.

Companion properties are likewise categorical: route context, action ID, interaction state, site-question topic, answer status, meaningful-route count, invitation kind, and whether an existing draft was resumed. Raw site questions are not sent to analytics. Invitation, dismissal, engagement, and answer-draft records remain in tab-scoped `sessionStorage`.

Compare concierge completion and submitted-lead rates with the existing standard intake. Segment by entry page, recommendation, confidence band, and prefill-to-submit conversion. Quality should also be reviewed manually through lead fit and eventual lifecycle outcome; a higher completion rate is not useful if qualification quality falls.

## Security and privacy controls

- Server-side shape, enum, email, URL, length, and combined-payload validation.
- Same-origin and `Sec-Fetch-Site` checks on public POST routes.
- Database-backed public rate limiting when the existing database is available, with a process-local fallback for local development.
- Honeypot spam defense.
- Stable concierge idempotency key and database dedupe constraint.
- Server recomputation of the final recommendation.
- HMAC-signed summary handoff.
- Model structured-output validation and fail-closed parsing.
- No client secret, raw model HTML, unsafe markdown, arbitrary model URL, or model-selected recipient.
- Escaped HTML email content and privacy-safe logs.
- Versioned, tab-scoped draft with a 24-hour validity window; submitted data is persisted to the CRM and the current tab's draft is cleared.

Visitors are explicitly told not to enter passwords, payment details, customer lists, protected health information, or other sensitive data.

## Accessibility and SEO

The flow supports keyboard activation, visible focus, semantic headings, labels, selected states with `aria-pressed`, live loading/error announcements, focused step headings, back navigation, reduced motion, and mobile touch targets. Color is not the only selected-state signal.

The concierge is intentionally indexed because it is distinct, useful commercial content rather than a duplicate form. It has a canonical URL, title, description, Open Graph URL, and sitemap entry. `/intake`, `/api`, and `/crm` retain their existing robots restrictions.

## Environment variables

```bash
# Existing infrastructure
DATABASE_URL=
CRM_ADMIN_SECRET=
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL="Koinophobia Labs Leads <leads@koinophobialabs.com>"
NEXT_PUBLIC_SITE_URL=https://koinophobialabs.com

# Deliberate migration invocation only; leave unset during builds/runtime.
ALLOW_DATABASE_MIGRATIONS=
DATABASE_PROVIDER=
DATABASE_URL_UNPOOLED=
EXPECTED_NEON_ENDPOINT_ID=
EXPECTED_DATABASE_NAME=
EXPECTED_DATABASE_ROLE=
TARGET_DATABASE_ENVIRONMENT=

# Optional AI enhancement
OPENAI_API_KEY=
CONCIERGE_OPENAI_MODEL=gpt-5.6-luna
CONCIERGE_OPENAI_BASE_URL=https://api.openai.com/v1

# Recommended separate HMAC secret; CRM_ADMIN_SECRET is the fallback
CONCIERGE_SIGNING_SECRET=
```

The deterministic concierge does not require `OPENAI_API_KEY`. CRM persistence still requires the existing production `DATABASE_URL`.

## Local development

```bash
npm ci
ALLOW_DATABASE_MIGRATIONS=true \
ALLOW_UNMARKED_LOCAL_DATABASE=true \
TARGET_DATABASE_ENVIRONMENT=development \
DATABASE_URL=postgresql://127.0.0.1:5432/koinophobia_local \
npm run db:migrate-crm
npm run dev
```

The local override is restricted to a `development` or `test` target and a
loopback PostgreSQL host. Shared Neon databases require an independently
supplied endpoint ID, the direct unpooled URL, the expected database name, the
approved migration role, and an exact target match. Application traffic may
continue using its pooled `DATABASE_URL`. Vercel builds never execute
migrations. See `docs/DATABASE_RELEASE_BOUNDARY.md`.

For UI-only local evaluation, the concierge route works without a database or
AI key. Final intake persistence requires the database.

## Testing

```bash
npm run test:concierge
npm run test:concierge:e2e
npm run test:koi-companion:e2e
npm run screenshots:koi
npm run test:crm
npm run test:migrations
npm run test:commercial
npx tsc --noEmit
npm run lint
npm run build
```

The browser suite expects the site at `CONCIERGE_QA_URL`, defaulting to `http://localhost:3100`. It covers website rebuild, automation, audit, quick fix, ambiguous/manual review, deterministic outage behavior, refresh recovery, editable intake prefill, mocked successful persistence, a 390px mobile journey, horizontal overflow, and an axe WCAG A/AA scan.

The koi suite expects a built site at `KOI_QA_URL`, defaulting to `http://localhost:3000`. It covers the route and host allowlists, anchored (non-chasing) desktop motion within its bounded region, deterministic site answers, invitation limits, dismissal, draft continuity, deterministic AI-unavailable completion, focus trapping and return, Escape, collision avoidance, reduced motion, horizontal overflow, WCAG A/AA, and Chromium/WebKit behavior. The capture script records the home page at 320, 390, 768, 1024, 1440, and 1920 pixels plus representative contexts and open-panel states.

## Known limitations

- The evaluation dedupe cache is process-local; the durable duplicate-submission guarantee is the CRM dedupe key.
- A real OpenAI provider call, production database migration, production Resend delivery, and production deployment require external credentials and are recorded separately in the launch gate.
- Automated accessibility checks do not replace manual screen-reader testing.
