import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  faqs,
  getWorkProject,
  processSteps,
  products,
  serviceOffers,
  studioConfig,
  workProjects,
} from "../lib/commercial";

const root = path.resolve(import.meta.dirname, "..");

test("business work renders only supported, visible categories", () => {
  assert.ok(workProjects.length > 0);
  assert.ok(
    workProjects.every((project) => project.status === "concept-build"),
  );
  assert.ok(
    workProjects.every((project) => project.statusLabel === "Concept Build"),
  );
  assert.ok(workProjects.every((project) => project.intendedImpact?.length));
  assert.ok(workProjects.every((project) => !project.measuredResults));
  assert.ok(workProjects.every((project) => !project.testimonial));
});

test("optional project fields can remain absent", () => {
  const project = getWorkProject("blackline-ritual");
  assert.ok(project);
  assert.equal(project.liveUrl, undefined);
  assert.equal(project.image, undefined);
  assert.equal(project.testimonial, undefined);
  assert.equal(project.measuredResults, undefined);
});

test("pricing and timelines match the approved commercial ranges", () => {
  assert.equal(studioConfig.auditPrice, "$250");
  assert.equal(studioConfig.quickFixRange, "$149–$499");
  assert.equal(studioConfig.landingPageRange, "$499–$1,200");
  assert.equal(studioConfig.websiteRange, "$1,500–$3,500");
  assert.equal(serviceOffers.length, 5);
  assert.ok(
    serviceOffers.every(
      (offer) => offer.price && offer.timeline && offer.deliverable,
    ),
  );
});

test("commercial CTAs resolve to local routes", () => {
  const localTargets = serviceOffers.map((offer) => offer.href.split("?")[0]);
  for (const href of new Set([
    "/services",
    "/work",
    "/products",
    "/process",
    "/about",
    "/intake",
    "/audit",
    ...localTargets,
  ])) {
    const page = href === "/" ? "app/page.tsx" : `app${href}/page.tsx`;
    assert.ok(fs.existsSync(path.join(root, page)), `missing route: ${href}`);
  }
});

test("every case-study slug resolves and has a static route", () => {
  assert.ok(fs.existsSync(path.join(root, "app/work/[slug]/page.tsx")));
  for (const project of workProjects) {
    assert.equal(getWorkProject(project.slug)?.title, project.title);
  }
});

test("products are explicitly internal and commercial guidance is complete", () => {
  assert.deepEqual(
    products.map((product) => product.title),
    ["Career Forge", "Trendi", "You Know Ball"],
  );
  assert.ok(
    products.every((product) => product.status.startsWith("Internal Product")),
  );
  assert.equal(processSteps.length, 6);
  assert.ok(faqs.length >= 13);
});

