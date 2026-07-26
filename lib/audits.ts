import { Pool, type PoolClient, type QueryResultRow } from "pg";
export const auditStatuses = ["queued", "running", "completed", "failed", "cancelled", "draft", "ready"] as const;
export const findingSeverities = [
  "critical",
  "high",
  "medium",
  "low",
  "positive",
  "info",
] as const;
export const findingCategories = [
  "security",
  "seo",
  "mobile",
  "accessibility",
  "performance",
  "links",
  "content",
] as const;
export type AuditStatus = (typeof auditStatuses)[number];
export type FindingSeverity = (typeof findingSeverities)[number];
export type FindingCategory = (typeof findingCategories)[number];
export type AuditFinding = {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  evidence: string;
  recommendation: string;
  measured: boolean;
  selectedForProposal: boolean;
};
export type AuditMetrics = {
  httpStatus?: number;
  https?: boolean;
  responseMs?: number;
  htmlBytes?: number;
  title?: string;
  descriptionLength?: number;
  h1Count?: number;
  images?: number;
  imagesMissingAlt?: number;
  forms?: number;
  unlabeledFields?: number;
  brokenLinks?: number;
  redirected?: boolean;
  measurementNote: string;
};
export type AuditRecord = {
  id: string;
  leadId: string;
  status: AuditStatus;
  targetUrl: string;
  finalUrl: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  summary: string;
  findings: AuditFinding[];
  metrics: AuditMetrics;
  pagesChecked: number;
  linksChecked: number;
  internalNotes: string;
  errorMessage: string | null;
  normalizedDomain?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  archivedAt?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  retryCount?: number;
  retriedFromAuditId?: string | null;
  pagesRequested?: number;
  pagesScanned?: number;
  progressCurrent?: number;
  progressTotal?: number;
  progressMessage?: string;
  reportVersion?: number;
  scores?: unknown;
  scoringInputs?: unknown;
  scoringVersion?: string;
};
export type Queryable = {
  query(sql: string, values?: unknown[]): Promise<{ rows: QueryResultRow[]; rowCount?: number | null }>;
};
let pool: Pool | undefined;
const db = () => {
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is not configured");
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  })) as unknown as Queryable;
};
const map = (r: QueryResultRow): AuditRecord => ({
  id: r.id,
  leadId: r.lead_id,
  status: r.status,
  targetUrl: r.target_url,
  finalUrl: r.final_url,
  startedAt: new Date(r.started_at).toISOString(),
  completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
  createdAt: new Date(r.created_at).toISOString(),
  updatedAt: new Date(r.updated_at).toISOString(),
  summary: r.summary,
  findings: r.findings,
  metrics: r.metrics,
  pagesChecked: r.pages_checked,
  linksChecked: r.links_checked,
  internalNotes: r.internal_notes,
  errorMessage: r.error_message,
  normalizedDomain: r.normalized_domain ?? null,
  failedAt: r.failed_at ? new Date(r.failed_at).toISOString() : null,
  cancelledAt: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : null,
  archivedAt: r.archived_at ? new Date(r.archived_at).toISOString() : null,
  failureCode: r.failure_code ?? null,
  failureMessage: r.failure_message ?? null,
  retryCount: r.retry_count ?? 0,
  retriedFromAuditId: r.retried_from_audit_id ?? null,
  pagesRequested: r.pages_requested ?? 1,
  pagesScanned: r.pages_scanned ?? r.pages_checked ?? 0,
  progressCurrent: r.progress_current ?? 0,
  progressTotal: r.progress_total ?? 1,
  progressMessage: r.progress_message ?? "Queued",
  reportVersion: r.report_version ?? 2,
  scores: r.scores ?? {},
  scoringInputs: r.scoring_inputs ?? {},
  scoringVersion: r.scoring_version ?? "audit-score-v1",
});
export async function createAudit(
  leadId: string,
  targetUrl: string,
  q: Queryable = db(),
) {
  const r = await q.query(
    "insert into crm_audits(id,lead_id,status,target_url,progress_message) values($1,$2,'running',$3,'Running') returning *",
    [crypto.randomUUID(), leadId, targetUrl],
  );
  return map(r.rows[0]);
}
export async function completeAudit(
  id: string,
  data: {
    finalUrl: string;
    summary: string;
    findings: AuditFinding[];
    metrics: AuditMetrics;
    pagesChecked: number;
    linksChecked: number;
  },
  q: Queryable = db(),
) {
  const r = await q.query(
    "update crm_audits set status='completed',final_url=$1,summary=$2,findings=$3,metrics=$4,pages_checked=$5,links_checked=$6,pages_scanned=$5,completed_at=now(),progress_current=progress_total,progress_message='Completed',updated_at=now(),error_message=null where id=$7 and status='running' returning *",
    [
      data.finalUrl,
      data.summary,
      JSON.stringify(data.findings),
      JSON.stringify(data.metrics),
      data.pagesChecked,
      data.linksChecked,
      id,
    ],
  );
  return map(r.rows[0]);
}
export async function failAudit(
  id: string,
  message: string,
  q: Queryable = db(),
) {
  await q.query(
    "update crm_audits set status='failed',error_message=$1,failure_code='AUDIT_EXECUTION_FAILED',failure_message=$1,failed_at=now(),updated_at=now() where id=$2 and status='running'",
    [message.slice(0, 1000), id],
  );
}
export async function getAudit(id: string, q: Queryable = db()) {
  const r = await q.query("select * from crm_audits where id=$1", [id]);
  return r.rows[0] ? map(r.rows[0]) : null;
}
export async function listAudits(leadId: string, q: Queryable = db()) {
  const r = await q.query(
    "select * from crm_audits where lead_id=$1 order by created_at desc",
    [leadId],
  );
  return r.rows.map(map);
}
export function validateAuditEdit(v: unknown) {
  if (!v || typeof v !== "object") return { errors: ["Invalid audit"] };
  const r = v as Record<string, unknown>,
    errors: string[] = [];
  if (
    typeof r.summary !== "string" ||
    !r.summary.trim() ||
    r.summary.length > 10000
  )
    errors.push("Invalid summary");
  const findings = Array.isArray(r.findings)
    ? r.findings.flatMap((x) => {
        if (!x || typeof x !== "object") return [];
        const f = x as Record<string, unknown>;
        return typeof f.id === "string" &&
          findingCategories.includes(f.category as FindingCategory) &&
          findingSeverities.includes(f.severity as FindingSeverity) &&
          typeof f.title === "string" &&
          f.title.trim() &&
          typeof f.evidence === "string" &&
          f.evidence.trim() &&
          typeof f.recommendation === "string" &&
          f.recommendation.trim() &&
          typeof f.measured === "boolean" &&
          typeof f.selectedForProposal === "boolean"
          ? [f as AuditFinding]
          : [];
      })
    : [];
  if (
    !findings.length ||
    findings.length !== (r.findings as unknown[])?.length ||
    findings.length > 100
  )
    errors.push("Invalid findings");
  if (typeof r.internalNotes !== "string" || r.internalNotes.length > 10000)
    errors.push("Invalid internalNotes");
  return errors.length
    ? { errors }
    : {
        edit: {
          summary: (r.summary as string).trim(),
          findings,
          internalNotes: r.internalNotes as string,
        },
      };
}
export async function updateAudit(
  id: string,
  edit: { summary: string; findings: AuditFinding[]; internalNotes: string },
  q: Queryable = db(),
) {
  const r = await q.query(
    "update crm_audits set summary=$1,findings=$2,internal_notes=$3,updated_at=now() where id=$4 and status='completed' returning *",
    [edit.summary, JSON.stringify(edit.findings), edit.internalNotes, id],
  );
  return r.rows[0] ? map(r.rows[0]) : null;
}
export async function setAuditStatus(
  id: string,
  status: AuditStatus,
  q: Queryable = db(),
) {
  if (!["draft", "ready"].includes(status)) throw Error("INVALID_STATUS");
  const r = await q.query(
    "update crm_audits set status=$1,updated_at=now() where id=$2 and status in ('draft','ready') returning *",
    [status, id],
  );
  return r.rows[0] ? map(r.rows[0]) : null;
}

