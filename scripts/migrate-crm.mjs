import fs from "node:fs"; import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  for (const name of ["001_crm_leads.sql", "002_crm_proposals.sql", "003_crm_audits.sql", "004_audit_remediation.sql", "005_audit_release.sql", "006_stripe_payments.sql", "007_ai_project_concierge.sql", "008_founder_sales_packet.sql"]) {
    await pool.query(fs.readFileSync(new URL(`../db/${name}`, import.meta.url), "utf8"));
    console.log(`CRM migration ${name} applied successfully.`);
  }
} finally { await pool.end(); }
