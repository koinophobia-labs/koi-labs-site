# Koi journey — scroll-state map

Source of truth: `lib/koi/journey.ts`. This explains it.

## Grammar

Every destination owns a scroll band taller than the viewport. Local progress
`t` runs 0 → 1 as the band passes:

```
t 0.00 → 0.25   ARRIVE   koi decelerates in, copy settles, water shifts mood
t 0.25 → 0.70   HOLD     copy static and readable, koi settles in open water
t 0.70 → 1.00   DEPART   koi accelerates out, next mood blends in
```

Nothing hijacks scrolling. `t` is a pure function of `window.scrollY`, so
reverse scrolling, keyboard paging, trackpad flicks, touch drags, anchor links,
browser back/forward and refreshing at any offset all behave identically and
symmetrically.

**The koi is never seeked.** Seeking compressed video by `currentTime` is what
makes scroll-scrubbed video feel broken — it is the single biggest reason these
experiences fail on mobile Safari. Instead the clip plays forward continuously
and `playbackRate` ramps with the phase:

| Phase | Rate |
| --- | --- |
| Hold | 0.50 + 0.35 × scroll speed |
| Arrive | 0.62 |
| Depart | 0.72 + 1.15 × surge |

Clamped to 0.25 – 2.20. The koi settles while you read and accelerates through
transitions, identically whichever direction you scroll. The choreography —
where the koi sits, how large it is, which depth plane it occupies — is what
scroll actually drives, and that is a pure transform, so it is exact in both
directions with zero decode cost.

The koi also carries inertia: the published pose follows the target with an
exponential lag (4.4/s while holding, 7.5/s while departing), so it moves like
a body with mass instead of being welded to the scroll offset.

## Destinations

| # | id | Band (desktop / mobile) | Clip | Transition | Koi hold pose (x, y, scale, depth) | Water |
| --- | --- | --- | --- | --- | --- | --- |
| 00 | `enter` | 2.40 / 1.45 vh | `lead` | `glass` | 0.16, −0.04, 1.18, 0.28 | cool, light high-left, depth 0.42 |
| 01 | `products` | 2.75 / 1.25 vh | `duo` | `separate` | 0.90, −0.58, 0.68, 0.01 | brighter, depth 0.60, particles 1.0 |
| 02 | `systems` | 3.00 / 1.25 vh | `systems` | — | 0.90, −0.58, 0.68, 0.01 | coldest, depth 0.78, light low-left |
| 03 | `work` | 2.80 / 1.25 vh | `work` | — | 0.98, −0.62, 0.68, 0.01 | depth 0.66, light high-right |
| 04 | `founder` | 2.45 / 1.30 vh | `still` | — | 0.90, −0.62, 0.66, 0.01 | warmest, depth 0.34, few particles |
| 05 | `start` | 2.60 / 1.35 vh | `open` | — | 0.90, −0.62, 0.68, 0.01 | most open, depth 0.95, caustics 0.85 |

`x` and `y` are viewport-relative (−1 … 1). `scale` below 1 pulls the koi back
into the water; above 1 brings it toward the lens. `depth` above ~0.42 promotes
the koi in front of the reading surface and raises the occlusion veil.

## How the koi and the page occupy one space

Back to front: WebGL water canvas → koi clip → HTML content → veil → grain.

The koi clip is composited with `mix-blend-mode: screen`. The clip's black
water contributes nothing, so there is no rectangle and no seam — the filmed
water and the procedural water fuse into one body. The clip's own edge is
additionally feathered with a radial mask, so when the koi sits back at 0.5
scale the frame boundary dissolves rather than ending on a hard edge.

Content panels use `backdrop-filter`, so when the koi passes behind a panel you
see it refracted through the glass. When `depth` crosses 0.42 the koi is
promoted above the content layer and `--koi-front` ramps a multiply-blended
veil positioned at the koi's centroid. Screen-blended light plus a multiplied
shadow at the same position is what makes a body read as passing *between* the
viewer and the page rather than glowing on top of it.

## Clip switching — why there can never be two koi

Two clips are never visible at once. When the desired clip changes, the current
one fades to zero over 0.24 s, the swap happens at exactly zero opacity, then
the incoming clip fades up. During that window the water shader's `surge`
uniform peaks, so the gap reads as the koi accelerating through rather than as
a cut. A crossfade would have been smoother to write and would have risked a
visible duplicate; this cannot.

Loop seams use the same idea: within 0.42 s of either end of a clip the koi
layer dims to 45%, so it dips into the dark and re-emerges instead of popping.

## The through-the-glass moment

Between `enter` and `products`, the `glass` segment takes over at t > 0.76 and
the hero's departure pose drives `scale` to 1.8 and `depth` to 0.78. It happens
once, at a transition, never while anyone is reading.

## Desktop

Sticky reading stage inside each band. The koi uses the full width for lateral
travel, deep parallax and foreground passes. Constellation and proof cards sit
at staggered depths driven by `--koi-hold`, so the grid has volume during the
hold and flattens as the koi moves on. Section map on the right edge doubles as
a depth gauge; a hairline progress rail sits at the bottom.

A `min-width: 861px and max-height: 960px` block tightens the vertical rhythm
for laptops and landscape tablets, which have the width for the full
composition but not the height.

## Mobile (≤ 860 CSS px)

Not a cropped desktop. The sticky stage is dropped entirely — a 660 px viewport
cannot hold a reading stage — so copy flows naturally and the fixed koi
re-poses around it. Poses are overridden per destination to sit high (y ≈ −0.6)
so the koi always has clear water *above* the copy and never swims underneath
it. During reading holds it settles even farther into the upper-right water at
low opacity and depth. Particle density is reduced, the shader uses a 0.9 MP
pixel budget and 0.5 quality, DPR is capped at 1.25, grids collapse to one column, tap targets are
at least 44 px, the masthead occludes opaquely, and the 854 px renditions are
selected. The narrative and every piece of content are identical.

## Reduced motion / Save-Data

`prefers-reduced-motion: reduce`, `navigator.connection.saveData`, or an
effective connection of 2g/slow-2g selects the still experience. No canvas is
created, no video element is created, no clip is fetched. Poster stills
crossfade per destination via an IntersectionObserver, sticky stages are
dropped, bands collapse to natural height, and all six destinations — every
link, price and call to action — remain present and reachable.

## Failure behaviour

- **No WebGL2** — the canvas hides and a layered CSS gradient carries the water.
- **A clip fails to fetch or decode** — that clip holds on its own poster, so
  the destination keeps the correct angle and the decoder is not retried.
- **No JavaScript at all** — `.dest__inner` is fully opaque by default; the
  dimming rule only applies once the world reports `data-koi-ready`. The page
  renders as ordinary readable HTML with every link intact.
- **Autoplay refused** — the poster frame stays visible underneath.
- **Tab backgrounded** — `visibilitychange` pauses every video and skips the
  render loop entirely.

## Loading policy

The hero clip is the only one created on mount. No next clip is requested until
the visitor has actually moved and local progress passes 0.42. The next clip
warms as metadata first, then upgrades to full preload after 0.56; transition
clips follow the same policy at 0.50 and just before departure. Once a clip has
been reached, its paused element remains available for reverse scrolling; this
prevents a second network transfer without warming beyond one destination
ahead.

The water canvas is bounded to 2.2 MP desktop / 0.9 MP mobile. It renders at up
to roughly 45 / 30 fps while motion is active, then rests at 20 / 15 fps during
a calm reading hold. CSS variables are published only when their rounded value
changes, avoiding repeated style writes for visually identical frames.
