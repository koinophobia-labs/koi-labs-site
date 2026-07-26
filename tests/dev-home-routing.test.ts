import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Guards the two-host routing contract for the shared app:
//   koinophobia.dev  /  -> personal home (app/home)
//   koinophobialabs.com  /  -> studio home (app/page.tsx)
// plus canonicalization of the internal /home target and the /connect card.

const root = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, root), "utf8");
const exists = (rel: string) => existsSync(fileURLToPath(new URL(rel, root)));

// Assert against the RESOLVED config, not its source text. The earlier version
// of this file matched whitespace-stripped source fragments, which broke the
// moment the host strings were extracted into constants — a refactor that
// changed nothing about behaviour. Resolving the config tests the contract.
type Rule = { source: string; destination: string; has?: Array<{ type: string; value: string }> };
const hostOf = (rule: Rule) => (rule.has ?? []).find((h) => h.type === "host")?.value;

// Resolved lazily: the tsx test transform targets CJS, which has no top-level
// await. Memoized so the config is only evaluated once across the suite.
let rulesPromise: Promise<{ redirects: Rule[]; beforeFiles: Rule[] }> | null = null;
const rules = () => {
  rulesPromise ??= (async () => {
    const { default: config } = await import("../next.config");
    const rewriteRules = await config.rewrites!();
    return {
      redirects: (await config.redirects!()) as Rule[],
      beforeFiles: (Array.isArray(rewriteRules)
        ? rewriteRules
        : (rewriteRules.beforeFiles ?? [])) as Rule[],
    };
  })();
  return rulesPromise;
};
const findRewrite = async (source: string, host: string) =>
  (await rules()).beforeFiles.find((r) => r.source === source && hostOf(r) === host);
const findRedirect = async (source: string, host: string) =>
  (await rules()).redirects.find((r) => r.source === source && hostOf(r) === host);
const vercelJson = JSON.parse(read("vercel.json"));
const devHome = read("app/home/page.tsx");
const studioHome = read("app/page.tsx");
const connect = read("app/connect/page.tsx");
const resumePage = read("app/resume/page.tsx");

test("koinophobia.dev / rewrites to the personal home", async () => {
  const rule = await findRewrite("/", "koinophobia.dev");
  assert.ok(rule, "expected a host-scoped rewrite of / for koinophobia.dev");
  assert.equal(rule!.destination, "/home");
});

test("koinophobialabs.com keeps the studio homepage at /", async () => {
  // The studio page is app/page.tsx and no rewrite redirects the .com root away.
  assert.match(studioHome, /className="studio-site"/);
  assert.equal(
    await findRewrite("/", "koinophobialabs.com"),
    undefined,
    "koinophobialabs.com root must not rewrite away from the studio home",
  );
});

test("/home canonicalizes to one public URL per host", async () => {
  for (const host of ["koinophobia.dev", "koinophobialabs.com"]) {
    const rule = await findRedirect("/home", host);
    assert.ok(rule, `expected /home to redirect for ${host}`);
    assert.equal(rule!.destination, "https://koinophobia.dev/");
  }
});

test("the legacy koinophobia.dev / -> /connect redirect is gone", () => {
  const hasConnectRootRedirect = (vercelJson.redirects ?? []).some(
    (r: { source: string; destination: string; has?: Array<{ value: string }> }) =>
      r.source === "/" &&
      r.destination === "/connect" &&
      (r.has ?? []).some((h) => h.value === "koinophobia.dev"),
  );
  assert.equal(hasConnectRootRedirect, false, "root should no longer redirect to /connect");
});

test("the www.koinophobia.dev -> apex redirect is preserved", () => {
  const hasWwwRedirect = (vercelJson.redirects ?? []).some(
    (r: { destination: string; has?: Array<{ value: string }> }) =>
      r.destination === "https://koinophobia.dev/:path*" &&
      (r.has ?? []).some((h) => h.value === "www.koinophobia.dev"),
  );
  assert.equal(hasWwwRedirect, true, "www.koinophobia.dev must still redirect to the apex");
});

test("/connect remains available as the fast networking card", () => {
  assert.ok(exists("app/connect/page.tsx"), "app/connect/page.tsx must exist");
});

