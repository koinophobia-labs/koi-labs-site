import { LINKS } from "@/lib/links";

// Stable source of truth for the koinophobia.dev product universe.
// The dates below are literal claims: move them only after checking evidence.

export const universeLastUpdated = "July 27, 2026";
export const statusOwner = "Blake Taylor";

export type Reach = "public" | "limited" | "internal";

export const reachLabel: Record<Reach, string> = {
  public: "Anyone can use it",
  limited: "Invite / beta only",
  internal: "Runs for me only",
};

export type Stage =
  | "concept"
  | "local"
  | "internally-validated"
  | "release-candidate"
  | "uploaded"
  | "internal-testers"
  | "external-testers"
  | "public"
  | "paused";

export const stageLabel: Record<Stage, string> = {
  concept: "Concept / experiment",
  local: "Local development",
  "internally-validated": "Internally validated",
  "release-candidate": "Release candidate",
  uploaded: "Uploaded, accepted by Apple",
  "internal-testers": "Available to internal testers",
  "external-testers": "Available to external testers",
  public: "Publicly available",
  paused: "Paused",
};

export const stageRank: Record<Stage, number> = {
  concept: 0,
  paused: 0,
  local: 1,
  "internally-validated": 2,
  "release-candidate": 3,
  uploaded: 4,
  "internal-testers": 5,
  "external-testers": 6,
  public: 7,
};

export type StageFamily = "exploring" | "building" | "testing" | "live" | "paused";

export const stageFamily: Record<Stage, StageFamily> = {
  concept: "exploring",
  local: "building",
  "internally-validated": "building",
  "release-candidate": "testing",
  uploaded: "testing",
  "internal-testers": "testing",
  "external-testers": "testing",
  public: "live",
  paused: "paused",
};

export const stageFamilyLabel: Record<StageFamily, string> = {
  exploring: "Exploring",
  building: "Building",
  testing: "Testing",
  live: "Live",
  paused: "Paused",
};

export const STAGE_FRESHNESS_DAYS: Record<Stage, number> = {
  "release-candidate": 7,
  uploaded: 7,
  "internal-testers": 7,
  "external-testers": 14,
  public: 30,
  "internally-validated": 30,
  local: 30,
  paused: 90,
  concept: 90,
};

export type Evidence = {
  claim: string;
  source: string;
};

export type ProductIdentity = {
  theme: "forge" | "signal" | "arena" | "cave" | "studio";
  register: string;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  identity: ProductIdentity;
  reach: Reach;
  stage: Stage;
  status: string;
  verifiedAt: string;
  evidence: Evidence[];
  problem: string;
  thesis: string;
  state: string[];
  decisions: Array<{ call: string; why: string }>;
  learned: string;
  actions: Array<{ label: string; href: string; external?: boolean; primary?: boolean }>;
  notYet: string[];
};

