# The koi world — implementation report

## Scroll-experience refinement — 2026-08-18

This pass preserved the existing world and corrected its pacing, legibility,
loading, and control behavior rather than redesigning it.

- Reading holds now occupy `t = 0.25…0.70`; desktop bands are shorter and
  mobile sections use natural document flow rather than imitating a sticky
  desktop composition.
- Non-hero hold poses settle the koi in upper-right open water with lower
  scale, opacity, depth, and a softer focus. The fish remains the transition
  guide without occupying the product, service, proof, founder, or CTA planes.
- Per-word post-hydration DOM mutation and blur animation were removed. Copy
  reveals as one composited block, remains still during the hold, and retraces
  cleanly on reverse scroll.
- Destination activation uses a viewport focus line consistently for both the
  active section and local progress. The masthead and journey map expose
  `aria-current="location"`; mobile map targets are 44 × 44 px.
- Initial media loading is hero-only. Next and transition clips warm metadata
  first only after real movement, then upgrade near departure.
- The water canvas has pixel budgets, phase-aware frame throttling, and
  deduplicated CSS-variable writes. Video/source URLs are cleared together on
  eviction, pointer light exits correctly, and breakpoint source comparisons
  no longer reload identical media.
- Mobile copy is never dimmed or disabled, the fixed masthead occludes passing
  content cleanly, and reduced-motion / Save-Data still create no video.

Measured in the same software-rendered Playwright harness:

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| Laptop initial transfer | 3.89 MB | 1.68 MB | −56.8% |
| Laptop initial media | 3.41 MB / 7 files | 1.20 MB / 3 files | −64.8% |
| Mobile initial transfer | 2.32 MB | 1.18 MB | −49.0% |
| Mobile initial media | 1.84 MB / 7 files | 0.70 MB / 3 files | −61.9% |
| Laptop initial layout shift | 0.0486 | 0 | eliminated |
| Laptop scripted-scroll layout shift | 0.3527 | 0 | eliminated |
| Laptop frame-gap median / p95 | 75.8 / 124.3 ms | 46.9 / 87.8 ms | −38.1% / −29.4% |
| Ultrawide frame-gap median / p95 | 122.5 / 206.1 ms | 72.8 / 189.5 ms | −40.6% / −8.1% |
| Laptop two-pass journey media | 6.238 MB | 6.236 MB | no refetch penalty |
| Mobile two-pass journey media | 3.466 MB | 3.006 MB | −13.3% |

The repository verifier captured 42 final screenshots across desktop-xl,
laptop, tablet, iPhone, Android, and reduced motion. The quantitative audit
also covered 2560 × 1080 ultrawide and 1440 × 1200 tall-screen layouts and
recorded complete laptop and mobile journeys.

## What changed

The homepage was a koi video playing behind a stack of sections. It is now a
single continuous underwater journey in which the koi is the guide, the camera
anchor and the navigation system, and the page exists inside its world.

| | Before | After |
| --- | --- | --- |
| Koi | Full-bleed background video, scrubbed by seeking `currentTime` every 36 ms | Composited element with pose, scale, depth plane and blur driven by scroll; never seeked |
| Environment | The video's own frame | Procedural WebGL water — depth, caustics, particulate, wake, cursor light — that the clip fuses into |
| Video source | Two clips preloaded eagerly from an external CDN | Eight clips, local, one loaded on mount, the rest one destination ahead |
| Depth | None; the koi was always behind everything | Far plane, glass-refracted mid plane, and foreground passes that occlude the page |
| Mobile | The desktop composition, cropped | A separate composition: natural flow, koi held above the copy, halved particles, 854 px renditions |
| Reduced motion | Video suppressed | A designed still journey with every destination intact |
| Stylesheets | Six overlapping koi stylesheets, ~3,200 lines | One, ~1,400 lines |

## Architecture, and why

**Scroll drives choreography, not decode.** The single biggest reason
scroll-driven video feels broken is seeking a compressed stream by
`currentTime` — every seek is a keyframe hunt, and on mobile Safari it stalls.
So the clip is never seeked. It plays forward continuously and `playbackRate`
ramps with the phase, while scroll drives the koi's *position, scale, rotation,
depth plane and blur*. Those are pure transforms: exact in both directions,
free to reverse, and immune to decode latency. The footage supplies organic
motion; the site supplies the direction.

**The world is procedural, the koi is filmed.** The water is one fragment
shader with no textures and no assets — depth volume, drifting caustics, three
parallax planes of particulate that streak under surge, a cursor-following
light, and a grain floor that stops the gradients banding. It costs nothing to
download and scrubs perfectly in both directions. The koi clip sits on top with
`mix-blend-mode: screen`, so the clip's black water contributes nothing: the
filmed water and the procedural water become one body, with no rectangle and no
seam. The clip's own edge is feathered with a radial mask so that when the koi
sits back at half scale, the frame boundary dissolves instead of ending on a
line.

