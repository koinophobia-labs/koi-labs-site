import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("homepage, services, intake, and audit expose intentional concierge entry points", () => {
  for (const file of [
    "app/page.tsx",
    "app/services/page.tsx",
    "app/intake/page.tsx",
    "app/audit/page.tsx",
  ]) {
    assert.match(read(file), /\/concierge\?entry=/);
  }
  assert.match(read("app/page.tsx"), /Bring us a problem/);
  assert.match(read("app/intake/page.tsx"), /Start the standard form/);
});

test("concierge UI is finite, adaptive, recoverable, and accessible by construction", () => {
  const flow = read("components/concierge/ConciergeFlow.tsx");
  assert.match(flow, /Question \{step \+ 1\} of \{CONCIERGE_TOTAL_STEPS\}/);
  assert.match(flow, /branchPrompt\(answers\.problemKind\)/);
  assert.match(flow, /aria-live=/);
  assert.match(flow, /aria-pressed=/);
  assert.match(flow, /focus\(\)/);
  assert.match(flow, /concierge_recovered_session/);
  assert.match(flow, /Prefer the standard form\?/);
  assert.match(flow, /preliminary, AI-assisted recommendation/);
});

test("prefill handoff remains editable and sends server-verifiable concierge data", () => {
  const intake = read("components/acquisition/IntakeForm.tsx");
  assert.match(intake, /conciergeAnswers/);
  assert.match(intake, /conciergeEvaluationToken/);
  assert.match(intake, /Review and edit every field/);
  assert.match(intake, /idempotency-key/);
});

test("concierge is intentionally indexed and included in the sitemap", () => {
  assert.match(
    read("app/concierge/page.tsx"),
    /alternates: \{ canonical: "\/concierge" \}/,
  );
  assert.match(read("app/sitemap.ts"), /"\/concierge"/);
});
