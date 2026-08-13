import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  STAGE_FRESHNESS_DAYS,
  type Stage,
  checkFreshness,
  getProduct,
  products,
  reachLabel,
  stageFamily,
  stageFamilyLabel,
  stageLabel,
  stageRank,
  staleProducts,
  statusOwner,
  universeLastUpdated,
} from "../lib/dev/universe";
import { experiments, getNote, notes, publishedNotes } from "../lib/dev/lab";
import { nowActiveWork, nowLastUpdated } from "../lib/now";

// The koinophobia.dev product universe exists because the site had drifted into
// describing the same product three different ways on three different pages.
//
// The 2026-07-20 reconciliation then found something worse: the "honest"
// correction was ALSO wrong. The site claimed no You Know Ball build had ever
// been uploaded, while Apple's own delivery logs named two it had accepted.
// Overcorrection is harder to catch than overclaiming, because nobody
// fact-checks the sentence that makes you look bad.
//
// So these tests guard evidence, not tone.

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const exists = (rel: string) => existsSync(fileURLToPath(new URL(rel, root)));

/* ---------- verification metadata ---------- */

test("every product carries verification metadata", () => {
  assert.ok(products.length >= 4);
  for (const product of products) {
    assert.match(
      product.verifiedAt,
      /^\d{4}-\d{2}-\d{2}$/,
      `${product.name} needs an ISO verifiedAt date`,
    );
    assert.ok(
      product.evidence.length > 0,
      `${product.name} publishes a status with no evidence behind it`,
    );
    for (const item of product.evidence) {
      assert.ok(item.claim.trim().length > 0, `${product.name}: evidence entry with no claim`);
      assert.ok(
        item.source.trim().length > 12,
        `${product.name}: evidence "${item.claim}" needs a checkable source, not a gesture`,
      );
    }
  }
});

test("no product status has gone stale for its stage", () => {
  // Stage-aware, not a flat window. A product mid-release can be wrong within
  // days; Trendi moved 114 → 119 in eight. A universal 45-day allowance let an
  // archaeological status pass CI.
  const stale = staleProducts();
  assert.deepEqual(
    stale.map((r) => r.product),
    [],
    stale.map((r) => r.message).join("\n\n"),
  );
});

test("every stage has a freshness budget, and fast stages are tight", () => {
  for (const stage of Object.keys(stageLabel) as Stage[]) {
    assert.ok(
      typeof STAGE_FRESHNESS_DAYS[stage] === "number",
      `stage "${stage}" has no freshness budget — add one to STAGE_FRESHNESS_DAYS`,
    );
  }
  // Anything mid-release must be re-checked at least weekly.
  for (const stage of ["release-candidate", "uploaded", "internal-testers"] as Stage[]) {
    assert.ok(
      STAGE_FRESHNESS_DAYS[stage] <= 7,
      `stage "${stage}" moves fast and cannot have a ${STAGE_FRESHNESS_DAYS[stage]}-day window`,
    );
  }
  // A dormant product should not demand weekly ceremony.
  assert.ok(STAGE_FRESHNESS_DAYS.paused >= 30);
  assert.ok(STAGE_FRESHNESS_DAYS.concept >= 30);
});

test("a stale status produces an actionable message", () => {
  // The failure has to tell you what to do, not just that something is wrong.
  const product = products[0];
  const longAgo = Date.parse(product.verifiedAt) + 10_000 * 86_400_000;
  const result = checkFreshness(product, longAgo);

  assert.equal(result.fresh, false);
  assert.match(result.message, /STALE STATUS/);
  assert.ok(result.message.includes(product.name), "names the product");
  assert.ok(result.message.includes(product.stage), "names the stage");
  assert.ok(result.message.includes(product.verifiedAt), "names the verification date");
  assert.ok(result.message.includes(String(result.allowedDays)), "names the allowed age");
  assert.match(result.message, /what to do:/, "states the corrective action");
  assert.match(result.message, /do NOT just bump the date/, "warns against a rubber-stamp refresh");
});

