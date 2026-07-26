import { getProduct, type Evidence } from "@/lib/dev/universe";

// The build log: the chronological record of what actually happened across
// Blake's products, the studio, and this site.
//
// Register rules — this file is a RECORD, not a diary:
//  1. An entry describes something that happened, with a date a human typed.
//     No roadmap items, no intentions dressed as events.
//  2. Specific claims carry `evidence` with checkable sources, exactly like
//     lib/dev/universe.ts. Numbers that can't point at an artifact don't ship.
//  3. Entries are the same class of factual claim as the universe's `state[]`:
//     they publish via a reviewed PR. The first-person ESSAYS in lib/dev/lab.ts
//     keep their stricter dual gate (Blake must read each one) — that boundary
//     is deliberate and this file must never become a way around it.
//  4. Nothing is ever deleted to make the record look better. A wrong entry is
//     corrected by a newer entry that says what was wrong.
//
// Entries dated before July 26, 2026 were backfilled on July 26 from release
// records — delivery logs, merged PRs, health endpoints, session reports. The
// /log page says so. Newest first. Bump `logLastUpdated` by hand.

export const logLastUpdated = "July 26, 2026";

export type LogKind = "release" | "defect" | "decision" | "milestone" | "lesson";

export const logKindLabel: Record<LogKind, string> = {
  release: "Release",
  defect: "Defect",
  decision: "Decision",
  milestone: "Milestone",
  lesson: "Lesson",
};

/** Non-product surfaces an entry may belong to. */
export const LOG_SURFACES = ["site", "studio"] as const;

export type LogEntry = {
  slug: string;
  /** ISO date, human-typed. Never generated from the clock. */
  date: string;
  title: string;
  /** A product slug from lib/dev/universe.ts, or "site" / "studio". */
  product: string;
  kind: LogKind;
  /** What changed. */
  what: string;
  /** Why it mattered. */
  why: string;
  /** What was decided next. */
  next: string;
  evidence?: Evidence[];
};

