import { LINKS } from "@/lib/links";

// Single source of truth for the present-tense state of Blake's work.
// Rendered by /now and the homepage snapshot.
//
// lastUpdated is a literal, manually maintained string. Move it only after the
// copy below has been checked against conversation, repository, and release evidence.

export const nowLastUpdated = "July 27, 2026";

export const nowHero = {
  heading: "What I'm doing now.",
  lede: "I'm in the proof stage: turning shipped products into real users, clients, feedback, and evidence — not more features.",
};

export const nowChapter = [
  "My role at DraftKings ended in July 2026. Three years of high-volume sportsbook operations taught me exactly where products confuse people and where processes quietly break — and that ending turned into the push to build full-time instead of on the side.",
  "So this chapter is simple: go deeper on Koinophobia Labs and the products, keep a targeted search open for the right salary role, and — most importantly — move from having built things to proving they're actually useful to someone other than me.",
];

export const nowActiveWork: Array<{
  name: string;
  stage: string;
  snapshot: string;
  doingNow: string;
  nextProof: string;
  href: string;
  cta: string;
  external?: boolean;
}> = [
  {
    name: "Koinophobia Labs",
    stage: "Selling and validating",
    snapshot:
      "Full-time on the studio. The front office routes structured leads, and qualified submissions can produce founder-ready sales packets inside the private CRM.",
    doingNow:
      "Running audit-first outreach while keeping the sales infrastructure honest: packets are internal, replies stay unsent until reviewed, and no routed conversation is counted as revenue.",
    nextProof:
      "The first repeatable paid engagement — a real business paying for a system that saves it time. Not another redesign.",
    href: LINKS.labs,
    cta: "Visit the studio",
    external: true,
  },
  {
    name: "Trendi",
    stage: "External beta · build 122",
    snapshot:
      "Build 122 is the latest evidenced TestFlight artifact, and a creator has now returned concrete feedback about onboarding speed, idea separation, episodic scripts, and teaching bias.",
    doingNow:
      "Turning that feedback into one bounded repair slice: experienced creators get a direct path to content, the plus action creates a separate idea, scripts can branch into episodes, and onboarding stops steering every output toward teaching.",
    nextProof:
      "The same creator retesting the repaired flow and using the result to publish — not another internal polish pass.",
    href: "/products/trendi",
    cta: "See Trendi",
  },
  {
    name: "Career Forge",
    stage: "Live beta · checkout security rebuild",
    snapshot:
      "The free beta remains live. Checkout stays closed while the signed owner-approval boundary is rebuilt from current main and the paid journey is certified again.",
    doingNow:
      "Keeping the free workflow stable while issue #49 carries the commerce requirement: current-main implementation, PostgreSQL role separation, offline owner signing, exact-release certification, and a deliberate reopen decision.",
    nextProof:
      "A fresh security PR based on current main, every paid-path gate green, and explicit owner approval before checkout reopens.",
    href: LINKS.careerForge,
    cta: "Open Career Forge",
    external: true,
  },
  {
    name: "You Know Ball",
    stage: "Web demo live · Apple builds untested",
    snapshot:
      "Playable in a browser. Apple had already accepted build numbers 26 and 27, but processing and tester assignment remain unverified, and the connected GitHub backup stops at build 24.",
    doingNow:
      "Preserving the current build-27 lineage in a durable remote and confirming the Apple-side state before adding another gameplay slice.",
    nextProof:
      "The current iOS line backed up, assigned to a tester group, and installed by someone who isn't me.",
    href: "/products/you-know-ball",
    cta: "See You Know Ball",
  },
];

export const nowSnapshot = nowActiveWork.map((item) => ({
  label: item.name,
  line: item.snapshot,
}));

export const nowProof = [
  "A first repeatable paid studio engagement.",
  "A creator re-testing Trendi's feedback-driven repair and publishing from the result.",
  "Career Forge's owner-approval boundary rebuilt on current main before checkout reopens.",
  "You Know Ball's current iOS lineage backed up and assigned to a tester group.",
  "A salary role aligned with customer-facing AI and implementation work.",
];

export const nowProfessional = {
  line: "I'm still open to the right salary role — building the studio and staying open to strong work aren't in conflict. The clearest fits:",
  lanes: [
    "Customer Experience AI",
    "AI implementation",
    "Product support / operations",
    "Trust & safety",
    "Workflow automation",
    "Customer-facing AI product",
  ],
};

export const nowLearning = [
  {
    title: "Shipping isn't proving demand.",
    body: "A product can be technically complete and commercially unproven at the same time. This chapter is about closing that gap, not widening it.",
  },
  {
    title: "Distribution is part of the product.",
    body: "Getting it in front of the right person is not a step after the work. It is the work.",
  },
  {
    title: "A tester changes the roadmap.",
    body: "Trendi's first creator feedback replaced four internal theories with four specific workflow defects. That is more valuable than another broad audit.",
  },
  {
    title: "Honest labels build more trust than launch language.",
    body: "\"Live beta\" and \"accepted by Apple, untested\" earn more credibility than a confident status that collapses different release states.",
  },
  {
    title: "Security work expires when the protected code moves.",
    body: "Career Forge's stale approval branch was closed rather than forced onto a newer product line. The requirement survived; the obsolete implementation did not.",
  },
  {
    title: "AI should reduce repeated decisions, not judgment.",
    body: "The best systems take the busywork and leave the human call intact.",
  },
];

export const nowNotDoing = [
  "Starting another product before the current ones are validated.",
  "Calling an upload customer proof.",
  "Adding another gameplay slice before the current You Know Ball lineage is durable.",
  "Reopening Career Forge checkout through configuration alone.",
  "Turning every conversation into a sales pitch.",
];

export const nowOpenDoor = {
  heading: "Open door",
  lede: "Good reasons to get in touch right now:",
  reasons: [
    "You want to test one of the products.",
    "You run a business with messy intake or follow-up.",
    "You're hiring for a customer-facing AI or implementation role.",
    "You're building something similar and want to compare notes.",
  ],
};
