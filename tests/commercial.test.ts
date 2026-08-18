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
  assert.ok(workProjects.every((project) => project.status === "concept-build"));
  assert.ok(workProjects.every((project) => project.statusLabel === "Concept Build"));
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
  assert.ok(serviceOffers.every((offer) => offer.price && offer.timeline && offer.deliverable));
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
  assert.ok(products.every((product) => product.status.startsWith("Internal Product")));
  assert.equal(processSteps.length, 6);
  assert.ok(faqs.length >= 13);
});

test("the Labs homepage is a clean koi-led website with information following the fish", () => {
  const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
  const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
  const final = fs.readFileSync(
    path.join(root, "components/studio/KoiFinalHomepage.tsx"),
    "utf8",
  );
  const motion = fs.readFileSync(
    path.join(root, "components/studio/ScrollKoiExperience.tsx"),
    "utf8",
  );
  const depth = fs.readFileSync(
    path.join(root, "components/studio/KoiDepthPass.tsx"),
    "utf8",
  );
  const finalStyles = fs.readFileSync(path.join(root, "app/koi-final.css"), "utf8");
  const depthStyles = fs.readFileSync(path.join(root, "app/koi-depth.css"), "utf8");
  const tuneStyles = fs.readFileSync(
    path.join(root, "app/koi-final-tune.css"),
    "utf8",
  );

  assert.match(page, /import KoiFinalHomepage from/);
  assert.match(page, /<KoiFinalHomepage \/>/);
  assert.match(
    final,
    /className="studio-site studio-site--koi koi-world koi-final"/,
  );
  assert.match(final, /<ScrollKoiExperience \/>/);
  assert.match(final, /<KoiFinalMotion \/>/);
  assert.equal((final.match(/<FollowScene/g) ?? []).length, 5);
  assert.match(final, /scene="products"[\s\S]*duo/);
  assert.match(final, /className="koi-final__product-constellation"/);
  assert.match(final, /className="koi-final__service-current"/);
  assert.match(final, /className="koi-final__work-current"/);
  assert.match(final, /className="koi-final__founder"/);
  assert.match(final, /data-follow-part/);
  assert.match(final, /const HOLD_START = 0\.3/);
  assert.match(final, /const HOLD_END = 0\.7/);
  assert.match(final, /part\.style\.transform/);
  assert.match(final, /connection\?\.saveData/);
  assert.match(final, /prefers-reduced-motion: reduce/);

  const productsScene = final.indexOf('scene="products"');
  const systemsScene = final.indexOf('scene="systems"');
  const workScene = final.indexOf('scene="work"');
  const startScene = final.indexOf('scene="start"');
  assert.ok(productsScene > 0 && productsScene < systemsScene);
  assert.ok(systemsScene < workScene && workScene < startScene);

  assert.doesNotMatch(
    final,
    /StudioNav|StudioFooter|PricingCard|ProcessStep|ProductCard|ProofItem|SectionIntro|WorkCard/,
  );
  assert.doesNotMatch(
    final,
    /studio-problem-grid|studio-pricing-grid|studio-product-grid|studio-trust|studio-hero__system/,
  );

  assert.match(motion, /const FALLBACK_DURATION_SECONDS = 15/);
  assert.match(motion, /const HERO_SETTLE_SECONDS = 1\.75/);
  assert.match(motion, /const RAMP_START = 0\.36/);
  assert.match(motion, /const RAMP_END = 0\.64/);
  assert.match(motion, /const DUO_WINDOW_START_SECONDS = 12/);
  assert.match(motion, /const DUO_WINDOW_END_SECONDS = 14/);
  assert.match(motion, /hero: 1\.75/);
  assert.match(motion, /systems: 6\.9/);
  assert.match(motion, /work: 9\.75/);
  assert.match(motion, /start: 11/);
  assert.match(motion, /getSectionProgress\(duoSection\)/);
  assert.match(motion, /Math\.sin\(Math\.PI \* rampProgress\)/);
  assert.match(motion, /9199e09c-1519-4fea-b7d8-c115f41cbe92/);
  assert.match(motion, /2b223e84-91ca-43e3-a741-f2002d009ccc/);
  assert.doesNotMatch(motion, /755ff0b5-7c99-4754-b9fb-b2fc88a7d886/);
  assert.doesNotMatch(motion, /92af66f0-5636-4d10-823e-8d6956fc666a/);
  assert.match(motion, /SINGLE_KOI_FALLBACK = "\/brand\/koi-scroll-single\.mp4"/);
  assert.match(motion, /DUO_KOI_FALLBACK = "\/brand\/koi-scroll-duo\.mp4"/);
  assert.ok((motion.match(/\bmuted\b/g) ?? []).length >= 2);
  assert.ok((motion.match(/\bplaysInline\b/g) ?? []).length >= 2);

  assert.ok(fs.existsSync(path.join(root, "public/brand/koi-scroll-single.mp4")));
  assert.ok(fs.existsSync(path.join(root, "public/brand/koi-scroll-duo.mp4")));
  assert.ok(fs.existsSync(path.join(root, "public/brand/koi-scroll-assets.sha256")));

  assert.match(finalStyles, /body:has\(\.koi-final\) > \.koi-companion/);
  assert.match(finalStyles, /\.koi-final__product-constellation/);
  assert.match(finalStyles, /\.koi-final__service-current/);
  assert.match(finalStyles, /\.koi-final__work-current/);
  assert.match(finalStyles, /\.koi-final__founder/);
  assert.match(finalStyles, /position: sticky/);
  assert.match(finalStyles, /\.koi-final \.studio-koi-depth-pass/);
  assert.doesNotMatch(finalStyles, /\.studio-problem-card|\.studio-pricing-card/);

  assert.match(layout, /import "\.\/koi-final\.css"/);
  assert.match(layout, /import "\.\/koi-final-tune\.css"/);
  assert.match(layout, /import KoiDepthPass from/);
  assert.match(layout, /<KoiDepthPass \/>/);
  assert.match(depth, /createPortal/);
  assert.match(depth, /9199e09c-1519-4fea-b7d8-c115f41cbe92/);
  assert.doesNotMatch(depth, /755ff0b5-7c99-4754-b9fb-b2fc88a7d886/);
  assert.match(depth, /SINGLE_KOI_FALLBACK = "\/brand\/koi-scroll-single\.mp4"/);
  assert.match(depth, /prefers-reduced-motion: reduce/);
  assert.match(depth, /connection\?\.saveData/);
  assert.match(depth, /aria-hidden="true"/);
  assert.match(depth, /\bmuted\b/);
  assert.match(depth, /\bplaysInline\b/);

  assert.match(depthStyles, /z-index: 3/);
  assert.match(depthStyles, /mix-blend-mode: screen/);
  assert.match(depthStyles, /-webkit-mask-image: radial-gradient/);
  assert.match(
    depthStyles,
    /data-koi-scene="products"\] \.studio-koi-depth-pass[\s\S]*opacity: 0/,
  );
  assert.match(tuneStyles, /object-fit: contain/);
  assert.match(tuneStyles, /\.koi-final \.studio-koi-depth-pass__video/);
  assert.match(tuneStyles, /var\(--koi-video-scale\) \+ var\(--koi-scene-scale\)/);
  assert.match(tuneStyles, /\.koi-final__copy--systems/);
  assert.match(tuneStyles, /\.koi-final__copy--start/);
  assert.match(tuneStyles, /\.koi-final__product--1/);
});