export const normalizedFindingCategories = ["security","seo","mobile","accessibility","performance","broken_links","conversion","contact_visibility","content_clarity"] as const;
export const normalizedFindingSeverities = ["critical","high","medium","low","informational","positive"] as const;
export const findingProvenances = ["measured","heuristic","founder"] as const;
export type MeasurementRecord = { id:string;auditId:string;pageUrl:string;category:string;metricKey:string;value:unknown;available:boolean;capturedAt:string };
export type NormalizedFindingRecord = { id:string;auditId:string;category:(typeof normalizedFindingCategories)[number];severity:(typeof normalizedFindingSeverities)[number];title:string;description:string;evidence:string;impact:string;recommendation:string;pageUrl:string|null;provenance:(typeof findingProvenances)[number];clientVisible:boolean;selectedForProposal:boolean;sortOrder:number;createdAt:string;updatedAt:string };
export type NewFinding = Omit<NormalizedFindingRecord,"id"|"auditId"|"createdAt"|"updatedAt"|"sortOrder"> & { sortOrder?:number };
const activeStatuses = ["queued","running"] as const;
const terminalStatuses = ["completed","failed","cancelled"] as const;
const transitions: Record<string, readonly string[]> = { queued:["running","cancelled"], running:["completed","failed","cancelled"], completed:[], failed:[], cancelled:[] };
const iso=(v:unknown)=>v ? new Date(v as string|number|Date).toISOString() : null;
const mapMeasurement=(r:QueryResultRow):MeasurementRecord=>({id:r.id,auditId:r.audit_id,pageUrl:r.page_url,category:r.category,metricKey:r.metric_key,value:r.value,available:r.available,capturedAt:iso(r.captured_at)!});
const mapFinding=(r:QueryResultRow):NormalizedFindingRecord=>({id:r.id,auditId:r.audit_id,category:r.category,severity:r.severity,title:r.title,description:r.description,evidence:r.evidence,impact:r.impact,recommendation:r.recommendation,pageUrl:r.page_url,provenance:r.provenance,clientVisible:r.client_visible,selectedForProposal:r.selected_for_proposal,sortOrder:r.sort_order,createdAt:iso(r.created_at)!,updatedAt:iso(r.updated_at)!});
function assertInt(value:number,min:number,max:number,name:string){if(!Number.isInteger(value)||value<min||value>max)throw Error(`INVALID_${name.toUpperCase()}`)}
function normalizeDomain(url:string){const u=new URL(url);return u.hostname.toLowerCase().replace(/\.$/,"")}

