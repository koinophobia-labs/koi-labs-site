/**
 * Walks the koi journey at five viewports plus reduced motion, screenshots every
 * destination at its reading hold, and reports layout, contrast-adjacent and
 * console defects. Run against a built server:
 *
 *   npm run build && npm start &
 *   KOI_VERIFY_BASE=http://127.0.0.1:3000 npm run koi:verify
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.KOI_VERIFY_BASE ?? 'http://127.0.0.1:3000';
const OUT = process.env.KOI_VERIFY_OUT ?? 'koi-verification';
const DESTS = ['enter','products','systems','work','founder','start'];

const VIEWPORTS = [
  { name: 'desktop-xl', viewport: { width: 1920, height: 1080 }, dpr: 1 },
  { name: 'laptop',     viewport: { width: 1440, height: 900 },  dpr: 2 },
  { name: 'tablet',     viewport: { width: 834,  height: 1112 }, dpr: 2 },
  { name: 'iphone',     ...devices['iPhone 15 Pro'] },
  { name: 'android',    ...devices['Pixel 7'] },
];

const problems = [];

async function shootJourney(browser, spec, opts = {}) {
  const ctx = await browser.newContext({
    ...spec,
    name: undefined,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2600);

  const tag = opts.reduced ? `${spec.name}-reduced` : spec.name;

  for (const id of DESTS) {
    // Scroll to the middle of the destination's hold band.
    await page.evaluate((sectionId) => {
      const el = document.getElementById(sectionId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const travel = Math.max(rect.height - window.innerHeight, 1);
      window.scrollTo({ top: top + travel * 0.46, behavior: 'instant' });
    }, id);
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${OUT}/${tag}--${id}.png` });

    // Layout audit at this position.
    const audit = await page.evaluate((sectionId) => {
      const out = { id: sectionId, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, offscreen: [], tiny: [] };
      const scope = document.getElementById(sectionId);
      if (!scope) return out;
      const active = document.querySelector('.kw')?.dataset.koiDestination;
      out.active = active;
      if (active !== sectionId) return out;
      for (const el of scope.querySelectorAll('a, button, h1, h2, h3, p, li, dd, dt, strong, small')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        // Only horizontal escape is a defect. A tall section that continues
        // below the fold is how scrolling works.
        if (r.right < -2 || r.left > window.innerWidth + 2) {
          out.offscreen.push(`${el.tagName}.${el.className}`.slice(0, 70));
        }
        // On desktop the reading stage is sticky, so anything that spills out
        // of the viewport vertically genuinely cannot be read.
        if (window.innerWidth > 860 && (r.bottom < -2 || r.top > window.innerHeight + 2)) {
          out.offscreen.push(`CLIPPED ${el.tagName}.${el.className}`.slice(0, 70));
        }
        if (el.matches('a, button')) {
          const style = getComputedStyle(el);
          if (style.pointerEvents !== 'none' && (r.height < 24 || r.width < 24)) {
            out.tiny.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent||'').trim().slice(0,26)}"`);
          }
        }
      }
      return out;
    }, id);
    if (audit.overflowX) problems.push(`[${tag}/${id}] horizontal overflow`);
    if (audit.active !== id) problems.push(`[${tag}/${id}] active destination was "${audit.active}"`);
    if (audit.offscreen.length) problems.push(`[${tag}/${id}] offscreen: ${audit.offscreen.slice(0,3).join(', ')}`);
    if (audit.tiny.length) problems.push(`[${tag}/${id}] small tap target: ${audit.tiny.slice(0,3).join(' | ')}`);
  }

  // Reverse scroll sweep.
  await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    for (let i = 40; i >= 0; i--) {
      window.scrollTo({ top: (max * i) / 40, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 16));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(700);
  const afterReverse = await page.evaluate(() => ({
    dest: document.querySelector('.kw')?.dataset.koiDestination,
    ready: document.querySelector('.kw')?.dataset.koiReady,
    opacity: getComputedStyle(document.querySelector('#enter .dest__inner')).opacity,
  }));
  if (afterReverse.dest !== 'enter') problems.push(`[${tag}] reverse scroll ended on "${afterReverse.dest}"`);
  if (Number(afterReverse.opacity) < 0.9) problems.push(`[${tag}] hero copy dim after reverse scroll (${afterReverse.opacity})`);
  await page.screenshot({ path: `${OUT}/${tag}--reverse-top.png` });

  const filtered = errors.filter(e => !/favicon|Download the React DevTools|analytics/i.test(e));
  if (filtered.length) problems.push(`[${tag}] console/network: ${[...new Set(filtered)].slice(0,4).join(' :: ')}`);

  await ctx.close();
  return { tag, errors: filtered };
}

import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

// Software GL keeps this runnable on CI boxes with no GPU.
const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const results = [];
for (const spec of VIEWPORTS) results.push(await shootJourney(browser, spec));
results.push(await shootJourney(browser, VIEWPORTS[1], { reduced: true }));
await browser.close();

console.log('=== PROBLEMS ===');
console.log(problems.length ? problems.join('\n') : 'none');