test("the final Labs homepage makes the koi navigation and carries information in its wake", () => {
  const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
  const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
  const motion = fs.readFileSync(
    path.join(root, "components/studio/ScrollKoiExperience.tsx"),
    "utf8",
  );
  const navigationMotion = fs.readFileSync(
    path.join(root, "components/studio/KoiNavigationMotion.tsx"),
    "utf8",
  );
  const wayfindingStyles = fs.readFileSync(
    path.join(root, "app/koi-wayfinding.css"),
    "utf8",
  );
  const depth = fs.readFileSync(
    path.join(root, "components/studio/KoiDepthPass.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(path.join(root, "app/koi-scroll.css"), "utf8");
  const finalStyles = fs.readFileSync(
    path.join(root, "app/koi-finished.css"),
    "utf8",
  );
  const depthStyles = fs.readFileSync(
    path.join(root, "app/koi-depth.css"),
    "utf8",
  );

  assert.match(
    page,
    /className="studio-site studio-site--koi koi-world koi-world--finished"/,
  );
  assert.match(page, /<ScrollKoiExperience \/>/);
  assert.match(page, /<KoiNavigationMotion \/>/);
  assert.equal((page.match(/data-koi-frame=/g) ?? []).length, 6);
  assert.equal((page.match(/data-koi-follow-scene=/g) ?? []).length, 6);
  assert.ok((page.match(/data-koi-follow/g) ?? []).length >= 24);
  assert.match(page, /data-koi-frame="2\.0"/);
  assert.match(page, /data-koi-frame="14\.15"/);
  assert.match(
    page,
    /data-koi-scene="products"[\s\S]*data-koi-duo="true"/,
  );
  assert.match(page, /The koi moves first\. The lab follows\./);
  assert.match(page, /className="koi-follow-stage"/);
  assert.match(page, /className="koi-follow-wake"/);
  assert.match(page, /className="koi-world__wordmark"/);
  assert.match(page, /className="koi-product-orbit"/);
  assert.match(page, /className="koi-service-current"/);
  assert.match(page, /className="koi-work-wake"/);
  assert.match(page, /className="koi-founder-note"/);
  assert.match(page, /className="koi-portal"/);

  assert.doesNotMatch(
    page,
    /StudioNav|StudioFooter|PricingCard|ProcessStep|ProductCard|ProofItem|SectionIntro|WorkCard/,
  );
  assert.doesNotMatch(
    page,
    /studio-problem-grid|studio-pricing-grid|studio-product-grid|studio-trust|studio-hero__system/,
  );

  assert.match(motion, /const FALLBACK_DURATION_SECONDS = 15/);
  assert.match(motion, /const HERO_SETTLE_SECONDS = 2/);
  assert.match(motion, /const RAMP_START = 0\.36/);
  assert.match(motion, /const RAMP_END = 0\.64/);
  assert.match(motion, /Math\.sin\(Math\.PI \* rampProgress\)/);
  assert.match(motion, /getLivingHoldOffset/);
  assert.match(motion, /HOLD_MICRO_PERIOD_MS = 4100/);
  assert.match(motion, /HOLD_SEEK_INTERVAL_MS = 36/);
  assert.match(motion, /HOLD_MICRO_AMPLITUDE_SECONDS = 0\.24/);
  assert.match(motion, /0\.98 \+ rampStrength \* 0\.06/);
  assert.ok((motion.match(/preload="auto"/g) ?? []).length >= 2);
  assert.match(motion, /data\.koiLiving|dataset\.koiLiving/);
  assert.match(motion, /--koi-depth-idle-x/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /connection\?\.saveData/);
  assert.match(motion, /9199e09c-1519-4fea-b7d8-c115f41cbe92/);
  assert.match(motion, /2b223e84-91ca-43e3-a741-f2002d009ccc/);
  assert.match(
    motion,
    /SINGLE_KOI_FALLBACK = "\/brand\/koi-scroll-single\.mp4"/,
  );
  assert.match(
    motion,
    /DUO_KOI_FALLBACK = "\/brand\/koi-scroll-duo\.mp4"/,
  );
  assert.ok((motion.match(/\bmuted\b/g) ?? []).length >= 2);
  assert.ok((motion.match(/\bplaysInline\b/g) ?? []).length >= 2);

  assert.match(navigationMotion, /const CHAPTERS/);
  assert.equal((navigationMotion.match(/scene: "/g) ?? []).length, 6);
  assert.match(navigationMotion, /Koinophobia Labs site map/);
  assert.match(navigationMotion, /koi-wayfinder/);
  assert.match(navigationMotion, /const HOLD_START = 0\.18/);
  assert.match(navigationMotion, /const HOLD_END = 0\.82/);
  assert.match(navigationMotion, /\[data-koi-follow-scene\]/);
  assert.match(navigationMotion, /\[data-koi-follow\]/);
  assert.match(navigationMotion, /part\.style\.transform/);
  assert.match(navigationMotion, /part\.style\.filter/);
  assert.match(navigationMotion, /scene\.dataset\.koiActive/);
  assert.match(navigationMotion, /scene\.dataset\.koiReadable/);
  assert.match(navigationMotion, /--koi-reading-x/);
  assert.match(navigationMotion, /--koi-reading-opacity/);
  assert.match(navigationMotion, /const activeFloor = essential \? 0\.96/);
  assert.match(navigationMotion, /Math\.max\(opacity, activeFloor\)/);
  assert.match(navigationMotion, /data-koi-nav/);
  assert.match(navigationMotion, /prefers-reduced-motion: reduce/);
  assert.match(navigationMotion, /connection\?\.saveData/);

  assert.match(wayfindingStyles, /\.koi-wayfinder/);
  assert.match(wayfindingStyles, /Section map/);
  assert.match(wayfindingStyles, /\.koi-follow-cluster/);
  assert.match(wayfindingStyles, /--koi-reading-x/);
  assert.match(wayfindingStyles, /--koi-reading-opacity/);
  assert.match(wayfindingStyles, /backdrop-filter: blur\(18px\)/);
  assert.match(wayfindingStyles, /aria-current="true"/);
  assert.match(layout, /import "\.\/koi-wayfinding\.css"/);

  assert.ok(
    fs.existsSync(path.join(root, "public/brand/koi-scroll-single.mp4")),
  );
  assert.ok(fs.existsSync(path.join(root, "public/brand/koi-scroll-duo.mp4")));
  assert.ok(
    fs.existsSync(path.join(root, "public/brand/koi-scroll-assets.sha256")),
  );

  assert.match(styles, /body:has\(\.koi-world\) > \.koi-companion/);
  assert.match(layout, /import "\.\/koi-finished\.css"/);
  assert.match(finalStyles, /\.koi-follow-stage/);
  assert.match(finalStyles, /\.koi-follow-wake/);
  assert.match(finalStyles, /\.koi-follow-cluster/);
  assert.match(finalStyles, /\[data-koi-follow\]/);
  assert.match(finalStyles, /data-koi-active="true"/);
  assert.match(finalStyles, /\.koi-product-node/);
  assert.match(finalStyles, /\.koi-service-current/);
  assert.match(finalStyles, /\.koi-work-wake/);
  assert.match(finalStyles, /prefers-reduced-motion: reduce/);
  assert.match(finalStyles, /--koi-idle-x/);
  assert.match(finalStyles, /grayscale\(\.24\)/);
  assert.match(finalStyles, /contrast\(1\.5\)/);
  assert.match(finalStyles, /--koi-depth-base: \.8/);
  assert.match(finalStyles, /brightness\(1\.34\)/);
  assert.match(finalStyles, /koiWakeBreathe/);
  assert.match(finalStyles, /koiEdgeLightBreathe/);
  assert.match(finalStyles, /studio-koi-depth-pass__video/);

  assert.match(layout, /import KoiDepthPass from/);
  assert.match(layout, /import "\.\/koi-depth\.css"/);
  assert.match(layout, /<KoiDepthPass \/>/);
  assert.match(depth, /createPortal/);
  assert.match(depth, /\.studio-scroll-koi__video--single/);
  assert.match(depth, /prefers-reduced-motion: reduce/);
  assert.match(depth, /connection\?\.saveData/);
  assert.match(depth, /9199e09c-1519-4fea-b7d8-c115f41cbe92/);
  assert.match(
    depth,
    /SINGLE_KOI_FALLBACK = "\/brand\/koi-scroll-single\.mp4"/,
  );
  assert.match(depth, /aria-hidden="true"/);
  assert.match(depth, /\bmuted\b/);
  assert.match(depth, /\bplaysInline\b/);
  assert.match(depth, /preload="auto"/);
  assert.match(depth, /now - lastSeekAt >= 32/);
  assert.match(depth, /> 0\.008/);

  assert.match(depthStyles, /z-index: 3/);
  assert.match(depthStyles, /mix-blend-mode: screen/);
  assert.match(depthStyles, /-webkit-mask-image: radial-gradient/);
  assert.match(depthStyles, /data-koi-scene="systems"/);
  assert.match(depthStyles, /data-koi-scene="founder"/);
  assert.match(depthStyles, /data-koi-scene="start"/);
  assert.match(
    depthStyles,
    /data-koi-scene="products"\] \.studio-koi-depth-pass[\s\S]*opacity: 0/,
  );
});
