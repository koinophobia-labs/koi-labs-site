import { LINKS } from "@/lib/links";

// Single source of truth for the koinophobia.dev product universe.
//
// Rules this file exists to enforce:
//  1. ONE status vocabulary. Before this file, the same product carried three
//     different status labels across /, /now and /resume.
//  2. Reach is a fact, not a mood. `reach` answers one question — who can use
//     this today, without asking Blake for anything?
//  3. `stage` never collapses distinct release states. "Release-ready",
//     "uploaded", and "in a tester's hands" are three different things, and
//     conflating them is how the site started lying the first time.
//  4. NOTHING here may be published without a source. Every product carries
//     `verifiedAt` and `evidence[]`, and tests/dev-universe.test.ts fails the
//     build if either is missing or stale.
//
// Reconciled 2026-07-20 against release artifacts, Apple delivery logs, and
// live HTTP checks (see docs/RELEASE-TRUTH-RECONCILIATION.md for that audit
// trail). Re-verified 2026-07-26 for the Founder OS pass: Trendi moved to
// build 122, Career Forge grew a durable order store behind its closed
// checkout, Koi Cave's operator loop produced its first proof-checked receipt,
// and the front office joined the universe as a product in its own right.
// Refreshed 2026-08-13 for the Trendi release pass: build 132 became the
// certified free-launch candidate, while You Know Ball's historical Apple
// acceptance was preserved without guessing at its current distribution state.

export const universeLastUpdated = "August 13, 2026";

/** Who owns keeping these statuses honest. Rendered nowhere; asserted in tests. */
export const statusOwner = "Blake Taylor";

/**
 * How stale a status may be before the test suite fails, BY STAGE.
 *
 * A single window was the wrong shape. Trendi moved through builds 114 → 119 in
 * eight days; a 45-day allowance would have let "uploaded" sit there as an
 * archaeological artifact while CI stayed green. The rule has to be tight where
 * things move fast and loose where they genuinely don't.
 *
 * Read it as: how long can this claim stay true without anyone looking?
 * A product mid-release can change under you in a day. A paused one can't.
 *
 * The policy lives here, next to the stages it governs, so the tests read it
 * rather than re-encode it.
 */
export const STAGE_FRESHNESS_DAYS: Record<Stage, number> = {
  // Actively moving through release. Anything here can be wrong tomorrow.
  "release-candidate": 7,
  uploaded: 7,
  "internal-testers": 7,
  // Real outside users, but changes arrive in batches rather than hourly.
  "external-testers": 14,
  // Live or settled, but still worth re-checking monthly.
  public: 30,
  "internally-validated": 30,
  local: 30,
  // Deliberately dormant. Re-checking weekly would be theatre.
  paused: 90,
  concept: 90,
};

/**
 * Who can use this today, with no help from me.
 *
 * public   — anyone can open it right now.
 * limited  — real outside users, but through an invite or a beta gate.
 * internal — it runs, and so far I'm the only one it runs for.
 */
export type Reach = "public" | "limited" | "internal";

export const reachLabel: Record<Reach, string> = {
  public: "Anyone can use it",
  limited: "Invite / beta only",
  internal: "Runs for me only",
};

/**
 * The release ladder. Deliberately granular: an artifact can be uploaded and
 * accepted by Apple while still being in nobody's hands, and that distinction
 * is the single most common place a status quietly becomes a lie.
 */
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

/** Rendering order, low to high. Used to sanity-check claims in tests. */
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

/**
 * The coarse, at-a-glance grouping over the fine ladder. Cards wear the family
 * chip; product pages print the precise stage beside it. The fine ladder stays
 * the source of truth — the family is a display projection, never a field a
 * product sets by hand (that would reopen the door to optimistic rounding).
 *
 * "archived" joins the day something is actually archived. An enum value with
 * no member is decoration.
 */
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

