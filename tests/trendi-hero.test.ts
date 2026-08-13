import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildPeekPath,
  buildSwimPath,
  canReswim,
  computeReswimDelay,
  hasOpeningPlayed,
  markOpeningPlayed,
  openingTotalSeconds,
  TRENDI_HERO_SESSION_KEY,
} from "../lib/trendiHero";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const desktopLayout = {
  hero: { left: 0, top: 80, width: 1440, height: 820 },
  screen: { left: 1080, top: 240, width: 270, height: 540 },
  wordmark: { left: 80, top: 200, width: 620, height: 96 },
  cta: { left: 80, top: 620, width: 240, height: 52 },
};

test("the opening sequence stays under seven seconds", () => {
  assert.ok(openingTotalSeconds() <= 7, `total was ${openingTotalSeconds()}s`);
});

test("the opening runs once per session and repeat visits start in idle", () => {
  const store = fakeStorage();
  assert.equal(hasOpeningPlayed(store), false);
  markOpeningPlayed(store);
  assert.equal(hasOpeningPlayed(store), true);
  assert.equal(store.getItem(TRENDI_HERO_SESSION_KEY), "1");
  // A fresh session (new storage) plays again.
  assert.equal(hasOpeningPlayed(fakeStorage()), false);
  // Broken/absent storage fails open: the visitor just sees the animation.
  assert.equal(hasOpeningPlayed(null), false);
  assert.doesNotThrow(() => markOpeningPlayed(null));
});

test("the desktop swim path starts and ends at the phone screen's edge", () => {
  const path = buildSwimPath({ ...desktopLayout, compact: false });
  assert.match(path.d, /^M \d+ \d+/);
  // Exit and entry hug the screen's left edge (hero-local x ≈ 1080).
  assert.ok(Math.abs(path.exit.x - 1080) < 12, `exit x was ${path.exit.x}`);
  assert.ok(Math.abs(path.entry.x - 1080) < 12, `entry x was ${path.entry.x}`);
  assert.ok(path.exit.y < path.entry.y, "returns on a lower line than it left");
  // The wordmark pass happens before the CTA approach.
  assert.ok(path.wordmarkAt > 0 && path.wordmarkAt < path.ctaAt && path.ctaAt < 1);
});

test("every point of every path stays inside the hero", () => {
  for (const compact of [false, true]) {
    const hero = compact
      ? { left: 0, top: 60, width: 390, height: 760 }
      : desktopLayout.hero;
    const path = buildSwimPath({
      hero,
      screen: compact
        ? { left: 90, top: 460, width: 210, height: 320 }
        : desktopLayout.screen,
      wordmark: compact ? { left: 12, top: 120, width: 300, height: 64 } : desktopLayout.wordmark,
      cta: compact ? { left: 12, top: 330, width: 366, height: 52 } : desktopLayout.cta,
      compact,
    });
    const numbers = path.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      const x = numbers[i];
      const y = numbers[i + 1];
      assert.ok(x >= 0 && x <= hero.width, `x ${x} escapes hero width ${hero.width} (compact=${compact})`);
      assert.ok(y >= 0 && y <= hero.height, `y ${y} escapes hero height ${hero.height} (compact=${compact})`);
    }
  }
});

test("the mobile path is deliberately shorter than the desktop path", () => {
  const desktop = buildSwimPath({ ...desktopLayout, compact: false });
  const mobile = buildSwimPath({
    hero: { left: 0, top: 60, width: 390, height: 760 },
    screen: { left: 90, top: 460, width: 210, height: 320 },
    wordmark: { left: 12, top: 120, width: 300, height: 64 },
    cta: { left: 12, top: 330, width: 366, height: 52 },
    compact: true,
  });
  const span = (d: string) => {
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const xs = nums.filter((_, i) => i % 2 === 0);
    return Math.max(...xs) - Math.min(...xs);
  };
  assert.ok(span(mobile.d) < span(desktop.d) / 2, "mobile sweep should be far smaller");
});

test("the idle peek loop is smaller and skips wordmark/CTA moments", () => {
  const peek = buildPeekPath({ hero: desktopLayout.hero, screen: desktopLayout.screen });
  const opening = buildSwimPath({ ...desktopLayout, compact: false });
  assert.equal(peek.wordmarkAt, -1);
  assert.equal(peek.ctaAt, -1);
  const minX = (d: string) =>
    Math.min(...d.match(/-?\d+(\.\d+)?/g)!.map(Number).filter((_, i) => i % 2 === 0));
  assert.ok(minX(peek.d) > minX(opening.d), "peek stays near the phone");
});

