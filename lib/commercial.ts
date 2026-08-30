import { LINKS } from "@/lib/links";

export type WorkStatus =
  | "live-client"
  | "client-pilot"
  | "concept-build"
  | "internal-product";

export type WorkProject = {
  slug: string;
  title: string;
  businessType: string;
  status: WorkStatus;
  statusLabel: string;
  summary: string;
  problem: string;
  solution: string;
  howItWorks: string[];
  scope: string[];
  timeline?: string;
  capabilities: string[];
  measuredResults?: string[];
  intendedImpact?: string[];
  testimonial?: {
    quote: string;
    name: string;
    role?: string;
    company?: string;
  };
  liveUrl?: string;
  previewUrl?: string;
  image?: string;
  featured: boolean;
};

export const studioConfig = {
  auditPrice: "$250",
  quickFixRange: "$149–$499",
  landingPageRange: "$499–$1,200",
  websiteRange: "$1,500–$3,500",
  auditTimeline: "2–3 business days",
  quickFixTimeline: "1–3 business days",
  landingPageTimeline: "3–7 business days",
  websiteTimeline: "1–3 weeks",
  aiWorkflowTimeline: "1–4 weeks",
  auditCreditEnabled: true,
  postLaunchSupportCopy:
    "Every project includes a defined post-launch support period. The exact window and covered issues are included in the approved project scope.",
  revisionCopy:
    "Revision rounds are defined in the project scope. Work outside the approved scope receives a separate estimate; small fixes found during launch testing are part of QA.",
  ownershipCopy:
    "Account access, domain ownership, deployed-project access, third-party costs, and any optional maintenance are documented before launch.",
} as const;

export const trustItems = [
  "Founder-led from scope to launch",
  "Scope and price approved before development",
  "Working prototypes before large commitments",
  "Direct communication and documented decisions",
  "Mobile-first builds with launch support",
];

export const businessProblems = [
  {
    title: "Outdated website",
    body: "The site looks acceptable, but visitors cannot quickly understand the offer or the next step.",
    service: "Landing pages and small-business websites",
  },
  {
    title: "Messy inquiries",
    body: "Customers send incomplete details across email, social media, and text, creating avoidable follow-up.",
    service: "Structured booking and inquiry systems",
  },
  {
    title: "Manual follow-up",
    body: "Leads disappear because replies, reminders, and routing depend entirely on memory.",
    service: "AI workflows and business automation",
  },
  {
    title: "Confusing booking",
    body: "The business cannot collect requirements, assign requests, or move customers toward a deposit cleanly.",
    service: "Front-office and booking flows",
  },
  {
    title: "Disconnected tools",
    body: "Forms, calendars, payments, email, and customer information do not work together.",
    service: "Workflow repair and integrations",
  },
];

export const workProjects: WorkProject[] = [
  {
    slug: "blackline-ritual",
    title: "Blackline Ritual",
    businessType: "Private tattoo studio",
    status: "concept-build",
    statusLabel: "Concept Build",
    summary:
      "A structured tattoo-studio front door designed to replace incomplete DMs with serious, routing-ready consultation requests.",
    problem:
      "Tattoo inquiries often arrive without placement, size, budget, references, or a clear understanding of the studio’s process.",
    solution:
      "A premium mobile-first site concept combining artist fit, healed-work proof, booking rules, required inquiry details, and a deposit-ready customer path.",
    howItWorks: [
      "A visitor understands the studio style and booking rules before reaching the form.",
      "The inquiry path collects placement, size, references, budget, and availability.",
      "The studio receives a more complete request to review before consultation or deposit.",
    ],
    scope: [
      "Positioning and offer structure",
      "Artist and healed-work proof sections",
      "Structured consultation path",
      "Booking-policy presentation",
      "Mobile-first responsive concept",
    ],
    timeline: "Concept scope: 3–7 business days",
    capabilities: ["Conversion design", "Structured intake", "Booking UX", "Responsive web"],
    intendedImpact: [
      "Reduce incomplete inquiries",
      "Make artist fit easier to judge",
      "Create a clearer path from interest to consultation",
      "Set deposit and scheduling expectations earlier",
    ],
    previewUrl: "/demos/tattoo-studio",
    image: "/work/blackline-ritual.jpg",
    featured: true,
  },
  {
    slug: "iron-method-coaching",
    title: "Iron Method Coaching",
    businessType: "Local gym and fitness coach",
    status: "concept-build",
    statusLabel: "Concept Build",
    summary:
      "A focused local-fitness site concept built around program clarity, trust, and a low-friction trial-week inquiry.",
    problem:
      "Prospective members often cannot tell who a program is for, what happens first, or how to ask a useful question from a phone.",
    solution:
      "A responsive sales path that explains the coaching method, sets expectations, shows the customer journey, and makes the trial step obvious.",
    howItWorks: [
      "The opening screen names the audience and the immediate next step.",
      "Program cards clarify fit without forcing a visitor through a long sales page.",
      "A trial-week path collects enough context for a useful reply.",
    ],
    scope: ["Offer positioning", "Program architecture", "Trust sections", "Trial inquiry CTA", "Responsive concept"],
    timeline: "Concept scope: 3–7 business days",
    capabilities: ["Landing pages", "Conversion copy", "Local-service UX", "Responsive web"],
    intendedImpact: [
      "Clarify program fit",
      "Reduce low-context inquiries",
      "Make the trial offer easier to act on",
    ],
    previewUrl: "/demos/fitness-coach",
    image: "/work/iron-method-coaching.jpg",
    featured: true,
  },
  {
    slug: "forge-and-foam",
    title: "Forge & Foam",
    businessType: "Neighborhood coffee shop",
    status: "concept-build",
    statusLabel: "Concept Build",
    summary:
      "A neighborhood cafe concept that puts hours, location, menu priorities, and repeat-visit reasons in the customer’s path immediately.",
    problem:
      "Cafe visitors often have to hunt through social posts for current hours, menu context, location details, and what makes the shop worth a visit.",
    solution:
      "A fast local-business site concept organizing practical visit information, daily offers, atmosphere, and direct actions around mobile behavior.",
    howItWorks: [
      "Visit-critical information appears before decorative storytelling.",
      "Menu and daily-offer sections help a customer decide quickly.",
      "Location and contact actions remain clear on small screens.",
    ],
    scope: ["Local SEO structure", "Menu hierarchy", "Hours and location UX", "Offer modules", "Responsive concept"],
    timeline: "Concept scope: 3–7 business days",
    capabilities: ["Local-business websites", "Information design", "Mobile UX", "Conversion copy"],
    intendedImpact: [
      "Reduce friction before a first visit",
      "Make practical information easier to find",
      "Create clearer reasons to return",
    ],
    previewUrl: "/demos/coffee-shop",
    image: "/work/forge-and-foam.jpg",
    featured: true,
  },
];

