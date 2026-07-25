alter table crm_leads
  add column if not exists founder_packet jsonb not null default '{}',
  add column if not exists is_prospect boolean not null default true,
  add column if not exists non_prospect_reason text not null default '';

create index if not exists crm_leads_founder_disposition_idx
  on crm_leads((founder_packet->'disposition'->>'label'), created_at desc)
  where founder_packet ? 'disposition';

create index if not exists crm_leads_prospect_status_idx
  on crm_leads(is_prospect, created_at desc);