export async function createQueuedAudit(input:{leadId:string;targetUrl:string;normalizedDomain?:string;pagesRequested?:number;reportVersion?:number;retriedFromAuditId?:string|null;retryCount?:number},q:Queryable=db()){
 const pages=input.pagesRequested??1,version=input.reportVersion??2;assertInt(pages,1,10,"pages_requested");assertInt(version,1,1000,"report_version");
 const r=await q.query("insert into crm_audits(id,lead_id,status,target_url,normalized_domain,pages_requested,progress_total,report_version,retried_from_audit_id,retry_count,progress_message) values($1,$2,'queued',$3,$4,$5,$5,$6,$7,$8,'Queued') returning *",[crypto.randomUUID(),input.leadId,input.targetUrl,input.normalizedDomain??normalizeDomain(input.targetUrl),pages,version,input.retriedFromAuditId??null,input.retryCount??0]);return map(r.rows[0]);
}
export const getAuditById=getAudit;
export const listAuditHistoryForLead=listAudits;
async function lifecycleTransition(id:string,from:readonly string[],to:"running"|"completed"|"failed"|"cancelled",sets:string,values:unknown[],q:Queryable){
 if(!from.some(s=>transitions[s]?.includes(to)))throw Error("INVALID_AUDIT_TRANSITION");
 const r=await q.query(`update crm_audits set status='${to}',${sets},updated_at=now() where id=$${values.length+1} and status=any($${values.length+2}::text[]) returning *`,[...values,id,from]);if(!r.rows[0])throw Error("INVALID_AUDIT_TRANSITION");return map(r.rows[0]);
}
export const startQueuedAudit=(id:string,q:Queryable=db())=>lifecycleTransition(id,["queued"],"running","started_at=now(),progress_message='Running'",[],q);
export async function persistAuditProgress(id:string,input:{progressCurrent:number;progressTotal:number;progressMessage:string;pagesScanned:number},q:Queryable=db()){
 assertInt(input.progressTotal,0,10000,"progress_total");assertInt(input.progressCurrent,0,input.progressTotal,"progress_current");assertInt(input.pagesScanned,0,10000,"pages_scanned");
 const r=await q.query("update crm_audits set progress_current=$1,progress_total=$2,progress_message=$3,pages_scanned=$4,updated_at=now() where id=$5 and status='running' returning *",[input.progressCurrent,input.progressTotal,input.progressMessage.slice(0,500),input.pagesScanned,id]);if(!r.rows[0])throw Error("AUDIT_NOT_RUNNING");return map(r.rows[0]);
}
export const markAuditCompleted=(id:string,q:Queryable=db())=>lifecycleTransition(id,["running"],"completed","completed_at=now(),progress_current=progress_total,progress_message='Completed',failure_code=null,failure_message=null",[],q);
export const markAuditFailed=(id:string,code:string,message:string,q:Queryable=db())=>lifecycleTransition(id,["running"],"failed","failed_at=now(),failure_code=$1,failure_message=$2,progress_message='Failed'",[code.slice(0,100),message.slice(0,1000)],q);
export const markAuditCancelled=(id:string,q:Queryable=db())=>lifecycleTransition(id,activeStatuses,"cancelled","cancelled_at=now(),progress_message='Cancelled'",[],q);
export async function setAuditArchived(id:string,archived:boolean,q:Queryable=db()){const r=await q.query(`update crm_audits set archived_at=${archived?"now()":"null"},updated_at=now() where id=$1 returning *`,[id]);return r.rows[0]?map(r.rows[0]):null}
export async function createAuditRetry(id:string,q:Queryable=db()){const source=await getAudit(id,q);if(!source||!terminalStatuses.includes(source.status as typeof terminalStatuses[number]))throw Error("AUDIT_NOT_RETRYABLE");return createQueuedAudit({leadId:source.leadId,targetUrl:source.targetUrl,normalizedDomain:source.normalizedDomain??undefined,pagesRequested:source.pagesRequested,reportVersion:source.reportVersion,retriedFromAuditId:source.id,retryCount:(source.retryCount??0)+1},q)}