test("freshness is never auto-refreshed", () => {
  // A function that silently moved verifiedAt would make the whole model
  // decorative. The date may only change when a human inspected evidence.
  const source = read("lib/dev/universe.ts");
  assert.doesNotMatch(
    source,
    /verifiedAt\s*=\s*(?!")/,
    "verifiedAt is assigned dynamically somewhere — it must stay a literal",
  );
});

test("a status owner is recorded", () => {
  assert.ok(statusOwner.length > 0);
});

test("published dates are literals, never read from the clock", () => {
  // The invariant is about VALUES that get published, not about the clock being
  // untouchable. checkFreshness() legitimately compares against Date.now() —
  // that's measuring staleness, not asserting that someone looked.
  for (const source of [read("lib/dev/universe.ts"), read("lib/dev/lab.ts")]) {
    assert.doesNotMatch(
      source,
      /(verifiedAt|LastUpdated|date)\s*:\s*(new Date|Date\.now|.*toISOString)/i,
      "a published date is being generated at runtime — it must be a literal a human typed",
    );
  }
  for (const product of products) {
    assert.match(product.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.ok(universeLastUpdated.length > 0);
  assert.ok(nowLastUpdated.length > 0);
});

/* ---------- the status ladder ---------- */

test("stage and reach never contradict each other", () => {
  for (const product of products) {
    assert.ok(stageLabel[product.stage], `${product.name} has an unknown stage`);
    assert.ok(reachLabel[product.reach], `${product.name} has an unknown reach`);
    assert.ok(product.status.length > 10, `${product.name} needs a specific status`);

    if (product.reach === "internal") {
      assert.ok(
        stageRank[product.stage] < stageRank["external-testers"],
        `${product.name} runs for Blake only but claims stage "${product.stage}"`,
      );
    }

    // A product can be publicly reachable through a different surface than the
    // stage describes (You Know Ball's web demo vs its iOS build). If so, the
    // status string has to say which surface, or the two facts read as one.
    if (product.reach === "public" && product.stage !== "public") {
      assert.match(
        product.status,
        /web demo/i,
        `${product.name} claims public reach at stage "${product.stage}" without naming the public surface`,
      );
    }
  }
});

test("the stage ladder never collapses distinct release states", () => {
  // "Release-ready", "uploaded" and "in a tester's hands" must stay separate.
  assert.ok(stageRank["release-candidate"] < stageRank.uploaded);
  assert.ok(stageRank.uploaded < stageRank["internal-testers"]);
  assert.ok(stageRank["internal-testers"] < stageRank["external-testers"]);
  assert.ok(stageRank["external-testers"] < stageRank.public);
});

test("every stage maps to a display family, and the family never upgrades a stage", () => {
  for (const stage of Object.keys(stageLabel) as Stage[]) {
    assert.ok(stageFamily[stage], `stage "${stage}" has no display family`);
    assert.ok(stageFamilyLabel[stageFamily[stage]], `family for "${stage}" has no label`);
  }
  // The coarse chip is a projection of the fine ladder, never a promotion:
  // only a genuinely public stage may wear the "Live" chip.
  for (const stage of Object.keys(stageFamily) as Stage[]) {
    if (stageFamily[stage] === "live") {
      assert.equal(stage, "public", `stage "${stage}" wears the Live chip without being public`);
    }
  }
});

test("the front office is in the universe, honestly", () => {
  const concierge = getProduct("concierge");
  assert.ok(concierge, "the concierge belongs in the constellation — it's usable today");
  assert.equal(concierge!.reach, "public");
  assert.ok(
    concierge!.evidence.some((e) => /checked 2026|merged/i.test(e.source)),
    "the concierge needs dated, checkable evidence",
  );
  assert.ok(
    concierge!.notYet.some((line) => /paying|engagement/i.test(line)),
    "it must say plainly that no routed conversation has become a paid engagement",
  );
});

test("TestFlight claims require TestFlight evidence", () => {
  for (const product of products) {
    if (/testflight/i.test(product.status)) {
      assert.ok(
        product.evidence.some((e) => /testflight|screenshot|installed/i.test(e.source)),
        `${product.name} mentions TestFlight in its status with no TestFlight evidence`,
      );
    }
  }
});

/* ---------- the specific corrections from 2026-07-20 ---------- */

test("You Know Ball does not claim it was never uploaded", () => {
  // Apple's 409 responses name previousBundleVersion 26 (Jul 16) and 27 (Jul 19).
  const ykb = getProduct("you-know-ball");
  assert.ok(ykb);
  const prose = [ykb!.status, ...ykb!.state, ...ykb!.notYet].join(" ");
  assert.equal(ykb!.stage, "uploaded");
  assert.doesNotMatch(
    prose,
    /never been on testflight|never reached testflight|has never been uploaded/i,
    "Apple's delivery logs contradict this claim",
  );
  assert.match(prose, /accepted by/i, "the accepted-by-Apple fact must stay stated");
  assert.match(
    ykb!.status,
    /unverified/i,
    "current processing and tester distribution must remain explicitly unverified",
  );
  assert.doesNotMatch(
    prose,
    /reached no tester|confirmed testers:\s*zero|never assigned (?:either )?to a tester/i,
    "missing current Apple evidence cannot prove zero distribution",
  );
});

test("Trendi reflects build 132 while preserving build 122 TestFlight evidence", () => {
  // Re-pinned 2026-08-13: build 132 is the current certified free-launch
  // candidate. Build 122 remains historical proof of internal TestFlight reach.
  const trendi = getProduct("trendi");
  assert.ok(trendi);
  const prose = [trendi!.status, ...trendi!.state].join(" ");
  assert.equal(trendi!.reach, "internal");
  assert.equal(trendi!.stage, "release-candidate");
  assert.match(trendi!.status, /132/, "build 132 must headline the current status");
  assert.match(prose, /122/, "build 122's historical TestFlight evidence must remain");
  assert.doesNotMatch(
    trendi!.status,
    /blocked on builds? 11[56]|stuck behind an apple account|\b118\b/i,
    "superseded builds must not headline the status",
  );
  // The isolation gate is genuinely open; the page must not imply otherwise.
  assert.ok(
    [...trendi!.state, ...trendi!.notYet].some((line) => /isolation/i.test(line)),
    "the incomplete data-isolation gate must be disclosed",
  );
});

test("Career Forge does not claim checkout is closed, or that anyone bought", () => {
  const cf = getProduct("career-forge");
  assert.ok(cf);
  assert.doesNotMatch(
    [cf!.status, ...cf!.state, ...cf!.notYet].join(" "),
    /fail-clos|payments are not configured/i,
    "production renders live-commerce copy and a working $49 link",
  );

  // Adoption language is banned in the ASSERTION fields only. `notYet` is the
  // denial list — "nobody has told me this got them hired" is the honest
  // sentence, and a checker that can't tell a claim from its negation would
  // push the copy toward saying nothing at all.
  assert.doesNotMatch(
    [cf!.status, ...cf!.state].join(" "),
    /\b(paying customers|active users|got hired|landed a job|customers trust)\b/i,
    "adoption language needs evidence that does not exist",
  );
  assert.ok(
    cf!.notYet.some((line) => /paid|stripe|reconcil/i.test(line)),
    "the payment question must be stated as unresolved, not omitted",
  );
});

test("unsourceable statistics stay out of published copy", () => {
  // Published once, then untraceable to any artifact during the audit.
  const banned = [/2\.36%/, /4,500 simulated/, /460 topics/, /16[–-]27%/];
  const surfaces = ["lib/dev/universe.ts", "app/dev/products/[slug]/page.tsx", "app/home/page.tsx"];
  for (const pattern of banned) {
    for (const file of surfaces) {
      assert.doesNotMatch(read(file), pattern, `${file} re-published an unsourced statistic`);
    }
    for (const note of publishedNotes) {
      assert.doesNotMatch(note.body.join(" "), pattern, `${note.slug} cites an unsourced statistic`);
    }
  }
});

/* ---------- honesty invariants ---------- */

test("every product states what is not true yet", () => {
  for (const product of products) {
    assert.ok(
      product.notYet.length >= 2,
      `${product.name} lists fewer than two unproven claims — verify that's real`,
    );
  }
});

test("internal-only products offer nothing to click", () => {
  for (const product of products.filter((p) => p.reach === "internal")) {
    assert.equal(
      product.actions.length,
      0,
      `${product.name} is internal but offers ${product.actions.length} action(s)`,
    );
  }
});

test("no product uses launch language it cannot back", () => {
  const banned = [/\blaunched\b/i, /\bavailable now\b/i, /\bgenerally available\b/i];
  for (const product of products) {
    for (const pattern of banned) {
      assert.doesNotMatch(product.status, pattern, `${product.name}: ${product.status}`);
    }
  }
});

test("no product invents users, revenue, or testimonials", () => {
  const source = read("lib/dev/universe.ts");
  for (const pattern of [
    /\d+\s*(paying|happy)\s+(customers|users|clients)/i,
    /\btestimonial/i,
    /\$\d+[\d,]*\s*(in\s+)?(revenue|MRR|ARR)/i,
  ]) {
    assert.doesNotMatch(source, pattern, `universe.ts appears to claim ${pattern}`);
  }
});

/* ---------- cross-surface agreement ---------- */

test("/now and the product universe agree about TestFlight", () => {
  const byName = new Map(products.map((p) => [p.name, p]));
  for (const entry of nowActiveWork) {
    const product = byName.get(entry.name);
    if (!product) continue; // the studio is not a product

    const nowClaims = /testflight/i.test(`${entry.stage} ${entry.snapshot} ${entry.doingNow}`);
    const universeClaims = /testflight|internal testers/i.test(
      `${stageLabel[product.stage]} ${product.status} ${product.state.join(" ")}`,
    );
    assert.equal(
      nowClaims,
      universeClaims,
      `/now and /products disagree about TestFlight for ${entry.name}`,
    );
  }
});

test("product links point at the personal universe, not studio chrome", () => {
  for (const entry of nowActiveWork) {
    if (entry.external) continue;
    assert.match(
      entry.href,
      /^\/products\/|^\/you-know-ball\/play$/,
      `${entry.name} links to ${entry.href}, which renders studio chrome on koinophobia.dev`,
    );
  }
});

test("product slugs are unique and every one resolves", () => {
  const slugs = products.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate product slug");
  for (const slug of slugs) assert.ok(getProduct(slug), `${slug} does not resolve`);
  assert.equal(getProduct("does-not-exist"), undefined);
});

test("every product action link is usable by a stranger", () => {
  for (const product of products) {
    for (const action of product.actions) {
      if (action.external || action.href.startsWith("mailto:")) {
        assert.match(action.href, /^(https?:|mailto:)/, `${product.name}: ${action.href}`);
        continue;
      }
      const segments = action.href.replace(/^\//, "").split("/");
      const parent = segments.slice(0, -1).join("/");
      const candidates = [
        `app/${segments.join("/")}/page.tsx`,
        `app/dev/${segments.join("/")}/page.tsx`,
        ...(parent ? [`app/dev/${parent}/[slug]/page.tsx`] : []),
      ];
      assert.ok(
        candidates.some((file) => exists(file)),
        `${product.name}: ${action.href} resolves to nothing`,
      );
    }
  }
});

/* ---------- field notes ---------- */

test("no note publishes without BOTH gates", () => {
  // Claude drafts these notes in Blake's first person, under his byline. The
  // approval flag is the one that stops that from becoming ghostwriting: it is
  // a claim that the human named on the page has actually read the words.
  for (const note of notes) {
    if (publishedNotes.some((p) => p.slug === note.slug)) {
      assert.equal(note.published, true, `${note.slug} rendered without published`);
      assert.equal(
        note.approvedByBlake,
        true,
        `${note.slug} is publicly reachable but Blake has not approved it`,
      );
    }
  }
  // A note flagged for publication but unread must NOT be reachable.
  const unapproved = notes.filter((n) => n.published && !n.approvedByBlake);
  for (const note of unapproved) {
    assert.equal(
      getNote(note.slug),
      undefined,
      `${note.slug} is marked published without approval and still resolves`,
    );
  }
});

test("every first-person note is currently held for review", () => {
  // As of 2026-07-20 Blake has personally reviewed none of them.
  assert.equal(
    publishedNotes.length,
    0,
    "a note became publicly reachable — confirm Blake actually approved it",
  );
  for (const note of notes) {
    assert.equal(note.approvedByBlake, false, `${note.slug} claims approval`);
  }
});

test("held notes are preserved, never emptied", () => {
  const held = notes.filter((note) => !note.published || !note.approvedByBlake);
  assert.ok(held.length > 0);
  for (const note of held) {
    assert.ok(
      note.body.length >= 3,
      `held note ${note.slug} lost its body — hold means unpublished, never deleted`,
    );
    assert.ok(note.title.length > 0 && note.hook.length > 0, `${note.slug} was gutted`);
    assert.equal(getNote(note.slug), undefined, `held note ${note.slug} still resolves`);
  }
});

test("nothing links to an empty notes section", () => {
  // Advertising writing that isn't there is its own small dishonesty.
  const shell = read("components/dev/DevShell.tsx");
  const home = read("app/home/page.tsx");
  const sitemap = read("app/dev-sitemap.xml/route.ts");

  assert.match(shell, /publishedNotes\.length > 0/, "nav must hide Notes while empty");
  assert.match(home, /publishedNotes\.length > 0/, "homepage must hide the notes section");
  assert.match(sitemap, /publishedNotes\.length > 0/, "sitemap must not advertise empty notes");

  // The Notes entry may exist in the source, but only inside the conditional —
  // an unconditional entry in the array is the failure worth catching.
  const navBlock = shell.slice(shell.indexOf("DEV_NAV"), shell.indexOf("];"));
  const notesLine = navBlock.split("\n").find((line) => line.includes('href: "/notes"'));
  if (notesLine) {
    assert.match(
      notesLine,
      /publishedNotes\.length > 0/,
      "the Notes nav entry is unconditional — it would link to an empty section",
    );
  }
});

test("the review file still covers every note", () => {
  assert.ok(exists("docs/FIELD-NOTES-REVIEW.md"));
  const review = read("docs/FIELD-NOTES-REVIEW.md");
  for (const note of notes) {
    assert.ok(review.includes(note.slug), `${note.slug} is unreviewed`);
  }
});

test("published field notes are specific, dated, and resolvable", () => {
  for (const note of publishedNotes) {
    assert.ok(getNote(note.slug), `${note.slug} does not resolve`);
    assert.match(
      note.date,
      /^[A-Z][a-z]+ \d{1,2}, \d{4}(\s·\s.+)?$/,
      `${note.slug} has a malformed date`,
    );
    assert.ok(note.body.length >= 3, `${note.slug} is too thin to be a field note`);
    assert.match(
      note.body.join(" "),
      /\d/,
      `${note.slug} cites no specifics — it reads as an essay, not a note`,
    );
  }
  assert.equal(new Set(notes.map((n) => n.slug)).size, notes.length, "duplicate note slug");
});

test("the sitemap lists only published notes", () => {
  const sitemap = read("app/dev-sitemap.xml/route.ts");
  assert.match(sitemap, /publishedNotes/);
  assert.doesNotMatch(sitemap, /\bnotes\.map\b/);
});

/* ---------- design system ---------- */

test("each product has a distinct visual world", () => {
  const themes = products.map((p) => p.identity.theme);
  assert.equal(new Set(themes).size, themes.length, "two products share a theme");

  const css = read("app/dev-product.css");
  const system = read("app/dev-system.css");
  for (const theme of themes) {
    assert.ok(
      system.includes(`[data-world="${theme}"]`),
      `${theme} has no accent tokens in dev-system.css`,
    );
    assert.ok(
      css.includes(`[data-world="${theme}"]`),
      `${theme} has accent tokens but no rhythm overrides — that's a skin, not an identity`,
    );
  }
});

test("the design tokens are defined exactly once", () => {
  const files = [
    "app/dev-system.css",
    "app/dev-home.css",
    "app/now-dev.css",
    "app/connect-card.css",
    "app/resume-dev.css",
  ];
  const definitions = files.filter((file) => read(file).includes("--dh-ink:"));
  assert.deepEqual(definitions, ["app/dev-system.css"], "palette tokens are duplicated again");
});

test("every experiment reports what it showed", () => {
  for (const experiment of experiments) {
    assert.ok(experiment.finding.length > 30, `${experiment.name} has no finding`);
  }
});