export const products: Product[] = [
  {
    slug: "career-forge",
    name: "Career Forge",
    tagline: "The job-search system I needed the week I lost my job.",
    identity: { theme: "forge", register: "Structural · built under pressure" },
    reach: "public",
    stage: "public",
    status:
      "Live on the web and free to use. Checkout is closed while the signed owner-approval boundary is rebuilt on current main and the paid journey is re-certified.",
    verifiedAt: "2026-07-27",
    evidence: [
      {
        claim: "The current hardened product line is merged",
        source:
          "career-forge-lite PR #48 merged as 909a5bb on 2026-07-24 after typecheck, lint, unit, browser, recovery, commerce-journey, and production-build checks.",
      },
      {
        claim: "The durable order store exists while checkout remains closed",
        source:
          "GET /api/commerce-health checked 2026-07-26: durable_store and store_reachable passed; the deployed commit no longer matched the pinned certification and authorization.",
      },
      {
        claim: "The stale approval-boundary branch was retired without losing the requirement",
        source:
          "career-forge-lite PR #39 closed unmerged on 2026-07-27; issue #49 now requires a fresh current-main rebuild, migration rehearsal, owner key ceremony, and exact-commit certification.",
      },
    ],
    problem:
      "A job search turns evidence, deadlines, interviews, and follow-ups into scattered documents at the moment a person has the least room for confusion.",
    thesis:
      "Useful career software should organize evidence a person actually has, preserve its provenance, and never invent experience to make a draft sound stronger.",
    state: [
      "The free beta is publicly reachable and the deterministic résumé path remains usable.",
      "Application lifecycle, Role Sprint provenance, undo safety, interview outcomes, backup, and recovery were hardened through the merged PR #48 line.",
      "The order store now has durable PostgreSQL-backed state, but paid checkout remains closed.",
      "The earlier signed-approval implementation is historical evidence, not mergeable release code. Issue #49 is the active security obligation.",
    ],
    decisions: [
      {
        call: "Keep the résumé path deterministic.",
        why: "A fluent invented claim is more dangerous than an awkward truthful one.",
      },
      {
        call: "Retire the stale security PR instead of forcing a rebase.",
        why: "Security code must be evaluated against the exact current fulfillment and certification surfaces it protects.",
      },
      {
        call: "Keep checkout closed until the owner boundary is proven.",
        why: "A payment path is not ready because the button works; authorization, delivery, recovery, and exact-release evidence all have to agree.",
      },
    ],
    learned:
      "A product can be usable for free while its commerce path remains correctly unavailable. Shipping the durable store solved one failure class, not the owner-authorization boundary.",
    actions: [
      { label: "Open Career Forge", href: LINKS.careerForge, external: true, primary: true },
    ],
    notYet: [
      "The signed owner-approval boundary has not been rebuilt on current main.",
      "The production-shaped role-separation migration and offline owner key ceremony have not run.",
      "The exact deployed paid journey has not been re-certified, so checkout remains closed.",
      "No confirmed job outcome has been attributed to the product.",
    ],
  },
  {
    slug: "trendi",
    name: "Trendi",
    tagline: "The gap between having an idea and pressing record.",
    identity: { theme: "signal", register: "Kinetic · spoken out loud" },
    reach: "limited",
    stage: "external-testers",
    status:
      "Build 122 is the latest evidenced TestFlight artifact, and an intended creator has now used the product and returned concrete workflow feedback.",
    verifiedAt: "2026-07-27",
    evidence: [
      {
        claim: "Build 122 is the latest evidenced TestFlight build",
        source:
          "July 25 delivery records identify builds 120, 121, and 122; App Store Connect reported build 122 READY_FOR_BETA_TESTING, with archive and IPA evidence checked 2026-07-26.",
      },
      {
        claim: "An outside creator has used the product",
        source:
          "Founder conversation record dated 2026-07-27: a content-creator user reported that onboarding slows intermediate and advanced users, the plus action can merge ideas, scripts need an episodic path, and onboarding over-biases outputs toward teaching.",
      },
      {
        claim: "The clean-state cross-account isolation gate remains open",
        source:
          "PENDING-beta-user-handoff.md was still marked PENDING with the second-account identity legs not run when checked 2026-07-26.",
      },
      {
        claim: "The production-security package is still a deliberate hold",
        source:
          "general-ai-command-center PR #4 remains a draft marked DO NOT MERGE OR DEPLOY until Apple, StoreKit, database, edge, concurrency, and release-operator gates have evidence.",
      },
    ],
    problem:
      "Creators often have the thought but lose momentum while turning it into words they can actually say on camera.",
    thesis:
      "The product should shorten the distance to recording without taking over the creator's judgment or forcing every idea into one content style.",
    state: [
      "The SwiftUI app turns a rough idea into hooks, a recordable script, a caption, and a shot plan.",
      "Build 122 contains the current evidenced Record Mode TestFlight line.",
      "The first intended-user feedback now replaces internal speculation as the next repair brief.",
      "The bounded repair slice is direct-to-content onboarding for experienced creators, separate-new-idea behavior, episodic scripting, and less permanent teaching bias from onboarding.",
      "The newer generation pipeline remains off in the shipping line while its reliability and security evidence are incomplete.",
    ],
    decisions: [
      {
        call: "Promote Trendi to external testing when a real creator supplied product feedback.",
        why: "A stage describes who has used the product, not how formal the testing program looks.",
      },
      {
        call: "Treat the feedback as one repair slice, not a redesign.",
        why: "The goal is to remove the friction the tester touched and return the product to the same person for another pass.",
      },
      {
        call: "Keep release security separate from copy quality.",
        why: "Better scripts do not close account isolation, StoreKit, concurrency, or deployment-provenance gates.",
      },
    ],
    learned:
      "The first outside feedback was not about prettier output. It was about speed, idea boundaries, format control, and the product teaching when the creator wanted to make.",
    actions: [
      { label: "Read the full Trendi story", href: "/trendi", primary: true },
      { label: "Ask for beta access", href: LINKS.email },
    ],
    notYet: [
      "Not on the App Store and not submitted for public review.",
      "One creator's feedback is not repeated usage, publishing evidence, or retention.",
      "The clean-state second-Apple-account isolation walkthrough has not run.",
      "The complete on-phone purchase, share, deletion, and endurance gate list is not closed.",
    ],
  },
  {
    slug: "you-know-ball",
    name: "You Know Ball",
    tagline: "Sports takes, scored honestly, by something that actually watches.",
    identity: { theme: "arena", register: "Scoreboard · argue and defend" },
    reach: "public",
    stage: "uploaded",
    status:
      "The web demo is public. Apple's delivery responses show builds 26 and 27 were accepted by Apple previously, but processing and tester assignment remain unverified.",
    verifiedAt: "2026-07-27",
    evidence: [
      {
        claim: "Apple had already registered builds 26 and 27",
        source:
          "The July 16 and July 19 upload responses returned previousBundleVersion 26 and 27, which identifies build numbers accepted by Apple before those attempts.",
      },
      {
        claim: "Distribution after upload is still unproven",
        source:
          "No surviving success receipt, processing record, tester-group assignment, or outside install has been produced; confirmed iOS testers remain zero.",
      },
      {
        claim: "The connected GitHub backup does not contain the current iOS line",
        source:
          "The koinophobia-labs/you-know-ball remote currently stops at the July 12 build-24 backup line; the build-27 content-depth work is documented as a separate local branch.",
      },
      {
        claim: "Build 27 ran locally without wiping the save",
        source:
          "The July 17 device session recorded version 0.1.0 (27) installed after a save-preserving container backup and comparison.",
      },
    ],
    problem:
      "Sports arguments disappear into group chats without a transparent score, a durable receipt, or any reason to defend the take well.",
    thesis:
      "The game should reward a defensible argument through rules a player can inspect, not a model's invisible preference.",
    state: [
      "The browser demo is playable without an account.",
      "The scoring engine is deterministic and keeps wagering recommendations outside the product.",
      "Apple's responses establish that build numbers 26 and 27 had been accepted, but no evidence establishes completed processing or tester distribution.",
      "The connected remote is a backup through build 24, while the newer build-27 lineage remains outside that repository.",
      "The next release task is repository durability and tester assignment, not another gameplay slice.",
    ],
    decisions: [
      {
        call: "Keep scoring deterministic.",
        why: "A player should be able to reconstruct why an argument won or lost.",
      },
      {
        call: "Separate Apple acceptance from distribution.",
        why: "An upload can exist while no player has ever received it.",
      },
      {
        call: "Back up the current lineage before more features.",
        why: "A polished local branch is still a single-machine failure mode.",
      },
    ],
    learned:
      "The release gap was not building the game. It was preserving the current line, confirming what Apple actually held, and assigning it to a person.",
    actions: [
      { label: "Play the web demo", href: "/you-know-ball/play", primary: true },
      { label: "Open the standalone build", href: LINKS.ykbDemo, external: true },
    ],
    notYet: [
      "Processing beyond Apple's accepted build-number evidence has not been confirmed.",
      "No iOS build has been assigned to a tester group.",
      "No outside player has installed the iOS build; confirmed testers remain zero.",
      "The current build-27 lineage is not yet mirrored in the connected GitHub repository.",
    ],
  },
  {
    slug: "concierge",
    name: "Labs Concierge",
    tagline: "An AI front desk that would rather refuse than guess.",
    identity: { theme: "studio", register: "Structured · consent-gated" },
    reach: "public",
    stage: "public",
    status:
      "Live on both sites as the studio front office. It routes structured conversations, but none has become a paid engagement.",
    verifiedAt: "2026-07-26",
    evidence: [
      {
        claim: "The front office is publicly reachable",
        source:
          "SSR verification on 2026-07-26 found the concierge experience on koinophobialabs.com and the founder site.",
      },
      {
        claim: "Qualified submissions can produce founder-ready packets",
        source:
          "koinophobia-labs-site PR #40 merged on 2026-07-25 with deterministic offer mapping, internal packet persistence, an editable unsent reply draft, and no customer-facing automatic send.",
      },
      {
        claim: "No routed conversation has become paid work",
        source:
          "Conversation and Gmail review through 2026-07-27 found outreach and a warm 7 Day Gallery lead, but no verified paid engagement from the concierge.",
      },
    ],
    problem:
      "A dead form removes context, while a loose chatbot can invent answers or commitments the business never made.",
    thesis:
      "A front desk should clarify, structure, and route from published facts, then wait for the visitor's consent.",
    state: [
      "The concierge runs on both public domains.",
      "Qualified intake can attach a founder-ready sales packet to the protected lead record.",
      "The packet remains internal, and the reply draft is editable and unsent.",
      "It has improved lead handling, not yet demonstrated revenue conversion.",
    ],
    decisions: [
      {
        call: "Use deterministic extraction before conversational help.",
        why: "Budgets, deadlines, and requested outcomes should not drift between messages.",
      },
      {
        call: "Keep customer communication human-approved.",
        why: "The system may prepare a reply, but it does not earn authority to send one.",
      },
    ],
    learned:
      "Internal sales infrastructure can be real and useful before it proves commercial conversion. Those are different claims and should stay separate.",
    actions: [
      { label: "Meet it on the studio site", href: LINKS.labs, external: true, primary: true },
    ],
    notYet: [
      "No lead routed through the concierge has become a paying engagement.",
      "The five-human ease-of-use benchmark has not run.",
      "The system only answers from published site data and refuses unknowns.",
    ],
  },
  {
    slug: "koi-cave",
    name: "Koi Cave",
    tagline: "A private operator brain that never leaves the machine.",
    identity: { theme: "cave", register: "Quiet · local-first, unlisted" },
    reach: "internal",
    stage: "internally-validated",
    status:
      "Internal macOS build only. It remains development-signed, un-notarized, and behind draft authorization remediation with a live HTTP drill still deferred.",
    verifiedAt: "2026-07-27",
    evidence: [
      {
        claim: "The app is not distributable to another Mac",
        source:
          "The July 26 signing check showed a development identity and Gatekeeper rejection; no notarized artifact or public download exists.",
      },
      {
        claim: "The operator loop produced a proof-checked receipt",
        source:
          "KOI_CAVE_OPERATOR_LOOP_V1_REPORT.md records receipt 7F044DA9 with validator-checked proof artifacts on disk.",
      },
      {
        claim: "Authorization remediation remains intentionally unmerged",
        source:
          "koinophobia-labs/koi-cave PR #1 remains a draft marked do not merge; its localhost HTTP approval drill and ordered follow-on reconciliation are deferred.",
      },
      {
        claim: "The mail path has never completed a real sync",
        source:
          "MORNING_FOUNDER_BRIEF_CERTIFICATION_REPORT.md and the local OAuth configuration show a client ID with no stored tokens.",
      },
    ],
    problem:
      "A personal operating system becomes a dependency when its context, memory, and automation live on someone else's server.",
    thesis:
      "Local-first infrastructure should produce receipts another validator can check and should require real authority before executing sensitive work.",
    state: [
      "The macOS app holds notes, tasks, memory, and local automation.",
      "The operator loop can turn a command into a validated packet and proof-checked receipt.",
      "The authorization remediation is a draft review package, not merged release code.",
      "The live mail integration has never synchronized, so founder briefs still depend on local state.",
    ],
    decisions: [
      {
        call: "Keep the system local-first.",
        why: "The privacy property should come from architecture rather than a hosted-service promise.",
      },
      {
        call: "Require separate validation receipts.",
        why: "A worker should not be able to grade its own completion claim.",
      },
      {
        call: "Keep sensitive authorization work in draft until the live drill runs.",
        why: "Library-level enforcement is useful evidence, but it is not the same as the real route accepting and rejecting requests correctly.",
      },
    ],
    learned:
      "The product's biggest truth gap is not its local reasoning. It is the uncompleted real integrations and release controls around that reasoning.",
    actions: [],
    notYet: [
      "No public build, download, waitlist, or notarized artifact exists.",
      "The authorization remediation is not merged.",
      "The live HTTP approval drill has not run.",
      "The mail integration has never completed a real sync.",
    ],
  },
];

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);