**Occlusion without a matte.** A luma key on this footage leaves holes — the
koi's body is genuinely darker than the water's specular highlights, so a
silhouette matte would have needed a per-frame hole-filling pipeline. Instead
the koi's mass is expressed as a multiply-blended veil positioned at its
centroid, ramped by depth. Screen-blended light plus a multiplied shadow at the
same position is what makes a body read as passing *between* the viewer and the
page. One decoder, no matte extraction, works on every browser.

**Duplicate koi are structurally impossible.** Two clips are never visible at
once. When the desired clip changes, the outgoing one fades to zero, the swap
happens at exactly zero opacity, then the incoming clip fades up. A crossfade
would have been easier to write and would have risked a visible second fish.
The two-koi composition appears only in the products reveal, and the
`separate` segment returns the journey to one navigation koi before it leaves.

**No new dependencies.** No Three.js, no GSAP, no scroll library. Raw WebGL2
(~280 lines), one client component, one stylesheet, one config module. The
simplest architecture that delivers the result.

## What the visitor gets

Six destinations — Enter, Products, Systems, Work, Founder, Start — each with a
calm reading hold, all in real HTML: headings, paragraphs, product names,
prices, links, buttons, navigation and labels. Nothing commercial is baked into
generated footage. Every price, timeline, service description, product status
and work item is read from `lib/commercial.ts`; none of it is retyped into the
page, so the source of truth stays single.

Koi Cave is included in the constellation and labelled exactly as the
repository labels it — a private, dev-signed build that is not distributable —
with no call to action implying otherwise. No metrics, customers, partnerships
or case-study results were invented; the concept builds remain labelled as
concept builds.

The Revenue Leak Audit gets its own commercial moment: price, flat-fee framing,
timeline, the full inclusion list, what the client receives, and a primary CTA,
inside a panel whose surface is threaded with fine lines of escaping light that
knit back together on hover. A metaphor for leakage, not a diagram of one.

## Verification

`npm run koi:verify` walks the journey at 1920×1080, 1440×900, 834×1112,
iPhone 15 Pro and Pixel 7, plus a reduced-motion pass, screenshotting every
destination at its reading hold and auditing each position for horizontal
overflow, content clipped out of a sticky stage, sub-24 px tap targets, the
correct active destination, console errors and failed requests. It also sweeps
the full page in reverse and asserts the journey lands back on the hero.

Final run: **clean at every viewport**. The only browser-verifier entry is the
expected localhost 404 for `/_vercel/insights/script.js`; the URL-attributed
functional audit excludes only that production-only endpoint and found no
other console, page, or HTTP errors.

`npm run koi:contrast` resolves the nearest painted background for every text
node — following gradients, not just background colours — and checks WCAG AA.
**90 of 90 samples pass.** Reaching that moved the faintest type tier from
`#647787` to `#8b9daa` and lifted the smallest labels off the 10 px floor.

`npx tsx --test tests/commercial.test.ts` — 8/8 pass. The old test asserted the
previous implementation's internals; it now asserts the invariants that matter:
six destinations wired from one config, retired modules actually deleted,
commercial values interpolated rather than hardcoded, no `currentTime`
assignment anywhere, the zero-opacity swap, one duo clip only, the still
journey's completeness, and that every clip the journey references ships both
renditions and a poster.

The final functional audit also passed keyboard tab order, 27 homepage links,
current-location semantics, reduced motion, Save-Data, failed-video poster
fallback, touch scrolling, horizontal overflow, and 44 px mobile map targets.

## Performance

- The shipped media inventory is unchanged; no replacement koi asset was
  generated. Initial laptop media transfer fell from 3.41 MB to 1.20 MB and
  initial mobile media transfer from 1.84 MB to 0.70 MB because only the hero
  poster and hero rendition are requested before movement.
- A following clip first warms metadata after local progress 0.42 and upgrades
  to full preload after 0.56; transition media follows the same late policy.
- Reached clips remain as paused elements, preventing reverse scroll from
  re-downloading media while keeping initial and one-ahead loading unchanged.
- The shader is bounded to 2.2 MP desktop / 0.9 MP mobile, DPR capped at 1.35 /
  1.25, and render cadence rests at 20 / 15 fps during calm holds.
- Scripted layout shift measured zero at initial load and during the complete
  scroll sweep at laptop, ultrawide, tall, tablet, and mobile sizes.
- `visibilitychange` pauses every video and skips the render loop entirely.
- Reduced motion and Save-Data create no canvas, no video element, and fetch no
  clip at all.
- Sections have fixed heights in viewport units, so there is no layout shift
  from media.

## Known limitations

1. `backdrop-filter` is unsupported in the headless Chromium used for
   verification, so the glass panels were validated by their background colour
   alone; they carry an opaque fallback and are legible without it.
