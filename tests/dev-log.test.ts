import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LOG_SURFACES,
  latestLogEntries,
  logEntries,
  logKindLabel,
  logLastUpdated,
  logProductLabel,
  orderedLogEntries,
} from "../lib/dev/log";
import { getProduct } from "../lib/dev/universe";

// The build log publishes factual claims about real release history. These
// tests hold it to the same bar as the product universe: dated, sourced,
// specific, and never quietly optimistic.

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");

test("every entry is complete: date, title, surface, and all three record fields", () => {
  assert.ok(logEntries.length >= 8, "the log should open with a real backfill, not a stub");
  for (const entry of logEntries) {
    assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/, `${entry.slug} needs an ISO date`);
    assert.ok(entry.title.trim().length > 8, `${entry.slug} needs a real title`);
    assert.ok(logKindLabel[entry.kind], `${entry.slug} has an unknown kind`);
    for (const field of ["what", "why", "next"] as const) {
      assert.ok(
        entry[field].trim().length > 20,
        `${entry.slug}.${field} is too thin to be a record`,
      );
    }
  }
});

test("entry slugs are unique", () => {
  const slugs = logEntries.map((e) => e.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate log slug");
});

test("every entry belongs to a real surface", () => {
  for (const entry of logEntries) {
    const isSurface = (LOG_SURFACES as readonly string[]).includes(entry.product);
    assert.ok(
      isSurface || getProduct(entry.product),
      `${entry.slug} claims surface "${entry.product}", which resolves to nothing`,
    );
    assert.ok(logProductLabel(entry).length > 0);
  }
});

test("the source array is already newest-first", () => {
  // orderedLogEntries re-sorts defensively; the file itself must not rely on it.
  assert.deepEqual(
    logEntries.map((e) => e.slug),
    orderedLogEntries.map((e) => e.slug),
    "logEntries is out of chronological order — newest first is the file's contract",
  );
});

test("no entry is dated in the future", () => {
  // Published dates are human-typed literals; comparing against the clock here
  // is measurement, not publication (same rule as checkFreshness).
  for (const entry of logEntries) {
    assert.ok(
      Date.parse(entry.date) <= Date.now(),
      `${entry.slug} is dated ${entry.date}, which hasn't happened`,
    );
  }
});

test("published dates are literals, never read from the clock", () => {
  const source = read("lib/dev/log.ts");
  assert.doesNotMatch(
    source,
    /(date|LastUpdated)\s*:\s*(new Date|Date\.now|.*toISOString)/i,
    "a published date is being generated at runtime — it must be a literal a human typed",
  );
  assert.ok(logLastUpdated.length > 0);
});

test("specific claims carry evidence with checkable sources", () => {
  for (const entry of logEntries) {
    for (const item of entry.evidence ?? []) {
      assert.ok(item.claim.trim().length > 0, `${entry.slug}: evidence entry with no claim`);
      assert.ok(
        item.source.trim().length > 12,
        `${entry.slug}: evidence "${item.claim}" needs a checkable source, not a gesture`,
      );
    }
    // Delivery UUIDs, commit SHAs, and scores are the load-bearing specifics —
    // an entry that cites them must point somewhere.
    const prose = `${entry.what} ${entry.why} ${entry.next}`;
    if (/\b[0-9a-f]{7,8}\b|\bUUID|\b\d{2}\/100\b/.test(prose)) {
      assert.ok(
        (entry.evidence ?? []).length > 0,
        `${entry.slug} cites artifacts in prose but carries no evidence block`,
      );
    }
  }
});

test("the log never uses launch language or unsourced statistics", () => {
  const bannedLaunch = [/\blaunched\b/i, /\bavailable now\b/i, /\bgenerally available\b/i];
  const bannedStats = [/2\.36%/, /4,500 simulated/, /460 topics/, /16[–-]27%/];
  for (const entry of logEntries) {
    const prose = `${entry.title} ${entry.what} ${entry.why} ${entry.next}`;
    for (const pattern of bannedLaunch) {
      assert.doesNotMatch(prose, pattern, `${entry.slug} uses launch language`);
    }
    for (const pattern of bannedStats) {
      assert.doesNotMatch(prose, pattern, `${entry.slug} republishes an unsourced statistic`);
    }
  }
});

test("the record is never trimmed to look better", () => {
  // Mirrors the field-notes rule: corrections are new entries, not deletions.
  // The backfill established the floor; the count may only grow.
  assert.ok(
    logEntries.length >= 12,
    "the log shrank below its 2026-07-26 backfill — entries are corrected, never removed",
  );
});

test("the log page discloses the backfill and renders every entry", () => {
  const page = read("app/dev/log/page.tsx");
  assert.match(page, /[Bb]ackfilled/, "the page must say pre-launch entries were backfilled");
  assert.match(page, /orderedLogEntries/, "the page must render the defensively-sorted list");
});

test("the homepage strip renders the latest entries from this file", () => {
  const home = read("app/home/page.tsx");
  assert.match(home, /latestLogEntries\(/, "the homepage must derive its strip from the log");
  assert.deepEqual(
    latestLogEntries(3).map((e) => e.slug),
    orderedLogEntries.slice(0, 3).map((e) => e.slug),
  );
});

test("/log is wired into nav, routing, and the sitemap", () => {
  assert.match(read("components/dev/DevShell.tsx"), /href: "\/log"/, "Log missing from DEV_NAV");
  assert.match(read("next.config.ts"), /"\/log"/, "/log missing from DEV_ROUTES");
  assert.match(
    read("app/dev-sitemap.xml/route.ts"),
    /path: "\/log"/,
    "/log missing from the personal sitemap",
  );
});
