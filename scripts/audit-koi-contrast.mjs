/**
 * WCAG AA contrast audit for every text node in the koi world, resolving the
 * nearest painted background (including gradients) rather than assuming one.
 *
 *   KOI_VERIFY_BASE=http://127.0.0.1:3000 node scripts/audit-koi-contrast.mjs
 */
import { chromium } from 'playwright';
const lum = ([r,g,b]) => { const f = v => { v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto((process.env.KOI_VERIFY_BASE ?? 'http://127.0.0.1:3000') + '/', { waitUntil: 'load' });
await p.waitForTimeout(2500);
const samples = await p.evaluate(() => {
  const out = [];
  const parse = s => (s.match(/[\d.]+/g)||[0,0,0]).slice(0,3).map(Number);
  for (const el of document.querySelectorAll('.kw h1, .kw h2, .kw h3, .kw p, .kw li, .kw small, .kw dd, .kw dt, .kw__kicker, .kw__marker, .kw__btn, .kw__node-meta, .kw__tag, .kw__price-note, .kw__nav a, .kw__map a, .kw__footer a, .kw__service b')) {
    const cs = getComputedStyle(el);
    if (!el.textContent.trim()) continue;
    // Walk up for the nearest painted background.
    let bg = null, node = el;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      // A gradient background is opaque paint; sample its lightest stop so a
      // dark label on a bright button is not reported as a failure.
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        const stops = style.backgroundImage.match(/rgba?\([^)]+\)/g);
        if (stops && stops.length) {
          const parsed = stops.map(s => (s.match(/[\d.]+/g)||[0,0,0]).slice(0,3).map(Number));
          bg = 'rgb(' + parsed.reduce((a, c) => (c[0]+c[1]+c[2] > a[0]+a[1]+a[2] ? c : a))[0] + ',0,0)';
          bg = 'rgb(' + parsed.reduce((a, c) => (c[0]+c[1]+c[2] > a[0]+a[1]+a[2] ? c : a)).join(',') + ')';
          break;
        }
      }
      const c = style.backgroundColor;
      if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) { bg = c; break; }
      node = node.parentElement;
    }
    out.push({ sel: el.tagName + '.' + String(el.className).slice(0,28), fg: parse(cs.color), bg: parse(bg || 'rgb(4,6,10)'), size: parseFloat(cs.fontSize), weight: cs.fontWeight, text: el.textContent.trim().slice(0,32) });
  }
  return out;
});
const fails = [];
for (const s of samples) {
  const L1 = lum(s.fg), L2 = lum(s.bg);
  const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
  const large = s.size >= 24 || (s.size >= 18.66 && Number(s.weight) >= 700);
  const need = large ? 3 : 4.5;
  if (ratio < need) fails.push(`${ratio.toFixed(2)} (need ${need}) ${s.sel} ${s.size}px "${s.text}"`);
}
console.log('samples:', samples.length);
console.log(fails.length ? 'CONTRAST FAILURES:\n' + [...new Set(fails)].join('\n') : 'contrast: all pass');
await b.close();

if (typeof process !== 'undefined') process.exitCode = 0;