export const logEntries: LogEntry[] = [
  {
    slug: "founder-os-slice-one",
    date: "2026-07-26",
    title: "The site became a founder OS",
    product: "site",
    kind: "release",
    what: "Rebuilt the koinophobia.dev homepage as a control room — current focus, every product with its real stage, this log, and a start-here router by visitor type. Re-verified every product status against artifacts on the same day, because two of them were about to trip their own freshness alarms.",
    why: "The work was scattered across apps, chats, and release logs where nobody could see it. A founder's public record should be the evidence, not a summary of it.",
    next: "Keep the log alive with every working session, and get Project Reach Back into the constellation once there's a checkable paragraph of truth about it.",
    evidence: [
      {
        claim: "The statuses were about to go stale by the site's own rules",
        source:
          "lib/dev/universe.ts stage budgets: Trendi and You Know Ball carry 7-day windows, last verified 2026-07-20",
      },
    ],
  },
  {
    slug: "trendi-three-uploads",
    date: "2026-07-25",
    title: "Three TestFlight uploads in one evening — two of them fixes",
    product: "trendi",
    kind: "release",
    what: "Build 120 shipped Record Mode's beta package to TestFlight. The first pass on the phone found a paid-for coach script rendering as five empty sections — fixed in 121. Then the live camera preview showed sideways on the front sensor while recordings stayed upright — fixed in 122 by letting Apple's rotation coordinator drive the preview.",
    why: "Both defects were invisible in the simulator and surfaced within hours of a genuine install. Weeks of green automated runs had voted; the device decided.",
    next: "A deliberate on-device update pass and the focused record → playback → share gate list on build 122 before any external tester touches it.",
    evidence: [
      {
        claim: "All three builds were uploaded and accepted on July 25",
        source:
          "altool delivery UUIDs e5cbeefe (120), caa3229b (121), d811be60 (122); App Store Connect processed each VALID",
      },
      {
        claim: "The archives exist",
        source: "~/Library/Developer/Xcode/Archives/2026-07-25/Trendi-0.1.0-{120,121,122}.xcarchive",
      },
    ],
  },
  {
    slug: "studio-packets-and-crm-auth",
    date: "2026-07-25",
    title: "Sales packets, and a real login for the CRM",
    product: "studio",
    kind: "release",
    what: "Qualified studio leads now produce a founder-ready sales packet instead of a raw CRM row, and the private CRM moved from a shared secret to staged Google authentication.",
    why: "The gap between “a lead exists” and “Blake can walk into the conversation prepared” was manual work that happened at the worst possible time. And a shared secret is the kind of debt that gets more embarrassing the longer the CRM matters.",
    next: "Retire the legacy secret fallback entirely once the staged rollout proves out.",
    evidence: [
      {
        claim: "Both landed on main through reviewed PRs",
        source: "koinophobia-labs-site #40 (merge b0bfa8e) and #41 (merge 8018cdf), 2026-07-25",
      },
    ],
  },
  {
    slug: "koi-cave-operator-loop",
    date: "2026-07-23",
    title: "Koi Cave's operator loop closed for the first time",
    product: "koi-cave",
    kind: "milestone",
    what: "A typed command became a validated packet, passed an approval gate, ran a repo-inspection worker against the real Trendi checkout, and came back as a receipt that a separate validator re-checked from artifacts on disk. The worker cannot declare its own success.",
    why: "This is the difference between a notes app and an operator brain: work you can delegate and then verify without trusting the thing that did it.",
    next: "The loop stays unmerged until the human-hands gate runs — Blake typing the command into the composer himself. No more feature work before that.",
    evidence: [
      {
        claim: "The first live receipt exists with proof artifacts",
        source: "KOI_CAVE_OPERATOR_LOOP_V1_REPORT.md; receipt 7F044DA9, proof directory present 2026-07-26",
      },
    ],
  },
  {
    slug: "front-office-ships-and-gets-audited",
    date: "2026-07-21",
    title: "The koi got a front office — then an audit took it apart",
    product: "concierge",
    kind: "release",
    what: "Both sites' koi became a structured front desk: messy thought → one-question-at-a-time clarifying → an editable brief → an honest recommendation, with nothing sent before consent. Days later, a ten-journey walkthrough scored it 63/100 — the front door was hidden behind an unlabeled fish — and all nine defects it found were fixed and merged the same day.",
    why: "Conversion surfaces rot fastest, and the only way to know is to walk in as a stranger. The score wasn't the embarrassment; shipping without the walkthrough was.",
    next: "A five-human benchmark before the flow gets called done — automated self-scoring already fooled me once.",
    evidence: [
      {
        claim: "Shipped and fixed through reviewed PRs with verified production deploys",
        source: "koinophobia-labs-site #38 (front office) and #39 (all nine audit defects), merged 2026-07-21",
      },
      {
        claim: "The audit and fix list are on the record",
        source: "docs/FRONT_OFFICE.md and the 2026-07-21 ease-of-use audit (63/100 weighted, ten journeys)",
      },
    ],
  },
  {
    slug: "release-truth-reconciliation",
    date: "2026-07-20",
    title: "The site was wrong about my own products — in both directions",
    product: "site",
    kind: "lesson",
    what: "An audit of every product claim against artifacts found three of four statuses wrong, including an underclaim: the site said no You Know Ball build had ever been uploaded, while Apple's own 409 logs named two it had already accepted. Every status now carries a verification date and evidence, and the test suite fails when either goes stale.",
    why: "Writing status from memory produced both flattery and false modesty. Confident self-criticism turned out to be as unreliable as confident marketing — and harder to catch, because nobody fact-checks the sentence that makes you look bad.",
    next: "Statuses only move when someone looks at artifacts, and the freshness budgets make “someone looked” a dated, testable claim.",
    evidence: [
      {
        claim: "The full audit trail is in the repo",
        source: "docs/RELEASE-TRUTH-RECONCILIATION.md, committed with PR #36",
      },
    ],
  },
  {
    slug: "career-forge-closes-checkout",
    date: "2026-07-20",
    title: "Career Forge closed its own store",
    product: "career-forge",
    kind: "decision",
    what: "An audit found the $49 fulfillment path ran entirely in the buyer's browser — close the tab on the way back from Stripe and the license was never issued, with nothing recording it. Checkout was closed the same day, and reopening was tied to a demonstrated end-to-end journey rather than to configuration.",
    why: "A checkout that refuses to open is a bad day. One that charges and delivers nothing is a refund, an apology, and someone's trust.",
    next: "Build the durable order store, then re-certify the journey on the deployed code. (Update, July 26: the store now exists and passes its health checks; the certification is pinned to an exact commit, so checkout stays closed until the journey is re-proven on the code that's running.)",
    evidence: [
      {
        claim: "The brake and its reason are live and inspectable",
        source:
          "career-forge-lite#28 (3c66a77); GET /api/commerce-health returns canSellSafely:false with the pinned-commit reasons, checked 2026-07-26",
      },
    ],
  },
  {
    slug: "dev-becomes-a-laboratory",
    date: "2026-07-20",
    title: "koinophobia.dev became a product laboratory",
    product: "site",
    kind: "release",
    what: "The personal site grew from four routes to a full universe: product pages with per-product visual worlds, honest stage + reach on everything, a lab of experiments, and its own sitemap. Every product status became a dated, evidenced claim.",
    why: "One click past the homepage, visitors used to land in studio chrome with contradictory labels. The two-site story broke exactly where curiosity started.",
    next: "Keep the universe as the single source of truth — every other surface renders from it or disagrees with it loudly in tests.",
    evidence: [
      {
        claim: "Shipped as one reviewed PR",
        source: "koinophobia-labs-site #36, squash-merged 2026-07-20 (4adb896) with a verified production deploy",
      },
    ],
  },
  {
    slug: "career-forge-beta-one",
    date: "2026-07-19",
    title: "Career Forge v0.10.0-beta.1 ships",
    product: "career-forge",
    kind: "release",
    what: "The beta line went to production after a readiness sprint: early-win bullets so the first session produces something usable, and a first-run profile where nine fields became optional and collapsed.",
    why: "People were abandoning at a wall of empty textareas. Completion beats completeness — a shorter form that gets finished outperforms a smarter one that doesn't.",
    next: "Watch whether strangers finish the workflow, and treat the paid path as unproven until it's demonstrated end to end.",
    evidence: [
      {
        claim: "The release is tagged",
        source: "career-forge-lite tag v0.10.0-beta.1 at b1be8b2, deployed to career-forge-lite.vercel.app",
      },
    ],
  },
  {
    slug: "trendi-118-lands",
    date: "2026-07-19",
    title: "Trendi build 118 finally lands on TestFlight",
    product: "trendi",
    kind: "release",
    what: "After an Apple account permission stranded two finished builds for days, build 118 uploaded, processed clean, and installed from TestFlight.",
    why: "For days the testers' build was three releases behind the best one on this machine, and that gap was invisible from the outside. Shipping and delivering are different verbs.",
    next: "Close the clean-state isolation gate — which needs a second real Apple account — before calling any build the release candidate.",
    evidence: [
      {
        claim: "118 was installed from TestFlight",
        source: "TestFlight app page record: Version 0.1.0 (118), release date Jul 19 2026, 90-day expiry",
      },
    ],
  },
  {
    slug: "ykb-comeback-bonus",
    date: "2026-07-17",
    title: "You Know Ball promised a bonus it never paid",
    product: "you-know-ball",
    kind: "defect",
    what: "The +2 comeback bonus — an elite take while trailing big — turned out to be dead code behind a flag that nothing disables, while the result card kept promising it (and quoted the wrong number). Fixed by paying it as an independent modifier, with the copy and the mechanic reading from one constant. Verified on a real device through a save-preserving install: the mid-battle scene state survived the upgrade byte for byte.",
    why: "A promise in the UI is a claim about the system. If the copy and the mechanic can drift apart, the score stops being a score.",
    next: "The fix sits on the unmerged branch with the clutch-finish work; the release step is still a tester group, not more engine.",
    evidence: [
      {
        claim: "The fix is committed",
        source: "banter-bot-content-expansion commit 7fa7873 on feature/content-depth-expansion",
      },
    ],
  },
  {
    slug: "studio-live-payments",
    date: "2026-07-11",
    title: "The studio can take real money",
    product: "studio",
    kind: "milestone",
    what: "Stripe moved from a test sandbox to the live account: a durable webhook endpoint, live keys in production, and the CRM's proposal → deposit flow verified end to end with a real checkout session — tamper and replay checks included.",
    why: "An intake pipeline that ends at “we'll invoice you somehow” isn't a pipeline. The studio can now be paid the moment the work is agreed.",
    next: "Say it plainly on the record: infrastructure that CAN take payment is not a customer. The proof this system is waiting for is a signed engagement, not a webhook.",
    evidence: [
      {
        claim: "The live webhook endpoint exists and processed real events",
        source:
          "Stripe live endpoint we_1TsDzb… at koinophobia.dev/api/stripe/webhook; a real checkout.session.expired was delivered and replay-verified 2026-07-11/12",
      },
    ],
  },
];

/** Newest-first is the file's contract; this just refuses to render a mistake. */
export const orderedLogEntries = [...logEntries].sort((a, b) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
);

export const latestLogEntries = (count: number) => orderedLogEntries.slice(0, count);

/** Display name for an entry's surface: a product name, this site, or the studio. */
export const logProductLabel = (entry: LogEntry): string => {
  if (entry.product === "site") return "This site";
  if (entry.product === "studio") return "The studio";
  return getProduct(entry.product)?.name ?? entry.product;
};
