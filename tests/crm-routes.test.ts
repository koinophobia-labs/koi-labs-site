import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as listLeads } from "../app/api/crm/leads/route";
import { PATCH as updateLead } from "../app/api/crm/leads/[id]/route";
import { validateIntake } from "../lib/acquisition/intake";

test("intake route validation accepts a complete CRM lead", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name:"Route Test", businessName:"Route Test Co", email:"route@example.com", websiteOrSocial:"https://example.com", industry:"Services", serviceInterest:"Website audit", timeline:"Soon", biggestProblem:"Conversions" })) form.set(key, value);
  const parsed = validateIntake(form);
  assert.equal(parsed.errors, undefined);
  assert.equal(parsed.input?.businessName, "Route Test Co");
});

test("protected lead list rejects a request without a session", async () => {
  const response = await listLeads(new NextRequest("https://example.com/api/crm/leads"));
  assert.equal(response.status, 401);
});

test("protected update rejects a request without a session", async () => {
  const request = new NextRequest("https://example.com/api/crm/leads/lead-id", { method:"PATCH", body:JSON.stringify({ status:"contacted" }), headers:{ "content-type":"application/json" } });
  const response = await updateLead(request, { params:Promise.resolve({ id:"lead-id" }) });
  assert.equal(response.status, 401);
});
