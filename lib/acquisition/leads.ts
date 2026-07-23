import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type { ConciergeLeadData } from "@/lib/concierge/types";
import { redactSecrets } from "@/lib/security/redaction";

export const leadStatuses = ["new", "contacted", "replied", "meeting", "proposal", "won", "lost"] as const;
export const leadOutcomes = ["open", "won", "lost"] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export type LeadOutcome = (typeof leadOutcomes)[number];

export type LeadInput = {
  name: string; businessName: string; email: string; phone?: string;
  websiteOrSocial: string; industry: string; serviceInterest: string;
  budgetRange?: string; timeline: string; biggestProblem: string;
  notes?: string; source?: string; concierge?: ConciergeLeadData;
};

export type LeadRecord = LeadInput & {
  id: string; createdAt: string; updatedAt: string; status: LeadStatus;
  lastContactedAt: string | null; followUpAt: string | null;
  auditCompleted: boolean; proposalSentAt: string | null;
  outcome: LeadOutcome; internalNotes: string;
  /** Compatibility aliases for the pre-existing internal acquisition pages. */
  paymentStatus: "not_started"|"deposit_pending"|"deposit_paid"|"balance_pending"|"paid"|"failed"|"refunded"; lastContacted?: string; nextFollowUpDate?: string;
};

export type LeadUpdate = Partial<Pick<LeadRecord, "status" | "lastContactedAt" | "followUpAt" | "auditCompleted" | "proposalSentAt" | "outcome" | "internalNotes">>;
type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;
let pool: Pool | undefined;

function database(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
}

function map(row: QueryResultRow): LeadRecord {
  return {
    id: row.id, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
    source: row.source, name: row.name, businessName: row.business_name, email: row.email,
    phone: row.phone || "", websiteOrSocial: row.website_or_social, industry: row.industry,
    serviceInterest: row.service_interest, budgetRange: row.budget_range || "", timeline: row.timeline,
    biggestProblem: row.biggest_problem, notes: row.notes || "", status: row.status,
    lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at).toISOString() : null,
    followUpAt: row.follow_up_at ? new Date(row.follow_up_at).toISOString() : null,
    auditCompleted: row.audit_completed, proposalSentAt: row.proposal_sent_at ? new Date(row.proposal_sent_at).toISOString() : null,
    outcome: row.outcome, internalNotes: row.internal_notes || "", paymentStatus:row.payment_status||"not_started",
    lastContacted: row.last_contacted_at ? new Date(row.last_contacted_at).toISOString() : undefined,
    nextFollowUpDate: row.follow_up_at ? new Date(row.follow_up_at).toISOString() : undefined,
    concierge: row.source === "ai_project_concierge" && row.concierge_data && typeof row.concierge_data === "object" && typeof row.concierge_data.sessionId === "string" ? row.concierge_data as ConciergeLeadData : undefined,
  };
}

export function leadDedupeKey(idempotencyKey: string) {
  return Buffer.from(idempotencyKey.trim()).toString("base64url");
}

/**
 * SITE-03: mask obvious secrets in visitor free-text before it is persisted to
 * crm_leads or placed in the lead email. Only free-text fields are touched;
 * structured/routing fields (name, email, recommendation, confidence, scores,
 * sessionId) are left intact so deterministic routing and the concierge
 * signature — both already computed upstream — are preserved. Returns a NEW
 * object; never mutates the caller's input.
 */
export function redactLeadFreeText(input: LeadInput): LeadInput {
  const redacted: LeadInput = {
    ...input,
    biggestProblem: redactSecrets(input.biggestProblem),
    notes: input.notes ? redactSecrets(input.notes) : input.notes,
  };
  const concierge = input.concierge;
  if (concierge) {
    redacted.concierge = {
      ...concierge,
      visitorPrimaryProblem: redactSecrets(concierge.visitorPrimaryProblem),
      desiredOutcome: redactSecrets(concierge.desiredOutcome),
      currentTools: concierge.currentTools.map((tool) => redactSecrets(tool)),
      qualificationSummary: redactSecrets(concierge.qualificationSummary),
      recommendationReasons: concierge.recommendationReasons.map((reason) => redactSecrets(reason)),
      answers: {
        ...concierge.answers,
        primaryProblem: redactSecrets(concierge.answers.primaryProblem),
        branchContext: redactSecrets(concierge.answers.branchContext),
        impact: redactSecrets(concierge.answers.impact),
        currentTools: redactSecrets(concierge.answers.currentTools),
        desiredOutcome: redactSecrets(concierge.answers.desiredOutcome),
      },
    };
  }
  return redacted;
}

