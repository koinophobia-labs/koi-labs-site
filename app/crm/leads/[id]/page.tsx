import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLead, leadOutcomes, leadStatuses } from "@/lib/acquisition/leads";
import { listAudits } from "@/lib/audits";
import { CRM_COOKIE, verifyCrmSession } from "@/lib/crm-auth";
import { serviceLabel } from "@/lib/concierge/questions";
import { listProposals } from "@/lib/proposals";
import AuditRunner from "./AuditRunner";
import LeadEditor from "./LeadEditor";
import ProposalCreator from "./ProposalCreator";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!verifyCrmSession((await cookies()).get(CRM_COOKIE)?.value)) redirect("/crm/login");
  const lead = await getLead((await params).id);
  if (!lead) notFound();
  const [proposals, audits] = await Promise.all([listProposals(lead.id), listAudits(lead.id)]);
  return <main className="section simple-page crm-page">
    <Link href="/crm">← All leads</Link><p className="kicker kicker-gold">Lead detail</p><h1>{lead.businessName}</h1>
    <div className="panel crm-detail"><p><strong>{lead.name}</strong> · <a href={`mailto:${lead.email}`}>{lead.email}</a> · {lead.phone || "No phone"}</p><p><a href={lead.websiteOrSocial}>{lead.websiteOrSocial}</a> · {lead.industry}</p><h2>What they need</h2><p>{lead.serviceInterest} · {lead.budgetRange || "Budget not supplied"} · {lead.timeline}</p><p>{lead.biggestProblem}</p>{lead.notes && <p>{lead.notes}</p>}</div>
    {lead.founderPacket ? <section className="panel crm-concierge">
      <div className="crm-concierge__head"><div><span className="crm-source-badge">Founder sales packet · Internal only</span><h2>{lead.founderPacket.disposition.label}</h2></div><div><strong>{lead.founderPacket.recommendedOffer.confidenceLevel}</strong><span>{Math.round(lead.founderPacket.recommendedOffer.confidenceScore * 100)}% confidence</span></div></div>
      {!lead.isProspect ? <p className="crm-review-flag">Non-prospect: {lead.nonProspectReason}</p> : null}
      <p>{lead.founderPacket.disposition.reason}</p>
      <h3>Problem summary</h3>
      <dl className="crm-concierge__facts"><div><dt>Struggling with</dt><dd>{lead.founderPacket.problemSummary.struggle}</dd></div><div><dt>Desired outcome</dt><dd>{lead.founderPacket.problemSummary.desiredOutcome}</dd></div><div><dt>Current blocker</dt><dd>{lead.founderPacket.problemSummary.currentBlocker}</dd></div><div><dt>Urgency</dt><dd>{lead.founderPacket.problemSummary.urgency}</dd></div></dl>
      <h3>Recommended offer</h3>
      <p><strong>{lead.founderPacket.recommendedOffer.service}</strong> · {lead.founderPacket.recommendedOffer.price} · {lead.founderPacket.recommendedOffer.estimatedTimeline}</p>
      <p>{lead.founderPacket.recommendedOffer.whyItFits}</p>
      {lead.founderPacket.recommendedOffer.readinessRisk ? <p className="crm-review-flag">{lead.founderPacket.recommendedOffer.readinessRisk}</p> : null}
      <h3>Suggested scope</h3>
      {lead.founderPacket.recommendedOffer.suggestedScope.length ? <ul>{lead.founderPacket.recommendedOffer.suggestedScope.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No implementation scope recommended yet.</p>}
      <h3>Missing information</h3>
      {lead.founderPacket.missingInformation.length ? <ol>{lead.founderPacket.missingInformation.map((question) => <li key={question}>{question}</li>)}</ol> : <p>None identified before starting.</p>}
      <h3>Founder reply draft</h3>
      <p className="crm-review-flag">Draft only. Nothing has been sent to the lead.</p>
      <textarea
        className="crm-reply-draft"
        aria-label="Editable founder reply draft"
        defaultValue={lead.founderPacket.founderReplyDraft}
        rows={12}
      />
    </section> : null}
    {lead.concierge ? <section className="panel crm-concierge"><div className="crm-concierge__head"><div><span className="crm-source-badge">AI project concierge</span><h2>{serviceLabel(lead.concierge.recommendedService)}</h2></div><div><strong>{Math.round(lead.concierge.recommendationConfidence * 100)}%</strong><span>{lead.concierge.recommendationSource.replaceAll("_", " ")}</span></div></div>{lead.concierge.requiresHumanReview ? <p className="crm-review-flag">Human review required before a service recommendation is confirmed.</p> : null}<h3>Qualification summary</h3><p>{lead.concierge.qualificationSummary}</p><dl className="crm-concierge__facts"><div><dt>Main problem</dt><dd>{lead.concierge.visitorPrimaryProblem}</dd></div><div><dt>Desired outcome</dt><dd>{lead.concierge.desiredOutcome}</dd></div><div><dt>Budget and timing</dt><dd>{lead.concierge.budgetRange} · {lead.concierge.timeline}</dd></div><div><dt>Current tools</dt><dd>{lead.concierge.currentTools.join(", ") || "Not provided"}</dd></div></dl><h3>Recommendation reasons</h3><ul>{lead.concierge.recommendationReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><details className="crm-concierge__answers"><summary>Original concierge answers</summary><dl>{Object.entries(lead.concierge.answers).filter(([key]) => !["email", "companyWebsite"].includes(key)).map(([key, answer]) => <div key={key}><dt>{key.replaceAll(/([A-Z])/g, " $1")}</dt><dd>{answer || "Not provided"}</dd></div>)}</dl></details></section> : null}
    <section className="panel crm-proposals"><h2>Website audits</h2><AuditRunner leadId={lead.id} defaultUrl={lead.websiteOrSocial} />{audits.length ? <table className="lead-table"><thead><tr><th>Date</th><th>Target</th><th>Status</th><th>Findings</th></tr></thead><tbody>{audits.map((audit) => <tr key={audit.id}><td>{new Date(audit.createdAt).toLocaleDateString()}</td><td><Link href={`/crm/audits/${audit.id}`}>{audit.finalUrl || audit.targetUrl}</Link></td><td><span className="crm-status">{audit.status}</span></td><td>{audit.findings.length}</td></tr>)}</tbody></table> : <p>No audits yet.</p>}</section>
    <section className="panel crm-proposals"><h2>Proposals</h2><ProposalCreator leadId={lead.id} />{proposals.length ? <table className="lead-table"><thead><tr><th>Version</th><th>Title</th><th>Status</th><th>Updated</th></tr></thead><tbody>{proposals.map((proposal) => <tr key={proposal.id}><td>v{proposal.version}</td><td><Link href={`/crm/proposals/${proposal.id}`}>{proposal.title}</Link></td><td><span className="crm-status">{proposal.status}</span></td><td>{new Date(proposal.updatedAt).toLocaleDateString()}</td></tr>)}</tbody></table> : <p>No proposals yet.</p>}</section>
    <LeadEditor lead={lead} statuses={leadStatuses} outcomes={leadOutcomes} />
  </main>;
}