export const products = [
  {
    title: "Career Forge",
    status: "Internal Product · Live MVP",
    audience: "Job seekers and career changers",
    body: "An ATS-focused tool that turns real work history into clearer resume and LinkedIn materials without inventing experience or metrics.",
    capabilities: ["AI-assisted generation", "Structured onboarding", "Document workflows", "Production deployment"],
    href: LINKS.careerForge,
    cta: "Open Career Forge",
    image: undefined,
  },
  {
    title: "Trendi",
    status: "Shipped · Live on the App Store",
    audience: "Creators moving from idea to usable script",
    body: "A focused creator workflow for shaping a rough thought into clear words to say on camera. Free on the App Store, no account required.",
    capabilities: ["Structured creative workflow", "Responsive product UI", "User-state flow", "App Store release discipline"],
    href: "/trendi",
    cta: "Explore Trendi",
    image: "/trendi/trendi-final-output.jpg",
  },
  {
    title: "You Know Ball",
    status: "Internal Product · Live Web MVP",
    audience: "Sports fans and creators",
    body: "A sports-debate AI with an answer-first interaction model, scoring, shareable output, and betting guardrails.",
    capabilities: ["AI interaction design", "Native iOS shell", "Safety testing", "Production web deployment"],
    href: "/you-know-ball/play",
    cta: "Play You Know Ball",
    image: "/proof/you-know-ball/mobile-play.png",
  },
];

export const serviceOffers = [
  {
    slug: "audit",
    title: "Revenue Leak Audit",
    forWhom: "Owners who know something is underperforming but need a prioritized diagnosis before committing to a build.",
    problem: "Unclear messaging, broken customer paths, mobile friction, and missed booking or inquiry opportunities.",
    includes: ["Website and journey review", "Conversion-friction review", "Automation opportunities", "Prioritized roadmap", "PDF report and walkthrough"],
    price: studioConfig.auditPrice,
    priceLabel: "Flat fee",
    timeline: studioConfig.auditTimeline,
    deliverable: "A scored, prioritized report you can use with Koinophobia Labs or take elsewhere.",
    href: "/audit",
    cta: "Start with an audit",
    featured: true,
  },
  {
    slug: "quick-fix",
    title: "Quick Fix Sprint",
    forWhom: "Businesses with one contained issue that should not become a full redesign.",
    problem: "A broken CTA, weak form, mobile layout issue, analytics gap, or booking-flow snag.",
    includes: ["Focused diagnosis", "Agreed repair", "Cross-device QA", "Launch support"],
    price: studioConfig.quickFixRange,
    priceLabel: "Typical range",
    timeline: studioConfig.quickFixTimeline,
    deliverable: "The agreed repair implemented and tested.",
    href: "/intake?service=Quick%20Fix%20Sprint",
    cta: "Request a sprint",
  },
  {
    slug: "landing-page",
    title: "Landing Page Rebuild",
    forWhom: "Businesses that need one clear offer and a stronger path from visit to inquiry.",
    problem: "The current page is unclear, slow, hard to use on mobile, or missing a focused call to action.",
    includes: ["Messaging structure", "Responsive design and build", "CTA and lead form", "Basic analytics", "Launch support"],
    price: studioConfig.landingPageRange,
    priceLabel: "Typical range",
    timeline: studioConfig.landingPageTimeline,
    deliverable: "A launched, responsive landing page with a working inquiry path.",
    href: "/intake?service=Landing%20Page%20Rebuild",
    cta: "Request a landing page",
  },
  {
    slug: "website",
    title: "Small-Business Website",
    forWhom: "Service businesses that need a credible, useful home base instead of a generic template or social-only presence.",
    problem: "Customers cannot quickly understand the business, services, proof, process, or next step.",
    includes: ["Strategy and copy structure", "Custom responsive build", "Core service pages", "Inquiry flow", "SEO and analytics basics", "Deployment and launch checklist"],
    price: studioConfig.websiteRange,
    priceLabel: "Typical range",
    timeline: studioConfig.websiteTimeline,
    deliverable: "A launched business website with documented access and handoff.",
    href: "/intake?service=Small-Business%20Website",
    cta: "Request a website",
  },
  {
    slug: "ai-front-office",
    title: "AI Workflow or Front Office",
    forWhom: "Businesses losing time to repetitive intake, routing, preparation, or follow-up.",
    problem: "The workflow spans too many tools and depends on staff remembering every step.",
    includes: ["Process mapping", "Structured intake", "Summarization or routing", "Dashboard or tool integration", "Follow-up and handoff logic", "Critical-path testing"],
    price: "Custom after discovery",
    priceLabel: "Scope-dependent",
    timeline: studioConfig.aiWorkflowTimeline,
    deliverable: "An approved workflow or front-office system built around the actual business process.",
    href: "/intake?service=AI%20Workflow%20or%20Front%20Office",
    cta: "Describe the workflow",
  },
];