test("re-swims happen every 15 seconds, and only when nothing interferes", () => {
  assert.equal(computeReswimDelay(() => 0), 15000);
  assert.equal(computeReswimDelay(() => 1), 15000);
  const clear = {
    reducedMotion: false,
    documentHidden: false,
    heroVisible: true,
    msSinceScroll: 5000,
    openingDone: true,
  };
  assert.equal(canReswim(clear), true);
  assert.equal(canReswim({ ...clear, reducedMotion: true }), false);
  assert.equal(canReswim({ ...clear, documentHidden: true }), false);
  assert.equal(canReswim({ ...clear, heroVisible: false }), false);
  assert.equal(canReswim({ ...clear, msSinceScroll: 200 }), false);
  assert.equal(canReswim({ ...clear, openingDone: false }), false);
});

test("the hero page keeps the approved positioning and a clickable CTA", async () => {
  const page = await readFile(new URL("../app/trendi/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("Type the thought. Get words to say on camera."));
  assert.ok(page.includes("Your content coach"));
  assert.ok(page.includes('id="trendi-hero-cta"'));
  assert.ok(page.includes("mailto:koinophobia999@gmail.com"));
  assert.ok(page.includes("Ask about Trendi"));
  assert.ok(!page.match(/launch updates|availability news/i));
  assert.ok(!page.match(/TestFlight|beta access|limited beta/i));
  // Semantic heading order: the h1 is the promise, not the decorative mark.
  assert.ok(page.indexOf('id="trendi-identity"') < page.indexOf("<h1"));
});

test("Trendi privacy and support routes are publication-ready and discoverable", async () => {
  const [privacy, support, sitemap, brandIntro] = await Promise.all([
    readFile(new URL("../app/trendi/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/trendi/support/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/brand/BrandIntro.tsx", import.meta.url), "utf8"),
  ]);

  for (const page of [privacy, support]) {
    assert.ok(page.includes("koinophobia999@gmail.com"));
    assert.ok(!page.includes("blake@koinophobialabs.com"));
    assert.ok(!page.match(/placeholder|launch draft|do not publish/i));
  }

  assert.ok(privacy.includes('canonical: "/trendi/privacy"'));
  assert.ok(privacy.includes("Anthropic"));
  assert.ok(privacy.includes("on device or send it to Apple for recognition"));
  assert.ok(!privacy.includes("when recognition is not available on device"));
  assert.ok(privacy.includes("scheduled for deletion 24 hours after delivery"));
  assert.ok(privacy.includes("scheduled for deletion at the end of a seven-day"));
  assert.ok(privacy.includes("Recurring cleanup removes due results"));
  assert.ok(privacy.includes("content-free deletion and revoked-session"));
  assert.ok(privacy.includes("safeguards for up to 24 hours solely"));
  assert.ok(privacy.includes("up to 90 days"));
  assert.ok(privacy.includes("account-scoped Coach results"));
  assert.ok(privacy.includes("Google"));
  assert.ok(privacy.includes("Support and inquiry messages"));
  assert.ok(privacy.includes("flagged inputs and outputs may be retained for up to two"));
  assert.ok(privacy.includes("reset your AI"));
  assert.ok(privacy.includes("asks for consent again before sending another request"));
  assert.ok(support.includes('href="/trendi/privacy"'));
  assert.ok(support.includes("Coach results and"));
  assert.ok(support.includes("safeguards may remain for"));
  assert.ok(sitemap.includes('\"/trendi/privacy\"'));
  assert.ok(sitemap.includes('\"/trendi/support\"'));
  assert.ok(brandIntro.includes('pathname === "/trendi/privacy"'));
  assert.ok(brandIntro.includes('pathname === "/trendi/support"'));
});

test("decorative animation layers cannot intercept pointer events or a11y", async () => {
  const visual = await readFile(
    new URL("../components/trendi/TrendiHeroVisual.tsx", import.meta.url),
    "utf8"
  );
  assert.ok(visual.includes('aria-hidden="true"'));
  const css = await readFile(new URL("../app/trendi-hero-visual.css", import.meta.url), "utf8");
  assert.ok(css.includes("pointer-events: none"));
  assert.ok(css.includes("prefers-reduced-motion: reduce"));
  assert.ok(css.includes('data-paused="true"'));
});
