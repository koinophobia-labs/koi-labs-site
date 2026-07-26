import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type { LeadRecord } from "@/lib/acquisition/leads";

export const proposalStatuses = [
  "draft",
  "ready",
  "sent",
  "accepted",
  "declined",
  "expired",
] as const;
export const pricingModels = ["fixed", "hourly", "retainer"] as const;
export const serviceTemplates = [
  "website",
  "redesign",
  "automation",
  "mvp",
  "custom",
] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];
export type PricingModel = (typeof pricingModels)[number];
export type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};
export type ProposalInput = {
  title: string;
  executiveSummary: string;
  clientProblems: string[];
  recommendedSolution: string;
  scopeItems: string[];
  deliverables: string[];
  exclusions: string[];
  timeline: string;
  milestones: string[];
  pricingModel: PricingModel;
  lineItems: LineItem[];
  discount: number;
  validUntil: string | null;
  paymentTerms: string;
  assumptions: string[];
  revisionPolicy: string;
  nextSteps: string;
  internalNotes: string;
};
export type ProposalRecord = ProposalInput & {
  id: string;
  leadId: string;
  status: ProposalStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  subtotal: number;
  total: number;
  paymentStatus: "not_started"|"deposit_pending"|"deposit_paid"|"balance_pending"|"paid"|"failed"|"refunded";
  amountPaid: number;
};
type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;
let pool: Pool | undefined;
const db = () => {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured");
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  }));
};
const list = (v: unknown, max = 50) =>
  Array.isArray(v) &&
  v.length <= max &&
  v.every((x) => typeof x === "string" && x.trim() && x.length <= 1000)
    ? v.map((x) => (x as string).trim())
    : null;
export function calculatePricing(items: LineItem[], discount: number) {
  const subtotal = items.reduce(
    (sum, x) => sum + Math.round(x.quantity * x.unitPrice),
    0,
  );
  return { subtotal, total: Math.max(0, subtotal - discount) };
}
export function validateProposal(value: unknown): {
  input?: ProposalInput;
  errors?: string[];
} {
  if (!value || typeof value !== "object")
    return { errors: ["Invalid proposal"] };
  const r = value as Record<string, unknown>,
    errors: string[] = [];
  const req = (k: string, max = 10000) =>
    typeof r[k] === "string" &&
    (r[k] as string).trim() &&
    (r[k] as string).length <= max
      ? (r[k] as string).trim()
      : (errors.push(`Invalid ${k}`), "");
  const arrays = {} as Record<string, string[]>;
  for (const k of [
    "clientProblems",
    "scopeItems",
    "deliverables",
    "exclusions",
    "milestones",
    "assumptions",
  ]) {
    const v = list(r[k]);
    if (!v) errors.push(`Invalid ${k}`);
    else arrays[k] = v;
  }
  const rawItems = Array.isArray(r.lineItems) ? r.lineItems : [];
  const lineItems: LineItem[] = rawItems.flatMap((x) => {
    if (!x || typeof x !== "object") return [];
    const i = x as Record<string, unknown>;
    return typeof i.description === "string" &&
      i.description.trim() &&
      Number.isFinite(i.quantity) &&
      Number(i.quantity) > 0 &&
      Number.isFinite(i.unitPrice) &&
      Number(i.unitPrice) >= 0
      ? [
          {
            description: i.description.trim().slice(0, 500),
            quantity: Number(i.quantity),
            unitPrice: Math.round(Number(i.unitPrice)),
          },
        ]
      : [];
  });
  if (
    !lineItems.length ||
    lineItems.length !== rawItems.length ||
    lineItems.length > 50
  )
    errors.push("Invalid lineItems");
  const discount = Number(r.discount ?? 0);
  if (!Number.isInteger(discount) || discount < 0)
    errors.push("Invalid discount");
  const validUntil =
    r.validUntil === null || r.validUntil === ""
      ? null
      : typeof r.validUntil === "string" &&
          !Number.isNaN(Date.parse(r.validUntil))
        ? r.validUntil
        : (errors.push("Invalid validUntil"), null);
  if (!pricingModels.includes(r.pricingModel as PricingModel))
    errors.push("Invalid pricingModel");
  const input = {
    title: req("title", 200),
    executiveSummary: req("executiveSummary"),
    clientProblems: arrays.clientProblems || [],
    recommendedSolution: req("recommendedSolution"),
    scopeItems: arrays.scopeItems || [],
    deliverables: arrays.deliverables || [],
    exclusions: arrays.exclusions || [],
    timeline: req("timeline", 2000),
    milestones: arrays.milestones || [],
    pricingModel: r.pricingModel as PricingModel,
    lineItems,
    discount,
    validUntil,
    paymentTerms: req("paymentTerms", 3000),
    assumptions: arrays.assumptions || [],
    revisionPolicy: req("revisionPolicy", 3000),
    nextSteps: req("nextSteps", 3000),
    internalNotes:
      typeof r.internalNotes === "string" && r.internalNotes.length <= 10000
        ? r.internalNotes
        : (errors.push("Invalid internalNotes"), ""),
  };
  return errors.length ? { errors } : { input };
}
function map(r: QueryResultRow): ProposalRecord {
  return {
    id: r.id,
    leadId: r.lead_id,
    status: r.status,
    version: r.version,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    sentAt: r.sent_at ? new Date(r.sent_at).toISOString() : null,
    validUntil: r.valid_until
      ? new Date(r.valid_until).toISOString().slice(0, 10)
      : null,
    title: r.title,
    executiveSummary: r.executive_summary,
    clientProblems: r.client_problems,
    recommendedSolution: r.recommended_solution,
    scopeItems: r.scope_items,
    deliverables: r.deliverables,
    exclusions: r.exclusions,
    timeline: r.timeline,
    milestones: r.milestones,
    pricingModel: r.pricing_model,
    lineItems: r.line_items,
    subtotal: r.subtotal,
    discount: r.discount,
    total: r.total,
    paymentTerms: r.payment_terms,
    assumptions: r.assumptions,
    revisionPolicy: r.revision_policy,
    nextSteps: r.next_steps,
    internalNotes: r.internal_notes,
    paymentStatus:r.payment_status||"not_started",
    amountPaid:r.amount_paid||0,
  };
}
const cols =
  "title,executive_summary,client_problems,recommended_solution,scope_items,deliverables,exclusions,timeline,milestones,pricing_model,line_items,subtotal,discount,total,payment_terms,assumptions,revision_policy,next_steps,internal_notes,valid_until";