export const processSteps = [
  { number: "01", title: "Diagnose", body: "Understand the business problem, customer journey, current tools, and the smallest useful outcome." },
  { number: "02", title: "Scope", body: "Define deliverables, responsibilities, timeline, price, review rounds, and success criteria in writing." },
  { number: "03", title: "Build", body: "Create the approved website, workflow, automation, or prototype with direct founder communication." },
  { number: "04", title: "Review", body: "Walk through working software and complete the revision rounds included in the approved scope." },
  { number: "05", title: "Launch", body: "Test critical paths, deploy the system, and confirm the right ownership and account access." },
  { number: "06", title: "Support", body: "Provide the scoped post-launch window, handoff notes, and options for maintenance when needed." },
];

export const faqs = [
  { question: "How much does a project cost?", answer: "A focused repair usually falls between $149 and $499, a landing page between $499 and $1,200, and a small-business website between $1,500 and $3,500. AI workflows are scoped after discovery because the number of tools, rules, and failure paths varies. Final scope and price are approved before development." },
  { question: "How quickly can you start?", answer: "Availability is confirmed after the initial intake. A start date is not promised until scope, required content, access, and any applicable initial payment are ready." },
  { question: "How long does a project take?", answer: "Quick fixes typically take 1–3 business days, landing pages 3–7 business days, websites 1–3 weeks, and AI workflows 1–4 weeks. The approved scope includes the actual schedule." },
  { question: "Do I need a completely new website?", answer: "No. If the foundation is sound, a focused repair or landing-page rebuild may be the better investment. The audit exists to make that decision clearer." },
  { question: "Can you improve my current site?", answer: "Yes. Koinophobia Labs can repair calls to action, forms, mobile layouts, conversion copy, analytics basics, and booking paths without replacing everything." },
  { question: "Can you connect forms, calendars, payments, or email?", answer: "Yes, when the tools support reliable integration. The exact data flow, third-party costs, permissions, and fallback behavior are documented during scoping." },
  { question: "Do you offer ongoing maintenance?", answer: "Maintenance can be scoped separately. It is optional unless the system genuinely requires ongoing operation or third-party monitoring." },
  { question: "What happens after I submit an inquiry?", answer: "Blake reviews the business problem, fit, budget, and timeline, then replies with the smallest sensible next step. That may be an audit, a focused estimate, or an honest recommendation not to build yet." },
  { question: "What does the audit include?", answer: "The $250 Revenue Leak Audit reviews the customer journey, mobile experience, content clarity, contact and booking paths, accessibility, SEO, performance, broken links, and security basics. You receive a prioritized PDF and walkthrough." },
  { question: "Do you work with businesses outside Chicago?", answer: "Yes. The studio is based in Chicago and can work remotely with businesses elsewhere when the project and communication needs are a good fit." },
  { question: "Who owns the finished website or system?", answer: studioConfig.ownershipCopy },
  { question: "How many revisions are included?", answer: studioConfig.revisionCopy },
  { question: "What if I am not sure what I need?", answer: "Use the AI Project Concierge to describe the friction in plain language and get a preliminary, rules-grounded recommendation. The Revenue Leak Audit remains the lowest-risk starting point when website and customer-journey uncertainty is the main issue." },
];

export const getWorkProject = (slug: string) =>
  workProjects.find((project) => project.slug === slug);
