import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as intakeRoute } from "../app/api/intake/route";
import { intakeOutcome } from "../lib/acquisition/intake";
import { intakeServiceOptions } from "../lib/acquisition/intake-options";
import {
  AUDIT_PRICE_LABEL,
  AUDIT_SERVICE_INTEREST,
  auditDeliverables,
  auditMeasuredAreas,
  auditSteps,
} from "../lib/audit-offer";
import { scoreCategories } from "../lib/audit-scoring";
import { metadata as auditMetadata } from "../app/audit/page";
import { metadata as homeMetadata } from "../app/page";

test("business funnel pages publish authoritative production canonicals", () => {
  assert.equal(homeMetadata.alternates?.canonical, "https://koinophobialabs.com/");
  assert.equal(auditMetadata.alternates?.canonical, "https://koinophobialabs.com/audit");
});

test("a saved lead is a success even when the notification email is unconfigured", () => {
  const outcome = intakeOutcome(true, false);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.status, 200);
  assert.equal(outcome.ok && outcome.emailSent, false);
  assert.match(outcome.message, /Intake received/);
  assert.doesNotMatch(outcome.message, /emailed to Blake/);
});

test("a saved lead with a delivered email reports the email", () => {
  const outcome = intakeOutcome(true, true);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.ok && outcome.emailSent, true);
  assert.match(outcome.message, /emailed to Blake/);
});

test("an unsaved lead is the only user-facing intake failure", () => {
  const outcome = intakeOutcome(false, true);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.status, 503);
  assert.match(outcome.message, /email fallback/);
});

test("intake route rejects honeypot submissions before touching storage", async () => {
  const form = new FormData();
  form.set("companyWebsite", "https://spam.example.com");
  const response = await intakeRoute(
    new NextRequest("https://example.com/api/intake", { method: "POST", body: form, headers: { "sec-fetch-site": "same-origin" } }),
  );
  assert.equal(response.status, 400);
});

test("intake route returns field errors for an incomplete submission", async () => {
  const form = new FormData();
  form.set("name", "Missing Everything Else");
  const response = await intakeRoute(
    new NextRequest("https://example.com/api/intake", { method: "POST", body: form, headers: { "sec-fetch-site": "same-origin" } }),
  );
  assert.equal(response.status, 422);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.ok(payload.errors.businessName);
});

test("the audit landing preselects a service the intake form actually offers", () => {
  assert.ok(intakeServiceOptions.includes(AUDIT_SERVICE_INTEREST));
});

test("the audit offer promises exactly the categories the audit engine measures", () => {
  assert.equal(auditMeasuredAreas.length, scoreCategories.length);
  assert.equal(new Set(auditMeasuredAreas).size, scoreCategories.length);
  for (const area of auditMeasuredAreas) assert.ok(area.trim().length > 0);
});

test("the audit steps state the Stripe payment handoff and the credit", () => {
  const text = auditSteps.map((step) => `${step.title} ${step.body}`).join(" ");
  assert.match(text, /Stripe/);
  assert.match(text, /credited/);
  assert.ok(text.includes(AUDIT_PRICE_LABEL));
  assert.equal(auditSteps.length, 4);
});

test("the audit deliverables describe the real report artifacts", () => {
  const text = auditDeliverables.join(" ");
  assert.match(text, /PDF/);
  assert.match(text, /priority|prioriti/i);
});
