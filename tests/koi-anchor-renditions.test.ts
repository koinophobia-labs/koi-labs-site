import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("koi anchor renditions preserve the fish as the shared visual anchor", () => {
  const component = read("components/studio/KoiAnchorRendition.tsx");
  const styles = read("app/koi-anchor-renditions.css");

  assert.ok(fs.existsSync(path.join(root, "app/koi-renditions/orbit/page.tsx")));
  assert.ok(fs.existsSync(path.join(root, "app/koi-renditions/wake/page.tsx")));
  assert.match(component, /mode: KoiAnchorMode/);
  assert.match(component, /data-koi-anchor-mode=\{mode\}/);
  assert.equal((component.match(/<AnchorScene/g) ?? []).length, 6);
  assert.match(component, /data-koi-duo=\{duo \? "true" : undefined\}/);
  assert.match(component, /The koi holds the center/);
  assert.match(component, /COPY ORBITS THE KOI/);
  assert.match(component, /COPY TRAILS THE KOI/);
  assert.match(component, /const HOLD_START = 0\.34/);
  assert.match(component, /const HOLD_END = 0\.66/);
  assert.match(component, /orbitAngle/);
  assert.match(component, /part\.style\.transform/);

  assert.match(styles, /\.koi-anchor__center/);
  assert.match(styles, /\.koi-anchor--orbit \.koi-anchor__copy/);
  assert.match(styles, /\.koi-anchor--wake \[data-anchor-part\]/);
  assert.match(styles, /position: sticky/);
  assert.match(styles, /KOI \/ ANCHOR/);
  assert.match(styles, /body:has\(\.koi-anchor\) > \.koi-companion/);
});

test("the two renditions are comparison routes, not replacements for the current homepage", () => {
  const orbit = read("app/koi-renditions/orbit/page.tsx");
  const wake = read("app/koi-renditions/wake/page.tsx");
  const currentHomepage = read("app/page.tsx");

  assert.match(orbit, /mode="orbit"/);
  assert.match(wake, /mode="wake"/);
  assert.match(orbit, /index: false/);
  assert.match(wake, /index: false/);
  assert.match(currentHomepage, /className="studio-site studio-site--koi koi-world"/);
  assert.doesNotMatch(currentHomepage, /KoiAnchorRendition/);
});