export async function bulkInsertMeasurements(auditId:string,items:Array<Omit<MeasurementRecord,"id"|"auditId"|"capturedAt">>,q:Queryable=db()){
 const out:MeasurementRecord[]=[];for(const item of items){const r=await q.query("insert into crm_audit_measurements(id,audit_id,page_url,category,metric_key,value,available) values($1,$2,$3,$4,$5,$6,$7) returning *",[crypto.randomUUID(),auditId,item.pageUrl,item.category,item.metricKey,JSON.stringify(item.value),item.available]);out.push(mapMeasurement(r.rows[0]))}return out;
}
export async function listMeasurements(auditId:string,pageUrl?:string,q:Queryable=db()){const r=await q.query(`select * from crm_audit_measurements where audit_id=$1${pageUrl?" and page_url=$2":""} order by captured_at,id`,pageUrl?[auditId,pageUrl]:[auditId]);return r.rows.map(mapMeasurement)}
export async function bulkInsertFindings(auditId:string,items:NewFinding[],q:Queryable=db()){const out:NormalizedFindingRecord[]=[];for(let i=0;i<items.length;i++)out.push(await insertFinding(auditId,items[i],items[i].sortOrder??i,q));return out}
async function insertFinding(auditId:string,item:NewFinding,order:number,q:Queryable){const r=await q.query("insert into crm_audit_findings(id,audit_id,category,severity,title,description,evidence,impact,recommendation,page_url,provenance,client_visible,selected_for_proposal,sort_order) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *",[crypto.randomUUID(),auditId,item.category,item.severity,item.title,item.description,item.evidence,item.impact,item.recommendation,item.pageUrl,item.provenance,item.clientVisible,item.selectedForProposal,order]);return mapFinding(r.rows[0])}
export function createFounderFinding(auditId:string,item:Omit<NewFinding,"provenance">,q:Queryable=db()){return insertFinding(auditId,{...item,provenance:"founder"},item.sortOrder??0,q)}
export async function updateFinding(id:string,edit:Partial<Pick<NormalizedFindingRecord,"title"|"description"|"evidence"|"impact"|"recommendation"|"severity"|"clientVisible"|"selectedForProposal">>,q:Queryable=db()){
 const allowed={title:"title",description:"description",evidence:"evidence",impact:"impact",recommendation:"recommendation",severity:"severity",clientVisible:"client_visible",selectedForProposal:"selected_for_proposal"} as const,entries=Object.entries(edit).filter(([k])=>k in allowed);if(!entries.length)throw Error("EMPTY_FINDING_EDIT");const values=entries.map(([,v])=>v),sets=entries.map(([k],i)=>`${allowed[k as keyof typeof allowed]}=$${i+1}`).join(",");const r=await q.query(`update crm_audit_findings set ${sets},updated_at=now() where id=$${values.length+1} returning *`,[...values,id]);return r.rows[0]?mapFinding(r.rows[0]):null;
}
export async function reorderFindings(auditId:string,orderedIds:string[],client:PoolClient){await client.query("begin");try{for(let i=0;i<orderedIds.length;i++){const r=await client.query("update crm_audit_findings set sort_order=$1,updated_at=now() where id=$2 and audit_id=$3",[i,orderedIds[i],auditId]);if(r.rowCount!==1)throw Error("INVALID_FINDING_ORDER")}await client.query("commit")}catch(e){await client.query("rollback");throw e}}
export async function reorderFindingsAtomic(auditId:string,orderedIds:string[],q:Queryable=db()){if(!orderedIds.length||new Set(orderedIds).size!==orderedIds.length)throw Error("INVALID_FINDING_ORDER");const r=await q.query("with requested as (select id,ord-1 as sort_order from unnest($2::uuid[]) with ordinality as x(id,ord)), updated as (update crm_audit_findings f set sort_order=requested.sort_order,updated_at=now() from requested where f.audit_id=$1 and f.id=requested.id returning f.id) select count(*)::int as count from updated",[auditId,orderedIds]);if(Number(r.rows[0]?.count)!==orderedIds.length)throw Error("INVALID_FINDING_ORDER")}
export async function listFindings(auditId:string,filter:{severity?:NormalizedFindingRecord["severity"];clientVisible?:boolean;selectedForProposal?:boolean}={},q:Queryable=db()){const values:unknown[]=[auditId],where=["audit_id=$1"];for(const [column,value] of [["severity",filter.severity],["client_visible",filter.clientVisible],["selected_for_proposal",filter.selectedForProposal]] as const)if(value!==undefined){values.push(value);where.push(`${column}=$${values.length}`)}const r=await q.query(`select * from crm_audit_findings where ${where.join(" and ")} order by sort_order,created_at`,values);return r.rows.map(mapFinding)}