export type FreshnessResult = {
  product: string;
  stage: Stage;
  verifiedAt: string;
  ageDays: number;
  allowedDays: number;
  fresh: boolean;
  message: string;
};

export function checkFreshness(product: Product, now: number = Date.now()): FreshnessResult {
  const allowedDays = STAGE_FRESHNESS_DAYS[product.stage];
  const ageDays = Math.floor((now - Date.parse(product.verifiedAt)) / 86_400_000);
  const fresh = ageDays <= allowedDays;

  return {
    product: product.name,
    stage: product.stage,
    verifiedAt: product.verifiedAt,
    ageDays,
    allowedDays,
    fresh,
    message: fresh
      ? `${product.name} — stage "${product.stage}" verified ${product.verifiedAt} (${ageDays}d old, limit ${allowedDays}d).`
      : [
          `STALE STATUS: ${product.name}`,
          `  stage:        ${product.stage} (${stageLabel[product.stage]})`,
          `  verified at:  ${product.verifiedAt} — ${ageDays} days ago`,
          `  allowed age:  ${allowedDays} days for this stage`,
          `  what to do:   re-check ${product.name} against release artifacts`,
          `                (archives, Apple delivery logs, live HTTP, signing),`,
          `                update status/evidence if it moved, then set`,
          `                verifiedAt to today in lib/dev/universe.ts.`,
          `  do NOT just bump the date — the date is a claim that someone looked.`,
        ].join("\n"),
  };
}

export const staleProducts = (now: number = Date.now()) =>
  products.map((product) => checkFreshness(product, now)).filter((result) => !result.fresh);

export const arenaScoreboard = [
  { label: "Builds Apple accepted", value: "2" },
  { label: "Reached a tester", value: "0" },
  { label: "Outside players", value: "0" },
  { label: "App Store review", value: "None" },
];

export const studio = {
  name: "Koinophobia Labs",
  tagline: "The same operating idea, pointed at other people's businesses.",
  body: "Small businesses lose time and revenue through unclear sites, messy intake, and follow-up that lives in someone's memory. The studio applies the same tested operating ideas to client work.",
  href: LINKS.labs,
};
