import { LINKS } from "@/lib/links";

// Single source of truth for the present-tense state of Blake's work.
// Rendered by /now (the full field report) and by the homepage "Right now"
// snapshot, so the two surfaces cannot quietly contradict each other.
//
// lastUpdated is a LITERAL, manually maintained string — never a runtime date.
// Bump it by hand whenever the copy below changes.

export const nowLastUpdated = "July 26, 2026";

export const nowHero = {
  heading: "What I'm doing now.",
  lede: "I'm in the proof stage: turning shipped products into real users, clients, feedback, and evidence — not more features.",
};

// First-person narrative of the current chapter. Transition, not tragedy bait.
export const nowChapter = [
  "My role at DraftKings ended in July 2026. Three years of high-volume sportsbook operations taught me exactly where products confuse people and where processes quietly break — and that ending turned into the push to build full-time instead of on the side.",
  "So this chapter is simple: go deeper on Koinophobia Labs and the products, keep a targeted search open for the right salary role, and — most importantly — move from having built things to proving they're actually useful to someone other than me.",
];

// Each entry feeds BOTH surfaces:
//  - `snapshot` is the one-line homepage "Right now" copy (kept verbatim).
//  - `stage` / `doingNow` / `nextProof` are the fuller /now field report.
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
      "Full-time on the studio. The AI front office now answers the door on both sites, and qualified leads come back as founder-ready sales packets.",
    doingNow:
      "Running audit-first outreach with Chicago-area small businesses while the infrastructure behind it hardens — the concierge routing conversations, sales packets generated from qualified leads, and a real sign-in on the private CRM.",
    nextProof:
      "The first repeatable paid engagement — a real business paying for a system that saves it time. Not another redesign.",
    href: LINKS.labs,
    cta: "Visit the studio",
    external: true,
  },
  {
    name: "Trendi",
    stage: "TestFlight · internal, build 122",
    snapshot:
      "Record Mode reached TestFlight — builds 120, 121 and 122 in one evening, two of them fixing defects a real phone surfaced within hours.",
    doingNow:
      "Running the deliberate on-device update pass and the focused record → playback → share checks on build 122. The simulator stayed green through both of the defects a genuine install caught, which is exactly why the phone runs the gate.",
    nextProof:
      "Creators using the output to publish, repeatedly — not another layer of polish.",
    href: "/products/trendi",
    cta: "See Trendi",
  },
  {
    name: "Career Forge",
    stage: "Live beta · checkout certification-pinned",
    snapshot:
      "Free to use in beta. A durable order store now passes its health checks; checkout stays closed until the paid journey is re-proven on the code that's actually deployed.",
    doingNow:
      "Re-certifying the paid path on the current build. The sales approval is pinned to an exact commit, so every merge re-closes the store on purpose — reopening takes a demonstrated journey, not a config change.",
    nextProof:
      "External users completing the full workflow, trusting the output, and paying because it materially simplifies their search.",
    href: LINKS.careerForge,
    cta: "Open Career Forge",
    external: true,
  },
  {
    name: "You Know Ball",
    stage: "Web demo live · iOS uploaded, untested",
    snapshot:
      "Playable in a browser today. Builds 26 and 27 sit accepted at App Store Connect, still assigned to no tester.",
    doingNow:
      "The latest engine work — clutch-time finishes and an honest comeback bonus the UI had been promising without paying — is committed on a branch that exists only on this machine. The next step is still a tester group, not more features.",
    nextProof:
      "Real players returning to argue, sharing their receipts, and caring about the outcome.",
    href: "/products/you-know-ball",
    cta: "See You Know Ball",
  },
];

// The homepage renders this exact list from the shared source above.
export const nowSnapshot = nowActiveWork.map((item) => ({
  label: item.name,
  line: item.snapshot,
}));

export const nowProof = [
  "A first repeatable paid studio engagement.",
  "Career Forge's certified journey re-proven on the deployed build, then external users finishing the workflow.",
  "Trendi's build in ten creators' hands after the on-device gate list clears.",
  "A You Know Ball build assigned to a tester group and installed by someone who isn't me.",
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
    title: "Honest labels build more trust than launch language.",
    body: "\"Live beta\" and \"TestFlight-ready\" earn more credibility than a confident \"launched\" that isn't quite true.",
  },
  {
    title: "The simulator votes; the device decides.",
    body: "Two Trendi defects shipped through weeks of green automated runs and surfaced within hours of a genuine install on a real phone. A gate that never touches hardware isn't a gate.",
  },
  {
    title: "AI should reduce repeated decisions, not judgment.",
    body: "The best systems take the busywork and leave the human call intact.",
  },
];

export const nowNotDoing = [
  "Starting another product before the current ones are validated.",
  "Calling a deployment customer proof.",
  "Polishing away the lived problems that created these products.",
  "Turning every conversation into a sales pitch.",
  "Pretending the job search and the founder journey aren't happening at the same time.",
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
