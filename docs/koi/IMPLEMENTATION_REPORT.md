# The koi world — implementation report

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

Final run: **clean at every viewport**. The only remaining console entry is a
404 for `/_vercel/insights/script.js`, which exists only when deployed on
Vercel.

`npm run koi:contrast` resolves the nearest painted background for every text
node — following gradients, not just background colours — and checks WCAG AA.
**97 of 97 samples pass.** Reaching that moved the faintest type tier from
`#647787` to `#8b9daa` and lifted the smallest labels off the 10 px floor.

`npx tsx --test tests/commercial.test.ts` — 8/8 pass. The old test asserted the
previous implementation's internals; it now asserts the invariants that matter:
six destinations wired from one config, retired modules actually deleted,
commercial values interpolated rather than hardcoded, no `currentTime`
assignment anywhere, the zero-opacity swap, one duo clip only, the still
journey's completeness, and that every clip the journey references ships both
renditions and a poster.

## Performance

- 7.7 MB of media total, none of it loaded up front. The hero clip is the only
  one created on mount; each destination's clip is created when the visitor is
  34% through the previous one, so it buffers during a reading hold.
- The video pool holds at most four elements and evicts the least recently
  needed.
- Shader renders at 0.85 scale desktop / 0.7 mobile, DPR capped at 1.5 / 1.25.
- `visibilitychange` pauses every video and skips the render loop entirely.
- Reduced motion and Save-Data create no canvas, no video element, and fetch no
  clip at all.
- Sections have fixed heights in viewport units, so there is no layout shift
  from media.

## Known limitations

1. **Five generated segments are staged, not shipped.** They rendered
   successfully in Higgsfield but this sandbox's network reaches only GitHub,
   so they could not be pulled down. Five destinations currently ship interim
   beats cut from the same masters — the same koi, the same world, distinct
   compositions per destination. Swapping is a pure file replacement; see
   `SHOT_MANIFEST.md`.
2. **Segment 06 (`koi-open`) was still rendering** when this build was cut.
3. **The deployed site has not been visually verified**, because deployment
   requires a push this session cannot make. Verification was performed against
   a production build (`next build` + `next start`) at all five viewports.
4. `backdrop-filter` is unsupported in the headless Chromium used for
   verification, so the glass panels were validated by their background colour
   alone; they carry an opaque fallback and are legible without it.