const vals = (i: ProposalInput) => {
  const p = calculatePricing(i.lineItems, i.discount);
  return [
    i.title,
    i.executiveSummary,
    JSON.stringify(i.clientProblems),
    i.recommendedSolution,
    JSON.stringify(i.scopeItems),
    JSON.stringify(i.deliverables),
    JSON.stringify(i.exclusions),
    i.timeline,
    JSON.stringify(i.milestones),
    i.pricingModel,
    JSON.stringify(i.lineItems),
    p.subtotal,
    i.discount,
    p.total,
    i.paymentTerms,
    JSON.stringify(i.assumptions),
    i.revisionPolicy,
    i.nextSteps,
    i.internalNotes,
    i.validUntil,
  ];
};
export async function createProposal(
  leadId: string,
  input: ProposalInput,
  q: Queryable = db(),
) {
  const id = crypto.randomUUID(),
    v = vals(input);
  const r = await q.query(
    `insert into crm_proposals(id,lead_id,version,${cols}) values($1,$2,(select coalesce(max(version),0)+1 from crm_proposals where lead_id=$2),${v.map((_, i) => `$${i + 3}`).join(",")}) returning *`,
    [id, leadId, ...v],
  );
  return map(r.rows[0]);
}
export async function getProposal(id: string, q: Queryable = db()) {
  const r = await q.query("select * from crm_proposals where id=$1", [id]);
  return r.rows[0] ? map(r.rows[0]) : null;
}
export async function listProposals(leadId: string, q: Queryable = db()) {
  const r = await q.query(
    "select * from crm_proposals where lead_id=$1 order by version desc",
    [leadId],
  );
  return r.rows.map(map);
}
export async function saveProposal(
  id: string,
  input: ProposalInput,
  q: Queryable = db(),
) {
  const current = await getProposal(id, q);
  if (!current) return null;
  if (
    current.status === "sent" ||
    current.status === "accepted" ||
    current.status === "declined"
  )
    throw new Error("IMMUTABLE");
  const v = vals(input),
    r = await q.query(
      `update crm_proposals set ${cols
        .split(",")
        .map((c, i) => `${c}=$${i + 1}`)
        .join(",")},updated_at=now() where id=$${v.length + 1} returning *`,
      [...v, id],
    );
  return map(r.rows[0]);
}
export function validTransition(from: ProposalStatus, to: ProposalStatus) {
  return (
    from === to ||
    (
      {
        draft: ["ready"],
        ready: ["draft", "sent"],
        sent: ["accepted", "declined", "expired"],
        accepted: [],
        declined: [],
        expired: [],
      }[from] as string[]
    ).includes(to)
  );
}
export async function setProposalStatus(
  id: string,
  status: ProposalStatus,
  q: Queryable = db(),
) {
  const client =
      typeof (q as Pool).connect === "function"
        ? await (q as Pool).connect()
        : null,
    tx = (client || q) as Queryable;
  try {
    if (client) await tx.query("begin");
    const cur = await getProposal(id, tx);
    if (!cur) return null;
    if (!validTransition(cur.status, status))
      throw new Error("INVALID_TRANSITION");
    const sent = status === "sent" && !cur.sentAt ? new Date() : cur.sentAt;
    const r = await tx.query(
      "update crm_proposals set status=$1,sent_at=$2,updated_at=now() where id=$3 returning *",
      [status, sent, id],
    );
    if (status === "sent")
      await tx.query(
        "update crm_leads set proposal_sent_at=$1,status='proposal',updated_at=now() where id=$2",
        [sent, cur.leadId],
      );
    if (client) await tx.query("commit");
    return map(r.rows[0]);
  } catch (e) {
    if (client) await tx.query("rollback");
    throw e;
  } finally {
    client?.release();
  }
}
export function proposalDefaults(
  lead: LeadRecord,
  template: string,
): ProposalInput {
  const kinds: Record<
    string,
    { title: string; solution: string; scope: string[]; price: number }
  > = {
    website: {
      title: "Website / Landing Page",
      solution:
        "Design and build a focused, fast website that turns qualified visitors into conversations.",
      scope: [
        "Strategy and page architecture",
        "Responsive design and implementation",
        "Conversion-focused contact flow",
      ],
      price: 450000,
    },
    redesign: {
      title: "Website Redesign",
      solution:
        "Modernize the current experience while protecting the parts already earning trust.",
      scope: [
        "Content and conversion audit",
        "Responsive redesign",
        "Performance and accessibility pass",
      ],
      price: 650000,
    },
    automation: {
      title: "AI Workflow / Automation",
      solution:
        "Build a reliable workflow that removes repetitive work while keeping human review at critical steps.",
      scope: [
        "Workflow mapping",
        "Automation implementation",
        "Testing and handoff",
      ],
      price: 550000,
    },
    mvp: {
      title: "MVP Prototype",
      solution:
        "Turn the core product idea into a testable, production-minded first release.",
      scope: [
        "Product definition",
        "Core experience implementation",
        "Launch readiness",
      ],
      price: 850000,
    },
    custom: {
      title: "Custom Project",
      solution:
        "Deliver a focused solution aligned to the business goal and agreed success criteria.",
      scope: [
        "Discovery and definition",
        "Implementation",
        "Quality assurance and handoff",
      ],
      price: 500000,
    },
  };
  const t = kinds[template] || kinds.custom;
  const until = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  return {
    title: `${t.title} Proposal for ${lead.businessName}`,
    executiveSummary: `${lead.businessName} is looking to ${lead.biggestProblem.toLowerCase()}. Koinophobia Labs will deliver a focused engagement designed around that outcome.`,
    clientProblems: [lead.biggestProblem],
    recommendedSolution: t.solution,
    scopeItems: t.scope,
    deliverables: [
      "Production-ready implementation",
      "Quality assurance and launch support",
      "Documentation and handoff",
    ],
    exclusions: [
      "Third-party subscription fees",
      "New scope not listed in this proposal",
    ],
    timeline: lead.timeline || "Final schedule confirmed at kickoff",
    milestones: [
      "Kickoff and alignment",
      "First working review",
      "Final QA and launch",
    ],
    pricingModel: "fixed",
    lineItems: [{ description: t.title, quantity: 1, unitPrice: t.price }],
    discount: 0,
    validUntil: until,
    paymentTerms:
      "50% deposit to begin; remaining 50% due before launch or final handoff.",
    assumptions: [
      "Client feedback is returned within two business days",
      "Required content and account access are supplied at kickoff",
    ],
    revisionPolicy:
      "Includes two consolidated revision rounds within the agreed scope.",
    nextSteps:
      "Review this proposal, confirm scope, and schedule kickoff. No work begins until both parties confirm and the deposit is received.",
    internalNotes: "",
  };
}
