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

test("the studio homepage is composed around scroll-linked koi hold points", () => {
  const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
  const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
  const motion = fs.readFileSync(
    path.join(root, "components/studio/ScrollKoiExperience.tsx"),
    "utf8",
  );
  const depth = fs.readFileSync(
    path.join(root, "components/studio/KoiDepthPass.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app/koi-scroll.css"),
    "utf8",
  );
  const depthStyles = fs.readFileSync(
    path.join(root, "app/koi-depth.css"),
    "utf8",
  );

  assert.match(page, /<ScrollKoiExperience \/>/);
  assert.equal((page.match(/data-koi-frame=/g) ?? []).length, 9);
  assert.match(page, /data-koi-duo="true"/);
  assert.match(page, /data-koi-side="left"/);
  assert.match(page, /data-koi-side="right"/);

  assert.match(motion, /const RAMP_START = 0\.32/);
  assert.match(motion, /const RAMP_END = 0\.68/);
  assert.match(motion, /Math\.sin\(Math\.PI \* rampProgress\)/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /connection\?\.saveData/);
  assert.match(
    motion,
    /const SINGLE_KOI_SRC = "\/brand\/koi-scroll-single\.mp4"/,
  );
  assert.match(
    motion,
    /const DUO_KOI_SRC = "\/brand\/koi-scroll-duo\.mp4"/,
  );
  assert.doesNotMatch(motion, /cloudfront|higgsfield/i);
  assert.ok((motion.match(/\bmuted\b/g) ?? []).length >= 2);
  assert.ok((motion.match(/\bplaysInline\b/g) ?? []).length >= 2);

  assert.ok(
    fs.existsSync(path.join(root, "public/brand/koi-scroll-single.mp4")),
  );
  assert.ok(
    fs.existsSync(path.join(root, "public/brand/koi-scroll-duo.mp4")),
  );
  assert.ok(
    fs.existsSync(path.join(root, "public/brand/koi-scroll-assets.sha256")),
  );

  assert.match(styles, /body:has\(\.studio-site--koi\) \.brand-intro/);
  assert.match(styles, /--koi-heading-position/);
  assert.match(styles, /--koi-video-brightness/);
  assert.match(styles, /\[data-koi-side="right"\]/);
  assert.match(styles, /\[data-koi-duo\]/);

  assert.match(layout, /import KoiDepthPass from/);
  assert.match(layout, /import "\.\/koi-depth\.css"/);
  assert.match(layout, /<KoiDepthPass \/>/);
  assert.match(depth, /createPortal/);
  assert.match(depth, /\.studio-scroll-koi__video--single/);
  assert.match(depth, /prefers-reduced-motion: reduce/);
  assert.match(depth, /connection\?\.saveData/);
  assert.match(
    depth,
    /const SINGLE_KOI_SRC = "\/brand\/koi-scroll-single\.mp4"/,
  );
  assert.doesNotMatch(depth, /cloudfront|higgsfield/i);
  assert.match(depth, /aria-hidden="true"/);
  assert.match(depth, /\bmuted\b/);
  assert.match(depth, /\bplaysInline\b/);

  assert.match(depthStyles, /z-index: 3/);
  assert.match(depthStyles, /mix-blend-mode: screen/);
  assert.match(depthStyles, /-webkit-mask-image: radial-gradient/);
  assert.match(depthStyles, /\[data-koi-scene="return"\]/);
  assert.match(
    depthStyles,
    /\[data-koi-scene="products"\] \.studio-koi-depth-pass/,
  );
});
