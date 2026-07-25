import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCrmPageAccess } from "@/lib/crm-access";
import { getAuditPackage } from "@/lib/audits";
import { getLead } from "@/lib/acquisition/leads";
import CrmSignOut from "../../CrmSignOut";
import AuditEditor from "./AuditEditor";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCrmPageAccess();
  const data = await getAuditPackage((await params).id);
  if (!data) notFound();
  const lead = await getLead(data.audit.leadId);
  if (!lead) notFound();
  return (
    <main className="section simple-page crm-page">
      <div className="crm-auth-actions">
        <Link href={`/crm/leads/${lead.id}`}>← {lead.businessName}</Link>
        <CrmSignOut />
      </div>
      <p className="kicker kicker-gold">Measured website audit</p>
      <h1>{data.audit.finalUrl || data.audit.targetUrl}</h1>
      <AuditEditor initial={data.audit} initialFindings={data.findings} />
    </main>
  );
}