test("every internal link on the personal home resolves to a real route", () => {
  // Extract internal routes from both JSX attributes (href="/x") and the
  // systems data literals (href: "/x"). Dynamic href={LINKS.*} are external.
  const hrefs = [...devHome.matchAll(/href[=:]\s*"(\/[^"?#]*)"/g)].map((m) => m[1]);
  const internal = [...new Set(hrefs)].filter((h) => !h.startsWith("//"));
  assert.ok(internal.length >= 3, "expected several internal links to verify");

  // A koinophobia.dev URL may be served either by a same-named route in the app
  // tree or, for the personal routes that collide with studio pages, by a
  // host-scoped rewrite into app/dev/*. Resolve both, including dynamic
  // segments, so a broken personal link still fails this test.
  const candidateFiles = (route: string) => {
    const clean = route.replace(/\/+$/, "") || "/";
    if (clean === "/") return ["app/page.tsx", "app/home/page.tsx"];
    const segments = clean.slice(1).split("/");
    const parent = segments.slice(0, -1).join("/");
    return [
      `app/${segments.join("/")}/page.tsx`,
      `app/dev/${segments.join("/")}/page.tsx`,
      ...(parent
        ? [`app/${parent}/[slug]/page.tsx`, `app/dev/${parent}/[slug]/page.tsx`]
        : []),
    ];
  };

  for (const route of internal) {
    const candidates = candidateFiles(route);
    assert.ok(
      candidates.some((file) => exists(file)),
      `internal link ${route} has no page file (tried ${candidates.join(", ")})`,
    );
  }
});

test("every personal route in the nav is reachable on koinophobia.dev", async () => {
  // Each public URL must be either a real app route or a host-scoped rewrite.
  const navRoutes = ["/products", "/log", "/lab", "/notes", "/now", "/about", "/connect"];
  for (const route of navRoutes) {
    const rewrite = await findRewrite(route, "koinophobia.dev");
    const direct = exists(`app${route}/page.tsx`);
    assert.ok(
      rewrite || direct,
      `${route} is in the nav but is neither a rewrite nor an app route`,
    );
    if (rewrite) {
      assert.ok(
        exists(`app${rewrite.destination}/page.tsx`),
        `${route} rewrites to ${rewrite.destination}, which has no page file`,
      );
    }
  }
});

test("/dev/* is internal plumbing and never a public URL", async () => {
  // Every rewrite destination under /dev must also have a redirect collapsing
  // the /dev URL to the clean one, so pages have exactly one public address.
  const devRewrites = (await rules()).beforeFiles.filter(
    (r) => hostOf(r) === "koinophobia.dev" && r.destination.startsWith("/dev/"),
  );
  assert.ok(devRewrites.length >= 4, "expected the personal routes to rewrite into /dev/*");
  for (const rule of devRewrites) {
    assert.ok(
      await findRedirect(rule.destination, "koinophobia.dev"),
      `${rule.destination} is publicly reachable with no redirect to ${rule.source}`,
    );
  }
});

test("the staging host mirrors every personal rewrite, with no redirects and no indexing", async () => {
  const resolved = await rules();
  // Every koinophobia.dev rewrite exists identically for preview.koinophobia.dev.
  const prodRewrites = resolved.beforeFiles.filter((r) => hostOf(r) === "koinophobia.dev");
  assert.ok(prodRewrites.length >= 8, "expected the full personal rewrite set");
  for (const rule of prodRewrites) {
    const mirrored = resolved.beforeFiles.find(
      (r) => r.source === rule.source && r.destination === rule.destination && hostOf(r) === "preview.koinophobia.dev",
    );
    assert.ok(mirrored, `${rule.source} is not mirrored for the staging host`);
  }
  // No canonicalizing redirects on staging — a tester must never be bounced
  // to production mid-journey.
  assert.equal(
    resolved.redirects.filter((r) => hostOf(r) === "preview.koinophobia.dev").length,
    0,
    "staging must have no redirects",
  );
  // And the staging host must refuse indexing.
  const { default: config } = await import("../next.config");
  const headerRules = (await config.headers!()) as Array<Rule & { headers: Array<{ key: string; value: string }> }>;
  const noindex = headerRules.find(
    (r) => hostOf(r) === "preview.koinophobia.dev" && r.headers.some((h) => h.key === "X-Robots-Tag" && /noindex/.test(h.value)),
  );
  assert.ok(noindex, "staging host must send X-Robots-Tag: noindex");
  // The production hosts must NOT be caught by that header rule.
  for (const rule of headerRules) {
    const host = hostOf(rule);
    assert.ok(host !== "koinophobia.dev" && host !== "koinophobialabs.com", "noindex must never target a production host");
  }
});

test("koinophobia.dev serves its own sitemap and robots, not the studio's", async () => {
  for (const [source, destination] of [
    ["/sitemap.xml", "/dev-sitemap.xml"],
    ["/robots.txt", "/dev-robots.txt"],
  ]) {
    const rule = await findRewrite(source, "koinophobia.dev");
    assert.ok(rule, `${source} must be host-scoped for koinophobia.dev`);
    assert.equal(rule!.destination, destination);
    assert.ok(exists(`app${destination}/route.ts`), `${destination} has no route handler`);
  }
});

test("nothing links to the missing /you-know-ball index, and the demo route exists", () => {
  // /you-know-ball has no index page — only /play, /privacy, /support, /safety.
  // The home page now routes through /products/you-know-ball, which carries the
  // playable link, so assert the invariant across both surfaces.
  const ykbProduct = read("lib/dev/universe.ts");
  for (const [label, source] of [["home", devHome], ["universe", ykbProduct]] as const) {
    assert.doesNotMatch(source, /"\/you-know-ball"/, `${label} must not link to the missing index`);
  }
  assert.match(ykbProduct, /"\/you-know-ball\/play"/, "the product page must link to the demo");
  assert.ok(exists("app/you-know-ball/play/page.tsx"));
});

test("internal navigation uses next/link to avoid full document reloads", () => {
  assert.match(devHome, /import Link from "next\/link"/);
  // Hash and external links stay as plain anchors; internal route links use Link.
  assert.match(devHome, /<Link className="devhome__btn devhome__btn--ghost" href="\/connect">/);
});

test("/connect wears the dark .connectcard identity, not the legacy .founder system", () => {
  assert.match(connect, /className="connectcard"/);
  assert.doesNotMatch(connect, /founder-page|founder-shell|founder-card|founder-hero/);
});

test("/connect has personal metadata independent of the studio title template", () => {
  // title.absolute bypasses the "%s | Koinophobia Labs" layout template.
  assert.match(connect, /title:\s*\{\s*absolute:\s*"Connect with Blake Taylor"\s*\}/);
  assert.match(connect, /canonical:\s*"https:\/\/koinophobia\.dev\/connect"/);
});

test("/connect links back to the homepage client-side and every internal link resolves", () => {
  assert.match(connect, /import Link from "next\/link"/);
  assert.match(connect, /<Link className="connectcard__home" href="\/">/);
  const hrefs = [...connect.matchAll(/href[=:]\s*"(\/[^"?#]*)"/g)].map((m) => m[1]);
  for (const route of [...new Set(hrefs)]) {
    const clean = route.replace(/\/+$/, "") || "/";
    const file = clean === "/" ? "app/page.tsx" : `app/${clean.slice(1)}/page.tsx`;
    assert.ok(exists(file), `/connect internal link ${route} has no page file (${file})`);
  }
});

test("/resume wears the dark .resumedev identity, not the legacy .mini/.founder system", () => {
  assert.match(resumePage, /className="resumedev"/);
  assert.doesNotMatch(resumePage, /className="mini-page|className="page-field|founder-/);
});

test("/resume keeps personal metadata and the ATS PDF download intact", () => {
  assert.match(resumePage, /title:\s*\{\s*absolute:\s*"Blake Taylor — Résumé"\s*\}/);
  assert.match(resumePage, /canonical:\s*"https:\/\/koinophobia\.dev\/resume"/);
  // The downloadable ATS artifact must remain wired to the generated PDF.
  assert.match(resumePage, /const PDF_PATH = "\/resume\/Blake-Taylor-Resume\.pdf"/);
  assert.match(resumePage, /download="Blake-Taylor-Resume\.pdf"/);
});

test("/resume renders from lib/resume.json (single source of truth), not inlined facts", () => {
  assert.match(resumePage, /import resume from "@\/lib\/resume\.json"/);
  assert.match(resumePage, /resume\.experience\.map/);
  assert.match(resumePage, /\{resume\.summary\}/);
});
