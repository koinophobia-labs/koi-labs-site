import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCrmPageAccess } from "@/lib/crm-access";
import { getProposal } from "@/lib/proposals";
import { getLead } from "@/lib/acquisition/leads";
import CrmSignOut from "../../CrmSignOut";
import ProposalEditor from "./ProposalEditor";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCrmPageAccess();
  const proposal = await getProposal((await params).id);
  if (!proposal) notFound();
  const lead = await getLead(proposal.leadId);
  if (!lead) notFound();
  return (
    <main className="section simple-page crm-page">
      <div className="crm-auth-actions">
        <Link href={`/crm/leads/${lead.id}`}>← {lead.businessName}</Link>
        <CrmSignOut />
      </div>
      <p className="kicker kicker-gold">Proposal v{proposal.version}</p>
      <h1>{proposal.title}</h1>
      <ProposalEditor initial={proposal} clientName={lead.businessName} />
    </main>
  );
}