export async function storeLead(input: LeadInput, idempotencyKey = crypto.randomUUID(), db: Queryable = database()): Promise<{ lead: LeadRecord; created: boolean }> {
  const id = crypto.randomUUID();
  // SITE-03: persist redacted free-text, never the raw visitor paste.
  const safe = redactLeadFreeText(input);
  const result = await db.query(`
    insert into crm_leads (id, dedupe_key, source, name, business_name, email, phone, website_or_social, industry, service_interest, budget_range, timeline, biggest_problem, notes, concierge_data)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)
    on conflict (dedupe_key) do update set updated_at = crm_leads.updated_at
    returning *, (xmax = 0) as created
  `, [id, leadDedupeKey(idempotencyKey), safe.source || "website intake", safe.name, safe.businessName, safe.email.toLowerCase(), safe.phone || "", safe.websiteOrSocial, safe.industry, safe.serviceInterest, safe.budgetRange || "", safe.timeline, safe.biggestProblem, safe.notes || "", JSON.stringify(safe.concierge || {})]);
  return { lead: map(result.rows[0]), created: Boolean(result.rows[0].created) };
}

export async function listLeads(options: { search?: string; status?: string; sort?: string } = {}, db: Queryable = database()) {
  const values: unknown[] = []; const where: string[] = [];
  if (options.search) { values.push(`%${options.search}%`); where.push(`(name ilike $${values.length} or business_name ilike $${values.length} or email ilike $${values.length})`); }
  if (options.status && leadStatuses.includes(options.status as LeadStatus)) { values.push(options.status); where.push(`status = $${values.length}`); }
  const order = options.sort === "follow-up" ? "follow_up_at asc nulls last, created_at desc" : "created_at desc";
  const result = await db.query(`select * from crm_leads ${where.length ? `where ${where.join(" and ")}` : ""} order by ${order}`, values);
  return result.rows.map(map);
}

export async function getLead(id: string, db: Queryable = database()) {
  const result = await db.query("select * from crm_leads where id = $1", [id]);
  return result.rows[0] ? map(result.rows[0]) : null;
}

export function validateLeadUpdate(value: unknown): { update?: LeadUpdate; errors?: string[] } {
  if (!value || typeof value !== "object") return { errors: ["Invalid update"] };
  const raw = value as Record<string, unknown>; const update: LeadUpdate = {}; const errors: string[] = [];
  if ("status" in raw) { if (leadStatuses.includes(raw.status as LeadStatus)) update.status = raw.status as LeadStatus; else errors.push("Invalid status"); }
  if ("outcome" in raw) { if (leadOutcomes.includes(raw.outcome as LeadOutcome)) update.outcome = raw.outcome as LeadOutcome; else errors.push("Invalid outcome"); }
  for (const key of ["lastContactedAt", "followUpAt", "proposalSentAt"] as const) if (key in raw) {
    if (raw[key] === null || raw[key] === "") update[key] = null;
    else if (typeof raw[key] === "string" && !Number.isNaN(Date.parse(raw[key]))) update[key] = new Date(raw[key]).toISOString();
    else errors.push(`Invalid ${key}`);
  }
  if ("auditCompleted" in raw) { if (typeof raw.auditCompleted === "boolean") update.auditCompleted = raw.auditCompleted; else errors.push("Invalid auditCompleted"); }
  if ("internalNotes" in raw) { if (typeof raw.internalNotes === "string" && raw.internalNotes.length <= 10000) update.internalNotes = raw.internalNotes; else errors.push("Invalid internalNotes"); }
  return errors.length ? { errors } : { update };
}

export async function updateLead(id: string, update: LeadUpdate, db: Queryable = database()) {
  const fields: string[] = []; const values: unknown[] = [];
  const columns: Record<keyof LeadUpdate, string> = { status:"status", lastContactedAt:"last_contacted_at", followUpAt:"follow_up_at", auditCompleted:"audit_completed", proposalSentAt:"proposal_sent_at", outcome:"outcome", internalNotes:"internal_notes" };
  for (const [key, column] of Object.entries(columns) as [keyof LeadUpdate,string][]) if (key in update) { values.push(update[key]); fields.push(`${column} = $${values.length}`); }
  if (!fields.length) return getLead(id, db);
  values.push(id); const result = await db.query(`update crm_leads set ${fields.join(", ")}, updated_at = now() where id = $${values.length} returning *`, values);
  return result.rows[0] ? map(result.rows[0]) : null;
}

export function isFollowUpDue(lead: LeadRecord, now = new Date()) { return Boolean(lead.followUpAt && new Date(lead.followUpAt) <= now && lead.outcome === "open"); }

/** @deprecated Use the protected /crm route. Kept so unrelated internal tooling continues to compile. */
export async function readLeads() { return listLeads(); }
/** @deprecated Legacy internal-tool authorization; CRM uses signed sessions. */
export function internalToolsAllowed(searchToken?: string) {
  if (process.env.NODE_ENV !== "production") return true;
  const expected=process.env.INTERNAL_TOOLS_TOKEN;
  return process.env.ENABLE_INTERNAL_TOOLS === "true" && Boolean(expected && searchToken === expected);
}
