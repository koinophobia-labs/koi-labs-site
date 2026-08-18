# Koi cinematic — shot and asset manifest

Every clip is the same koi: matte near-black Japanese carp, gunmetal diamond
scales with pearl specular edges, compact rounded head, short blunt snout,
side-set almond eyes, continuous dorsal fin, broad translucent pectoral fins,
symmetrical fan tail. No whiskers, no barbels, no colour patches.

That identity is locked by construction rather than by prompt discipline alone:
every generated segment is image-to-video from a frame taken out of an existing
master, with the master itself supplied as a video reference.

## Identity anchors

| Anchor | Higgsfield id | Role |
| --- | --- | --- |
| Opening keyframe | `6f65706a-c295-4ddd-a548-439a8b2ddb62` | Start frame of the original master |
| Closing keyframe | `77e29dd3-25a8-40ea-b0aa-9fc6b889eb31` | End frame of the original master |
| Navigation master | `b913b47f-e070-484f-8d98-5e126b863b86` | Video reference for every single-koi segment |
| Duo master | `2d172854-0db0-47f5-8c04-4db2a4fe418e` | Video reference for the two-koi segment |

Continuity frames extracted for this build, uploaded as Higgsfield media and
used as start frames:

| Media id | Source | Timecode | Feeds |
| --- | --- | --- | --- |
| `10cab902-d6ea-4fd1-8c78-c3cace15fc87` | navigation master | 15.00s (last) | Segment 03, Segment 06 |
| `b1dada64-f89a-4798-8b51-360c368097fb` | navigation master | 9.50s | Segment 04 |
| `762bc03c-eb4e-4811-b00d-cfd71386ce9f` | navigation master | 12.40s | Segment 05 |
| `66c316b1-dcc6-46db-aba3-db13d72b602c` | duo master | 10.00s (last) | Segment 02B |

## Segments

| # | Clip id | Source | Dur | Enters | Exits | Camera | Purpose |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | `koi-lead` | existing master | 15.0s | in frame, upper right | circles and holds | elevated 3/4, slow drift | Hero and the navigation koi |
| 01T | `koi-glass` | existing master | 8.0s | mid distance | past the lens, frame empties | push toward camera | The through-the-glass transition out of the hero |
| 02 | `koi-duo` | existing master | 10.0s | two koi mid-orbit | orbit continues | elevated 3/4 | Product constellation — the only two-koi moment |
| 02B | `koi-separate` | generated `e4d33722` | 6.0s | two koi | one descends out of lower right; one koi remains | 10° counter-clockwise drift | Returns the journey to a single navigation koi |
| 03 | `koi-systems` | generated `269a9bd6` | 8.0s | lower right | lower left, tail last | lateral truck left, 6° tilt down | Descent past submerged structure into the systems region |
| 04 | `koi-work` | generated `6f312ad7` | 8.0s | centre left | right edge, tail last | locked off, 4% push | Lateral drift past suspended planes of light |
| 05 | `koi-still` | generated `1563ee58` | 8.0s | in frame | never leaves — loops | 15° orbit, slight push | The calm pocket; a hold shot built to loop |
| 06 | `koi-open` | generated `719b8650` | 8.0s | lower right | recedes to centre against a widening glow | low angle push in | The final illuminated destination |

Every generated prompt specified, explicitly: character reference, entry
direction, exit direction, camera position and movement, koi distance and body
orientation, lighting direction, water depth, particle density, environmental
elements, opening composition, closing composition, intended website section,
transition requirement, and loop/hold requirement.

Every prompt also carried a standing prohibition on text, letters, numbers,
captions, watermarks, logos, glyphs, signage, panels, buttons, icons and any
readable typography, plus the anatomical exclusions (no whiskers, barbels,
tendrils, flattened catfish head, scaleless skin, colour patches, species
drift). Segment 02B additionally forbids a third fish, a partial fish, and any
fish-shaped shadow or reflection.

The closing composition of each segment was written to match the opening
composition of the next, and each ends with a held half second of water-only
motion so the frame can be frozen, looped or blended.

## Shipping state

`koi-lead`, `koi-glass` and `koi-duo` ship from the finished masters. All five
generated segments now ship from their completed Higgsfield renders:

| Slot | Higgsfield generation | Duration |
| --- | --- | --- |
| `koi-separate` | `e4d33722-258a-41b9-ac07-aab0edccc2ac` | 6.0s |
| `koi-systems` | `269a9bd6-4f4c-4c0b-ae20-395b45bf3e75` | 8.0s |
| `koi-work` | `6f312ad7-baa0-4849-aaea-dddceeb9aab1` | 8.0s |
| `koi-still` | `1563ee58-8f7e-43ba-a50d-8ef60129fb7c` | 8.0s |
| `koi-open` | `719b8650-6678-418e-a436-ede53a63831a` | 8.0s |

The generated masters were denoised, graded to the same true-black floor as
the finished masters, encoded into both responsive H.264 renditions and paired
with matching WebP poster frames. The original interim beats have been fully
replaced; no code or configuration change was required.

## Delivery renditions

| Rendition | Size | Used when |
| --- | --- | --- |
| `<clip>-1280.mp4` | 1280×720 | viewport wider than 860 CSS px |
| `<clip>-854.mp4` | 854×480 | 860 CSS px and below |
| `poster-<clip>.webp` | 1280 wide | poster frame, reduced-motion still, Save-Data still |

Total shipped media: **9.14 MB across 25 files**, none of it loaded up front.

### Why H.264 only

VP9 re-encodes of this footage measured the same size or larger at equal
quality — near-black frames with fine specular detail compress unusually well
in H.264, and VP9 spends its bit budget on the noise floor. Measured, not
assumed: VP9 CRF 40 on the 15s master produced 1.00 MB against 0.98 MB for the
shipping H.264 CRF 27 encode, and the VP9 file was visibly worse. A second
rendition would have cost payload and decode compatibility for nothing.

### Grade

`hqdn3d` denoise, then a curve that crushes everything below 0.05 luma to true
black and lifts the koi's midtones, then a slight desaturation. Crushing the
floor is what makes screen-blend compositing work: it removes the compression
noise that would otherwise show as haze over the shader water, and it makes the
clip's own rectangle invisible.
