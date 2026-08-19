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

test("the koi world leads through six destinations without hiding the business", () => {
  const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
  const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
  const world = fs.readFileSync(
    path.join(root, "components/koi/KoiWorld.tsx"),
    "utf8",
  );
  const water = fs.readFileSync(
    path.join(root, "components/koi/water.ts"),
    "utf8",
  );
  const journey = fs.readFileSync(path.join(root, "lib/koi/journey.ts"), "utf8");
  const styles = fs.readFileSync(path.join(root, "app/koi-world.css"), "utf8");

  // Six destinations, wired in one place and rendered as real sections.
  const ids = ["enter", "products", "systems", "work", "founder", "start"];
  for (const id of ids) {
    assert.match(journey, new RegExp(`id: "${id}"`));
    assert.match(page, new RegExp(`id="${id}"`));
  }
  assert.equal((page.match(/className="dest dest--/g) ?? []).length, 6);
  assert.match(page, /<KoiWorld \/>/);
  assert.match(layout, /import "\.\/koi-world\.css"/);

  // Every retired homepage koi module is gone, not merely unused.
  assert.doesNotMatch(layout, /KoiDepthPass/);
  assert.doesNotMatch(page, /ScrollKoiExperience|KoiNavigationMotion/);
  for (const retired of [
    "app/koi-scroll.css",
    "app/koi-finished.css",
    "app/koi-navigation-clarity.css",
    "app/koi-navigation-final.css",
    "app/koi-wayfinding.css",
    "app/koi-depth.css",
    "components/studio/ScrollKoiExperience.tsx",
    "components/studio/KoiNavigationMotion.tsx",
    "components/studio/KoiDepthPass.tsx",
  ]) {
    assert.equal(
      fs.existsSync(path.join(root, retired)),
      false,
      `${retired} should have been removed`,
    );
  }

  // Commercial truth comes from lib/commercial, never from hardcoded copy.
  assert.match(page, /from "@\/lib\/commercial"/);
  assert.match(page, /serviceOffers\.find/);
  assert.match(page, /workProjects\.map/);
  assert.doesNotMatch(page, /\$250(?!\})/); // the audit price is interpolated
  assert.match(page, /studioConfig\.auditPrice/);
  assert.match(page, /studioConfig\.auditTimeline/);

  // Koi Cave is present but never presented as something a visitor can obtain.
  assert.match(page, /Koi Cave/);
  assert.match(page, /Private build · not distributable/);
  assert.doesNotMatch(
    page,
    /<Link\s+key=\{node\.title\}/,
    "product cards that may cross a host rewrite must use full navigation",
  );

  // The koi is composited into the page, not parked behind it.
  assert.match(styles, /mix-blend-mode: screen/);
  assert.match(styles, /mask-image: radial-gradient/);
  assert.match(styles, /\.koi-world__veil/);
  assert.match(styles, /mix-blend-mode: multiply/);
  assert.match(styles, /backdrop-filter/);

  // Scroll grammar: arrive, hold, depart — and never a seek.
  assert.match(journey, /export const ARRIVE_END/);
  assert.match(journey, /export const DEPART_START/);
  assert.match(world, /playbackRate/);
  assert.doesNotMatch(world, /\.currentTime\s*=/);

  // Exactly one clip can be visible, so a duplicate koi is structurally
  // impossible: the outgoing clip must reach zero before the swap.
  assert.match(world, /if \(envelope <= 0\)/);
  assert.match(world, /mountedKey = desired/);

  // The two-koi composition is confined to the products reveal, and the
  // journey returns to a single navigation koi immediately afterwards.
  assert.equal((journey.match(/clip: "duo"/g) ?? []).length, 1);
  assert.match(journey, /transitionClip: "separate"/);

  // Reduced motion and Save-Data get a designed still journey, not a stub.
  assert.match(world, /prefers-reduced-motion: reduce/);
  assert.match(world, /saveData/);
  assert.match(world, /effectiveType/);
  assert.match(world, /koi-world__still/);
  assert.match(styles, /\[data-motion="still"\]/);

  // Performance and resilience.
  assert.match(world, /visibilitychange/);
  assert.match(world, /const hasMoved =/);
  assert.match(world, /ensureVideo\(next\.clip, t > 0\.56 \? "auto" : "metadata"\)/);
  assert.doesNotMatch(world, /pool\.delete/);
  assert.match(world, /koiFallback/);
  assert.match(world, /854/); // mobile rendition
  assert.match(water, /webgl2/);

  // The page must still read as HTML with no JavaScript at all.
  assert.match(styles, /\.kw\[data-koi-ready="true"\] \.dest__inner/);
});

test("every koi clip referenced by the journey ships both renditions and a poster", () => {
  const journey = fs.readFileSync(path.join(root, "lib/koi/journey.ts"), "utf8");
  const ids = [...journey.matchAll(/id: "(koi-[a-z]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 8, "expected the full clip set");
  for (const id of ids) {
    for (const file of [`${id}-1280.mp4`, `${id}-854.mp4`]) {
      assert.ok(
        fs.existsSync(path.join(root, "public/koi", file)),
        `missing public/koi/${file}`,
      );
    }
  }
  const posters = [...journey.matchAll(/poster: "\/koi\/([a-z-]+\.webp)"/g)].map(
    (m) => m[1],
  );
  for (const poster of posters) {
    assert.ok(
      fs.existsSync(path.join(root, "public/koi", poster)),
      `missing public/koi/${poster}`,
    );
  }
});