export type Evidence = {
  /** The specific claim this backs. */
  claim: string;
  /** Where it can be checked. A path, a log, an HTTP response — not a vibe. */
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
  /** One precise sentence. Never a marketing word. */
  status: string;
  /** ISO date the status was last checked against artifacts. */
  verifiedAt: string;
  /** What proves the current status. Rendered on the page. */
  evidence: Evidence[];
  problem: string;
  thesis: string;
  state: string[];
  decisions: Array<{ call: string; why: string }>;
  learned: string;
  actions: Array<{ label: string; href: string; external?: boolean; primary?: boolean }>;
  /** Things that are NOT true yet. Rendered verbatim, on purpose. */
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
      "Live on the web and free to use. Checkout is certification-pinned and currently closed: the deployed code has moved past the last certified commit",
    verifiedAt: "2026-07-26",
    evidence: [
      {
        claim: "The site is live and serving",
        source: "HTTP 200 from career-forge-lite.vercel.app, checked 2026-07-26",
      },
      {
        claim: "Checkout is closed, and closed for the pinned-certification reason",
        source:
          "GET /api/commerce-health (2026-07-26): canSellSafely:false; stripe_verified_certification and human_authorization both pin commit 28d3def while the deployment runs 909a5bb8",
      },
      {
        claim: "A durable order store now exists and answers",
        source:
          "commerce-health operational checks (2026-07-26): durable_store passed (neon-postgres), store_reachable passed with a round-trip write/read/delete",
      },
      {
        claim: "The beta line shipped July 19",
        source: "career-forge-lite origin/main b1be8b2, tagged v0.10.0-beta.1",
      },
      {
        claim: "Fulfillment could fail silently after payment, and checkout was closed because of it",
        source:
          "Audit 2026-07-20: live checkout returned a Payment Link and never learned the outcome. Brake merged as career-forge-lite#28 (3c66a77) and deployed",
      },
    ],
    problem:
      "When my DraftKings role ended I had the same problem everyone in that seat has: a hundred scattered applications, no feedback, and advice too generic to act on. The job search is the highest-stakes project most people ever run, and almost nobody runs it as a project.",
    thesis:
      "A résumé tool that invents experience is worse than no tool. The useful thing is not generation — it's organizing evidence you already have into something a stranger can evaluate in six seconds.",
    state: [
      "Live at career-forge-lite.vercel.app. A stranger can walk in, build a dossier, generate role-specific drafts, and export a real DOCX and ZIP without talking to me.",
      "Released to production on July 19, 2026 (v0.10.0-beta.1) after a readiness sprint: early-win bullets and a lighter first-run profile.",
      "The generation engine is deterministic. There is no model writing your history — every claim traces to something you entered.",
      "Checkout closed itself on July 20 and has stayed closed on purpose. The audit that day found the $49 fulfillment path ran entirely in the buyer's browser: close the tab on the way back from Stripe and the license was never issued, with nothing recording it.",
      "Since then the missing piece got built: a durable order store now passes the health check's round-trip. What hasn't happened is re-certification — the sales approval is pinned to the exact commit it certified, the code moved, so the store shut itself again. That reflex is the system working.",
    ],
    decisions: [
      {
        call: "Deterministic engine, no LLM in the résumé path.",
        why: "A hallucinated job title on a résumé is not a bug you can apologize for later. Giving up fluency to guarantee zero fabrication was the easiest trade I've made.",
      },
      {
        call: "Made the first-run profile shorter, not smarter.",
        why: "People were abandoning at a wall of empty textareas. Nine of them are now optional and collapsed. Completion beats completeness.",
      },
      {
        call: "Kept everything client-side — no accounts, no server-side career data.",
        why: "It's the right call for privacy and it's the reason I know almost nothing about how the product is actually used. I traded my own visibility for the user's, on purpose, and I'd make the trade again while admitting what it costs me.",
      },
      {
        call: "Closed checkout rather than leaving a warning next to a live buy button.",
        why: "The audit found a paying customer could get nothing and leave no trace. A checkout that refuses to open is a bad day; one that charges and delivers nothing is a refund, an apology, and someone's trust.",
      },
      {
        call: "Pinned the sales authorization to a commit hash.",
        why: "An approval that survives unrelated deploys isn't an approval, it's a permission slip that never expires. Every merge re-closes the store until a human re-certifies the journey on the code that's actually running.",
      },
    ],
    learned:
      "I built this for myself first, so every feature aimed at someone already motivated, and the hardest problems turned out to be the first ninety seconds rather than the output quality. The sharper lesson came later: I shipped a working payment button and never once asked what happens if the customer's browser doesn't come back.",
    actions: [
      { label: "Open Career Forge", href: LINKS.careerForge, external: true, primary: true },
    ],
    notYet: [
      "I cannot tell you whether anyone has ever paid. There is no order history from the pre-store era by design, so the only system that knows is Stripe, and I have not reconciled it. Treat “paying customers” as unestablished in both directions.",
      "Worse: before July 20 I could not have told you whether a payment failed to deliver either. Nothing logged it.",
      "The certified end-to-end journey hasn't been re-demonstrated on the current build, so checkout stays closed.",
      "I have collected zero beta feedback. It saves to the tester's own browser and never reaches me — a design decision I did not think through.",
      "No confirmed job outcome. Nobody has told me this got them hired.",
      "Lane suggestions still come from a fixed library, so an operations résumé gets tech-pivot lanes it didn't ask for. Known defect, not yet fixed.",
    ],
  },
  {
    slug: "trendi",
    name: "Trendi",
    tagline: "The gap between having an idea and pressing record.",
    identity: { theme: "signal", register: "Kinetic · spoken out loud" },
    reach: "internal",
    stage: "release-candidate",
    status:
      "Build 132 is the certified free-launch release candidate awaiting signing and App Store upload; build 122 previously reached internal TestFlight",
    verifiedAt: "2026-08-13",
    evidence: [
      {
        claim: "Build 132 is the exact current release candidate",
        source:
          "general-ai-command-center PR #6 at d347f0305f69675ba23cc94bf99f30c8d29af856; 0.1.0 (132), free launch with three Coach Packs per ISO week and no launch IAP or paywall, certified 2026-08-13",
      },
      {
        claim: "Build 132 has not crossed the Apple distribution gates",
        source:
          "No signed archive, exported IPA, App Store Connect upload receipt, processed-build record or tester assignment exists for d347f030 / build 132 in the 2026-08-13 release evidence",
      },
      {
        claim: "Build 122 previously reached internal TestFlight",
        source:
          "altool delivery UUIDs e5cbeefe (120), caa3229b (121), d811be60 (122); App Store Connect processed each VALID, with 122 READY_FOR_BETA_TESTING",
      },
      {
        claim: "The archives and release IPA exist on this machine",
        source:
          "~/Library/Developer/Xcode/Archives/2026-07-25/Trendi-0.1.0-{120,121,122}.xcarchive and ~/Documents/Trendi-122-rc/Trendi.ipa, checked 2026-07-26",
      },
      {
        claim: "Installs on the test phone are genuine TestFlight installs",
        source:
          "devicectl app inventory with --include-default-apps shows TestFlight present on the device; the earlier 'sideload' theory was a filter artifact and was retracted 2026-07-25",
      },
      {
        claim: "The cross-account isolation gate is still open",
        source:
          "PENDING-beta-user-handoff.md still reads “Status: PENDING — User B unavailable”, account-identity legs “Not run” (checked 2026-07-26)",
      },
    ],
    problem:
      "Most creators don't run out of ideas. They stall in the ninety seconds between having one and pressing record, because a thought in your head is not the same thing as words you can say on camera. I watched people abandon good ideas at exactly that gap, including me.",
    thesis:
      "Nobody needs another script generator. They need the specific sentence to open with. A coach in your pocket, not a script mill.",
    state: [
      "An iOS app in SwiftUI. You type the messy thought; it hands back hooks, a recordable script, a caption, and a simple shot plan.",
      "Record Mode went from a state machine with mocked hardware to real AVFoundation capture to five passed gates on a physical iPhone — including a two-minute real recording and an A→B→A user-switch check that recordings stay isolated between app users.",
      "Builds 120, 121 and 122 went to TestFlight in one evening on July 25. Not velocity theatre: the first on-phone pass found a paid-for coach script rendering as five empty sections (fixed in 121), then the live camera preview showing sideways on the front sensor (fixed in 122).",
      "Both of those defects were invisible in the simulator. They surfaced within hours of running the genuinely distributed build on a real phone.",
      "The newer generation pipeline is still switched off — the shipping builds carry the V1 client on purpose.",
    ],
    decisions: [
      {
        call: "Turned the newer generation pipeline back off before shipping.",
        why: "V2 wrote better copy and broke written-mode, leaked a default that assumed one platform, and rejected legitimate stories at the claims gate. A better sentence isn't worth a worse product.",
      },
      {
        call: "Count a gate as passed only when it runs on the phone.",
        why: "The simulator suite was green for weeks while the first hours on real hardware found two shipping defects. The simulator votes; the device decides.",
      },
      {
        call: "Kept it iOS-only and unpublished.",
        why: "It is easier to learn from ten creators who can reach me than from a public listing I can't support.",
      },
    ],
    learned:
      "Shipping and delivering are different verbs, and I learned it the expensive way — with a finished build sitting behind an account permission for days. The newer lesson is that even my own evidence expires: I retired a whole theory about how builds reached my phone after reading one CLI flag's documentation, because the app inventory I'd trusted turned out to be filtered.",
    actions: [],
    notYet: [
      "Not on the App Store, and not submitted for review.",
      "Build 132 has not been signed, uploaded or assigned to testers; build 122's verified reach was internal TestFlight.",
      "The clean-state isolation gate — a second, genuinely different Apple account walking through the app end to end — has still never run.",
      "The exact build 132 successor still needs its physical-iPhone, screenshot, signing, archive, upload and processing gates.",
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
      "Public web demo. Apple's July 2026 upload responses prove iOS builds 26 and 27 were accepted; current processing, tester assignment and distribution are unverified",
    verifiedAt: "2026-08-13",
    evidence: [
      {
        claim: "Builds 26 and 27 were accepted by App Store Connect",
        source:
          "Apple's own 409 responses: the 2026-07-16 upload log reports previousBundleVersion 26, and the 2026-07-19 log reports 27 — Apple naming builds it had already accepted",
      },
      {
        claim: "The public web demo is still live",
        source:
          "HTTP 200 from https://you-know-ball-orpin.vercel.app, checked 2026-08-13",
      },
      {
        claim: "Current Apple-side distribution state is unverified",
        source:
          "No authenticated App Store Connect query, current processing receipt, beta-group record or tester record was available during the 2026-08-13 evidence refresh; do not infer zero testers",
      },
      {
        claim: "Build 27 runs on my own phone with its save intact",
        source:
          "devicectl reports 0.1.0 (27) installed; the pre-install container backup and post-install diff were byte-identical (2026-07-17 session record)",
      },
    ],
    problem:
      "Sports takes are the most passionate opinions most people hold, and they evaporate into group-chat noise within an hour. Nobody keeps score. Nobody has to defend anything. The most fun argument you had this week left no trace.",
    thesis:
      "The fun isn't in being told you're right. It's in being made to defend a position by something that knows ball and doesn't flatter you. No participation trophies.",
    state: [
      "The web demo is playable right now, in a browser, with no account. Drop a take, the debate engine counters, your argument gets a transparent score.",
      "The engine is deterministic and mechanically neutral across five sports — no model deciding who wins, and a score a player can reconstruct.",
      "On iOS, builds 26 and 27 were uploaded and accepted by App Store Connect. Their current processing, tester-assignment and distribution state was not independently re-verified on August 13.",
      "Build 27 does run on my own phone — through a save-preserving developer install, which is how I caught the engine promising a comeback bonus it never actually paid. That's fixed, along with clutch-time framing for final possessions, on the unmerged branch.",
      "At the July 26 check, the recent engine work was unmerged to main and its working repository had no remote; the August 13 distribution refresh did not treat local source state as Apple-side evidence.",
    ],
    decisions: [
      {
        call: "Made the engine deterministic instead of generative.",
        why: "A scoring system you can't audit isn't a score, it's a vibe. If a player can't reconstruct why they lost, they stop caring about winning.",
      },
      {
        call: "Tuned it until blind play loses badly.",
        why: "Early on, someone who knew nothing could win often enough that the score wasn't measuring anything. Closing that gap is the whole product, and it's the work I'm proudest of and least able to show you.",
      },
      {
        call: "Betting guardrails from day one.",
        why: "I spent three years in sportsbook operations. I know exactly which sentence turns a game into something I don't want to have built.",
      },
    ],
    learned:
      "I uploaded two builds to Apple without preserving a durable record of what happened after acceptance — and until I went looking for evidence, I'd have told you confidently that nothing had ever been uploaded at all. Not knowing the state of your own release is its own kind of failure.",
    actions: [
      { label: "Play the web demo", href: "/you-know-ball/play", primary: true },
      { label: "Open the standalone build", href: LINKS.ykbDemo, external: true },
    ],
    notYet: [
      "Current App Store Connect processing and tester assignment are unverified; no current receipt or beta-group record was available in the August 13 evidence refresh.",
      "Not submitted to the App Store.",
      "No current external-tester or install record was available; do not infer either zero testers or successful distribution.",
      "The engine numbers I'd want to quote here — cohort win rates, tournament results — I can't currently point at an artifact for, so I'm not quoting them.",
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
      "Live on both sites as the koi's front office. It routes real conversations; none has become a paid engagement yet",
    verifiedAt: "2026-07-26",
    evidence: [
      {
        claim: "The front office leads the studio's concierge page",
        source:
          "SSR fetch of koinophobialabs.com/concierge renders the concierge-page hero, checked 2026-07-26",
      },
      {
        claim: "Shipped to production through reviewed PRs",
        source:
          "koinophobia-labs-site PRs #35–#39, merged 2026-07-20/21 with production deploys verified from those exact SHAs",
      },
      {
        claim: "The ease-of-use audit and its fixes are on the record",
        source:
          "2026-07-21 audit scored the first release 63/100 across ten visitor journeys; all nine defects closed in PR #39 (docs/FRONT_OFFICE.md)",
      },
    ],
    problem:
      "Every business front door forces a bad choice: a dead form that flattens a messy situation into dropdown fields, or a chat widget that cheerfully improvises answers it has no right to give. My studio needed a front door too, and I wasn't willing to ship either.",
    thesis:
      "An assistant at the front desk should extract, clarify, and route — never invent. Deterministic understanding first, one question at a time, and nothing leaves the page until the visitor says send.",
    state: [
      "Runs on both domains as the koi companion's front office: a messy first message becomes clarifying questions, then a structured brief the visitor can edit, then an honest recommendation.",
      "On the studio site it fills the exact same intake pipeline as the form — no shadow schema, no second lead system. On this site it collects no contact information at all, and hands hire-intent to the studio with the context carried over.",
      "It refuses honestly. A budget that doesn't fit is told a smaller or outside solution is the better call, and a question the site's own data can't answer gets a clarification instead of a guess.",
      "Days after shipping it, I audited it like a stranger and scored it 63 out of 100 — the front door was hidden behind an unlabeled fish. Nine fixes later, every existing help CTA opens it directly and the koi wears a label.",
    ],
    decisions: [
      {
        call: "Deterministic extraction before any conversation.",
        why: "A front desk that misremembers your budget is worse than a form. The understanding layer is code I can test, not vibes I can prompt.",
      },
      {
        call: "Zero network calls before consent.",
        why: "Nothing is created, scored, or sent until the visitor reviews the brief and says so. An abandoned conversation leaves no trace — which is the point.",
      },
      {
        call: "Typing first, suggestion chips second.",
        why: "The audit caught the free-text box buried under seven chips, two hundred pixels below the fold on a small phone. People think in sentences; the machine adapts, not the person.",
      },
    ],
    learned:
      "Conversion surfaces rot faster than any other code. The release that felt finished scored 63 out of 100 once I walked through it as six different strangers — and every point it gained back came from fixes a visitor would actually feel, not from new features.",
    actions: [
      { label: "Meet it on the studio site", href: LINKS.labs, external: true, primary: true },
    ],
    notYet: [
      "No lead that arrived through it has become a paying engagement. It routes conversations; it hasn't closed one.",
      "The five-human benchmark hasn't run — every score so far is my own adversarial walkthrough, and I already know how that can fool me.",
      "It only answers from what the sites already publish. Ask it something the pages don't know and it tells you so.",
    ],
  },
  {
    slug: "koi-cave",
    name: "Koi Cave",
    tagline: "A private operator brain that never leaves the machine.",
    identity: { theme: "cave", register: "Quiet · local-first, unlisted" },
    reach: "internal",
    stage: "internally-validated",
    status: "Internal build — dev-signed and un-notarized, so it cannot run on another Mac",
    verifiedAt: "2026-07-26",
    evidence: [
      {
        claim: "Not distributable to anyone",
        source:
          "codesign shows a development identity under team 3TY4W55YC5; spctl -a still returns rejected, re-checked 2026-07-26",
      },
      {
        claim: "The installed app is current, not stale",
        source:
          "~/Applications/Koi Cave.app binary stamped Jul 23 2026, built from the operator-loop branch tip",
      },
      {
        claim: "The operator loop produced a real, proof-checked receipt",
        source:
          "KOI_CAVE_OPERATOR_LOOP_V1_REPORT.md; receipt 7F044DA9 with proof artifacts on disk under the app's Proof directory, present 2026-07-26",
      },
      {
        claim: "Certified with limitations, and the mail path never ran",
        source:
          "MORNING_FOUNDER_BRIEF_CERTIFICATION_REPORT.md; gmail-oauth-config.json holds a clientID and no tokens",
      },
    ],
    problem:
      "Every tool that promises to organize your work wants your work on its servers, on a subscription, forever. I wanted the leverage without renting my own context back from someone else.",
    thesis:
      "Personal infrastructure beats personal productivity apps. If the thing that knows the most about how I work is owned by a company, that's a dependency, not leverage.",
    state: [
      "A macOS app: notes, tasks, memory, and automations, running local-first.",
      "The operator loop closed for the first time on July 23: a typed command becomes a validated packet, passes an approval gate, runs a repo-inspection worker, and comes back as a receipt that a separate validator re-checks from artifacts on disk.",
      "That work is deliberately unmerged. The last gate is human hands — me typing the command into the composer myself — before it lands on main.",
      "The morning founder brief is certified with limitations — it survived every failure drill I could design, including corrupt caches, malformed events, and a disconnected mail provider.",
      "One known truth bug remains: items waiting on me for more than 72 hours drop out of the brief while it reports no urgent signal. That's the exact failure mode a brief exists to prevent.",
      "The mail integration has never completed a real sync. The stored config holds a client ID and no tokens, so every brief it has ever produced was built from local state.",
    ],
    decisions: [
      {
        call: "Local-first, with no hosted fallback.",
        why: "The moment there's a sync server, the privacy claim becomes a policy instead of an architecture.",
      },
      {
        call: "Made the worker unable to complete its own commands.",
        why: "A system that grades its own homework converges on flattery. Receipts exist only when a validator re-reads the artifacts from disk — a failed check becomes an honest not-healthy receipt, never a quiet success.",
      },
      {
        call: "Certified it with the limitations written down instead of fixing them first.",
        why: "A known, documented failure is safer than an undocumented one. The report says what it doesn't do.",
      },
      {
        call: "Kept it off every public surface.",
        why: "It has no users, no URL, and no store presence. Putting it on a product page would be inventory-padding, and this site doesn't do that.",
      },
    ],
    learned:
      "I certified a feature against every failure I could imagine and never connected the one integration that would have made it real. The drills tested how it behaves when the data is missing, which turns out to be the only state I've ever actually run it in.",
    actions: [],
    notYet: [
      "No public build, no download, no waitlist. There is nothing to try.",
      "Never notarized, so it cannot be installed by anyone else even privately.",
      "The operator loop lives on a branch; main doesn't have it yet, and the human-hands gate hasn't run.",
      "The live mail integration has never completed a sync, so the feature has never run against real data.",
      "It is a case study in how I build, not a product I'm offering.",
    ],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export type FreshnessResult = {
  product: string;
  stage: Stage;
  verifiedAt: string;
  ageDays: number;
  allowedDays: number;
  fresh: boolean;
  /** Names the product, the stage, the dates, and what to actually do. */
  message: string;
};

/**
 * Evaluate one product against its stage's freshness budget.
 *
 * Deliberately returns a result rather than refreshing anything. A verification
 * date may only move after a human has looked at evidence — a function that
 * auto-bumped it would convert this whole system back into decoration.
 */
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
  products.map((p) => checkFreshness(p, now)).filter((r) => !r.fresh);

/**
 * You Know Ball is the only product whose page carries a scoreboard, because
 * it's the only one whose thesis is a number. These are release facts rather
 * than gameplay statistics — every one is checkable, which the engine numbers
 * currently are not.
 */
export const arenaScoreboard = [
  { label: "Builds Apple accepted", value: "2" },
  { label: "Reached a tester", value: "0" },
  { label: "Outside players", value: "0" },
  { label: "App Store review", value: "None" },
];

/**
 * The studio is deliberately NOT in `products`. It is not something to try —
 * it's something to hire, and it lives on its own domain. (Its front office IS
 * in the universe, because anyone can walk up and use that today.)
 */
export const studio = {
  name: "Koinophobia Labs",
  tagline: "The same operating idea, pointed at other people's businesses.",
  body: "Small businesses leak time and revenue through the exact friction I build against everywhere else — unclear sites, messy intake, follow-up that lives in someone's memory. The studio is where I do that work for clients, and it has its own front door.",
  href: LINKS.labs,
};
