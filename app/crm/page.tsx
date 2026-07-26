import Link from "next/link";
import { requireCrmPageAccess } from "@/lib/crm-access";
import { leadStatuses, listLeads } from "@/lib/acquisition/leads";
import { serviceLabel } from "@/lib/concierge/questions";
import CrmSignOut from "./CrmSignOut";

export const dynamic = "force-dynamic";

export default async function Crm({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; sort?: string }> }) {
  await requireCrmPageAccess();
  const params = await searchParams;
  let leads;
  try { leads = await listLeads(params); } catch { return <main className="section simple-page"><h1>Lead CRM</h1><p role="alert">The lead database is temporarily unavailable.</p></main>; }
  return <main className="section simple-page crm-page">
    <div className="crm-auth-actions"><p className="kicker kicker-gold">Private workspace</p><CrmSignOut /></div>
    <h1>Lead CRM</h1>
    <form className="crm-filters"><input name="search" defaultValue={params.search} placeholder="Search person, business, or email" /><select name="status" defaultValue={params.status || ""}><option value="">All statuses</option>{leadStatuses.map((status) => <option key={status}>{status}</option>)}</select><select name="sort" defaultValue={params.sort || "newest"}><option value="newest">Newest</option><option value="follow-up">Follow-up date</option></select><button className="btn btn-cyan">Apply</button></form>
    {leads.length ? <div className="lead-table-wrap panel"><table className="lead-table"><thead><tr><th>Business</th><th>Contact</th><th>Qualification</th><th>Status</th><th>Follow-up</th><th>Created</th><th /></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><strong>{lead.businessName}</strong><span>{lead.name}</span>{lead.concierge ? <span className="crm-source-badge">AI concierge</span> : null}{!lead.isProspect ? <span className="crm-source-badge">Non-prospect</span> : null}</td><td><a href={`mailto:${lead.email}`}>{lead.email}</a></td><td>{lead.founderPacket ? <div className="crm-signal"><strong>{lead.founderPacket.recommendedOffer.service}</strong><span>{lead.founderPacket.disposition.label}</span><b>{lead.founderPacket.recommendedOffer.confidenceLevel} confidence</b></div> : lead.concierge ? <div className="crm-signal"><strong>{serviceLabel(lead.concierge.recommendedService)}</strong><span>{Math.round(lead.concierge.recommendationConfidence * 100)}% confidence</span>{lead.concierge.requiresHumanReview ? <b>Review required</b> : null}</div> : <span>{lead.serviceInterest}</span>}</td><td>{lead.status}</td><td>{lead.followUpAt ? new Date(lead.followUpAt).toLocaleDateString() : "—"}</td><td>{new Date(lead.createdAt).toLocaleDateString()}</td><td><Link href={`/crm/leads/${lead.id}`}>Open</Link></td></tr>)}</tbody></table></div> : <div className="panel"><h2>No leads found</h2><p>New valid intake submissions will appear here automatically.</p></div>}
  </main>;
}