export async function consumeAuditRateLimit(input:{actorKey:string;limit:number;windowSeconds:number;now?:Date},q:Queryable=db()){
 assertInt(input.limit,1,10000,"rate_limit");assertInt(input.windowSeconds,1,86400,"window_seconds");const now=input.now??new Date(),bucket=`${input.actorKey}:${Math.floor(now.getTime()/(input.windowSeconds*1000))}`,start=new Date(Math.floor(now.getTime()/(input.windowSeconds*1000))*input.windowSeconds*1000);
 const r=await q.query("insert into crm_audit_rate_limits(bucket_key,window_started_at,attempts) values($1,$2,1) on conflict(bucket_key) do update set attempts=crm_audit_rate_limits.attempts+1 where crm_audit_rate_limits.attempts<$3 returning attempts,window_started_at",[bucket,start,input.limit]);const consumed=Boolean(r.rows[0]);return{allowed:consumed,remaining:consumed?input.limit-r.rows[0].attempts:0,resetAt:new Date(start.getTime()+input.windowSeconds*1000).toISOString()};
}
export async function persistAuditScoring(id:string,input:{scores:unknown;scoringInputs:unknown;scoringVersion:string;finalUrl:string;summary:string;pagesChecked:number;linksChecked:number},q:Queryable=db()){
 const r=await q.query("update crm_audits set scores=$1,scoring_inputs=$2,scoring_version=$3,final_url=$4,summary=$5,pages_checked=$6,links_checked=$7,updated_at=now() where id=$8 and status='running' returning *",[JSON.stringify(input.scores),JSON.stringify(input.scoringInputs),input.scoringVersion,input.finalUrl,input.summary,input.pagesChecked,input.linksChecked,id]);if(!r.rows[0])throw Error("AUDIT_NOT_RUNNING");return map(r.rows[0]);
}
export async function getAuditPackage(id:string,q:Queryable=db()){const audit=await getAudit(id,q);if(!audit)return null;return{audit,findings:await listFindings(id,{},q),measurements:await listMeasurements(id,undefined,q)}}
export async function linkProposalFindings(proposalId:string,auditId:string,findingIds:string[],q:Queryable=db()){for(const findingId of findingIds)await q.query("insert into crm_proposal_audit_findings(proposal_id,audit_id,finding_id) values($1,$2,$3) on conflict do nothing",[proposalId,auditId,findingId])}
