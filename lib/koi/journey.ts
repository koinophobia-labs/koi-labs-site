/**
 * The koi journey — the single source of truth for the scroll-state map.
 *
 * The homepage is six destinations. Each destination owns a tall scroll band
 * with a sticky reading stage inside it, so local progress `t` runs 0 -> 1 as
 * the band passes the viewport:
 *
 *   t 0.00 .. ARRIVE_END   the koi decelerates in, copy settles
 *   t ARRIVE_END .. DEPART_START   HOLD. Copy is static and readable.
 *   t DEPART_START .. 1.00 the koi accelerates out, copy recedes
 *
 * Nothing here hijacks scrolling. Everything is a pure function of scroll
 * position, so reverse scrolling, keyboard paging, deep links, refresh at any
 * offset and browser back/forward all behave identically.
 */

export const ARRIVE_END = 0.25;
export const DEPART_START = 0.7;

export type KoiClip = {
  /** Basename under /koi/ — `${id}-1280.mp4|webm` and `${id}-854.mp4|webm`. */
  id: string;
  /** Poster/reduced-motion still under /koi/. */
  poster: string;
  /** Seconds. Used for loop-fade timing. */
  duration: number;
  /** Human description for the asset manifest and alt text. */
  description: string;
};

export const CLIPS = {
  lead: {
    id: "koi-lead",
    poster: "/koi/poster-lead.webp",
    duration: 15.04,
    description:
      "Single koi circling in black water, elevated three-quarter view — the navigation master.",
  },
  glass: {
    id: "koi-glass",
    poster: "/koi/poster-glass.webp",
    duration: 8.04,
    description:
      "The koi approaches the lens and passes through frame — the through-the-glass transition.",
  },
  duo: {
    id: "koi-duo",
    poster: "/koi/poster-duo.webp",
    duration: 10.04,
    description: "Two koi orbiting one another — the product constellation.",
  },
  separate: {
    id: "koi-separate",
    poster: "/koi/poster-separate.webp",
    duration: 6,
    description:
      "The orbit opens, the second koi descends into the dark, one navigation koi remains.",
  },
  systems: {
    id: "koi-systems",
    poster: "/koi/poster-systems.webp",
    duration: 8,
    description:
      "The koi descends past submerged structure into the systems region.",
  },
  work: {
    id: "koi-work",
    poster: "/koi/poster-work.webp",
    duration: 8,
    description:
      "Lateral drift past suspended planes of light — the proof corridor.",
  },
  still: {
    id: "koi-still",
    poster: "/koi/poster-still.webp",
    duration: 8,
    description: "The koi holds station in a calm pocket under a single shaft of light.",
  },
  open: {
    id: "koi-open",
    poster: "/koi/poster-open.webp",
    duration: 8,
    description:
      "The koi swims away from camera toward a widening glow — the final destination.",
  },
} as const satisfies Record<string, KoiClip>;

export type ClipKey = keyof typeof CLIPS;

/** Where the koi sits on screen, in viewport units, at a given moment. */
export type KoiPose = {
  /** -1 = left edge, 0 = centre, 1 = right edge. */
  x: number;
  /** -1 = top, 0 = centre, 1 = bottom. */
  y: number;
  /** 1 = the clip fills the viewport height. Larger = closer to camera. */
  scale: number;
  /** Degrees. Small values only — the koi's own motion does the real turning. */
  rotate: number;
  /** 0 = far background plane, 1 = foreground, passing in front of the copy. */
  depth: number;
  /** Layer opacity before loop and transition fades. */
  opacity: number;
  /** Pixels of blur. Depth cue. */
  blur: number;
};

export type Destination = {
  id: string;
  index: number;
  /** Nav label. */
  label: string;
  /** Two-digit marker shown in the world. */
  marker: string;
  /** Short description used for the aria-label on nav links. */
  hint: string;
  clip: ClipKey;
  /** Clip that plays across the departure into the next destination, if any. */
  transitionClip?: ClipKey;
  /** Scroll band height as a multiple of the viewport, desktop / mobile. */
  band: { desktop: number; mobile: number };
  /** Koi pose at arrival, during the hold, and at departure. */
  pose: { arrive: KoiPose; hold: KoiPose; depart: KoiPose };
  /** Mobile pose overrides — keeps the koi clear of the copy on narrow screens. */
  poseMobile?: Partial<{ arrive: KoiPose; hold: KoiPose; depart: KoiPose }>;
  /** Environment mood for the water shader. */
  water: {
    /** Light direction in normalised screen space. */
    lightX: number;
    lightY: number;
    /** 0 = pitch void, 1 = lifted, structured depth. */
    depth: number;
    /** Suspended particle density multiplier. */
    particles: number;
    /** Caustic band strength. */
    caustics: number;
    /** Cool -> warm tint, -1 .. 1. */
    warmth: number;
  };
};

const pose = (
  x: number,
  y: number,
  scale: number,
  rotate: number,
  depth: number,
  opacity: number,
  blur: number,
): KoiPose => ({ x, y, scale, rotate, depth, opacity, blur });

export const DESTINATIONS: Destination[] = [
  {
    id: "enter",
    index: 0,
    label: "Enter",
    marker: "00",
    hint: "What Koinophobia Labs is and what it builds",
    clip: "lead",
    transitionClip: "glass",
    band: { desktop: 2.4, mobile: 1.45 },
    pose: {
      arrive: pose(0.24, -0.1, 1.3, -2, 0.32, 0.94, 1.8),
      hold: pose(0.16, -0.04, 1.18, 0, 0.28, 1, 0.4),
      depart: pose(-0.04, 0.12, 1.8, 5, 0.78, 1, 0),
    },
    poseMobile: {
      arrive: pose(0.16, -0.5, 0.98, -2, 0.28, 0.9, 1.8),
      hold: pose(0.18, -0.44, 0.9, 0, 0.24, 1, 0.5),
      depart: pose(0.04, -0.2, 1.5, 4, 0.66, 1, 0),
    },
    water: { lightX: -0.42, lightY: -0.7, depth: 0.42, particles: 0.7, caustics: 0.55, warmth: -0.15 },
  },
  {
    id: "products",
    index: 1,
    label: "Products",
    marker: "01",
    hint: "Career Forge, Trendi, You Know Ball and the internal builds",
    clip: "duo",
    transitionClip: "separate",
    band: { desktop: 2.75, mobile: 1.25 },
    pose: {
      arrive: pose(0.4, -0.4, 0.9, 0, 0.12, 0.62, 2.5),
      hold: pose(0.9, -0.58, 0.68, 0, 0.01, 0.3, 2.8),
      depart: pose(0.5, -0.35, 0.9, -4, 0.16, 0.64, 2),
    },
    poseMobile: {
      arrive: pose(0.26, -0.48, 0.74, 0, 0.08, 0.48, 2.8),
      hold: pose(0.44, -0.62, 0.56, 0, 0.01, 0.22, 3.4),
      depart: pose(0.22, -0.44, 0.78, 0, 0.12, 0.52, 2.4),
    },
    water: { lightX: 0.1, lightY: -0.55, depth: 0.6, particles: 1, caustics: 0.75, warmth: -0.05 },
  },
  {
    id: "systems",
    index: 2,
    label: "Systems",
    marker: "02",
    hint: "Revenue Leak Audit, websites, AI workflows and automation",
    clip: "systems",
    band: { desktop: 3, mobile: 1.25 },
    pose: {
      arrive: pose(0.48, -0.42, 0.9, 3, 0.12, 0.6, 2.6),
      hold: pose(0.9, -0.58, 0.68, 0, 0.01, 0.3, 2.8),
      depart: pose(0.54, -0.3, 1, -6, 0.18, 0.65, 2),
    },
    poseMobile: {
      arrive: pose(0.26, -0.48, 0.74, 2, 0.08, 0.46, 2.8),
      hold: pose(0.44, -0.62, 0.56, 0, 0.01, 0.22, 3.4),
      depart: pose(0.22, -0.44, 0.8, -4, 0.12, 0.5, 2.4),
    },
    water: { lightX: -0.6, lightY: -0.35, depth: 0.78, particles: 0.85, caustics: 0.5, warmth: -0.3 },
  },
  {
    id: "work",
    index: 3,
    label: "Work",
    marker: "03",
    hint: "Concept builds and published product proof",
    clip: "work",
    band: { desktop: 2.8, mobile: 1.25 },
    pose: {
      arrive: pose(0.5, -0.44, 0.9, -3, 0.12, 0.6, 2.6),
      hold: pose(0.98, -0.62, 0.68, 0, 0.01, 0.28, 2.9),
      depart: pose(0.54, -0.32, 0.96, 5, 0.18, 0.64, 2),
    },
    poseMobile: {
      arrive: pose(0.26, -0.48, 0.74, -2, 0.08, 0.46, 2.8),
      hold: pose(0.44, -0.62, 0.56, 0, 0.01, 0.2, 3.4),
      depart: pose(0.22, -0.44, 0.8, 4, 0.12, 0.5, 2.4),
    },
    water: { lightX: 0.55, lightY: -0.5, depth: 0.66, particles: 0.9, caustics: 0.62, warmth: -0.1 },
  },
  {
    id: "founder",
    index: 4,
    label: "Founder",
    marker: "04",
    hint: "Founder-led execution, from strategy into working software",
    clip: "still",
    band: { desktop: 2.45, mobile: 1.3 },
    pose: {
      arrive: pose(0.56, -0.48, 0.86, 2, 0.1, 0.54, 2.8),
      hold: pose(0.9, -0.62, 0.66, 0, 0.01, 0.28, 3),
      depart: pose(0.52, -0.38, 0.9, -4, 0.14, 0.6, 2.2),
    },
    poseMobile: {
      arrive: pose(0.26, -0.48, 0.72, 1, 0.08, 0.44, 2.8),
      hold: pose(0.44, -0.62, 0.54, 0, 0.01, 0.2, 3.4),
      depart: pose(0.22, -0.44, 0.76, -3, 0.1, 0.48, 2.5),
    },
    water: { lightX: 0, lightY: -0.85, depth: 0.34, particles: 0.5, caustics: 0.3, warmth: 0.22 },
  },
  {
    id: "start",
    index: 5,
    label: "Start",
    marker: "05",
    hint: "Start a project, book an audit, or contact the studio",
    clip: "open",
    band: { desktop: 2.6, mobile: 1.35 },
    pose: {
      arrive: pose(0.52, -0.48, 0.9, 0, 0.1, 0.58, 2.6),
      hold: pose(0.9, -0.62, 0.68, 0, 0.01, 0.3, 2.9),
      depart: pose(0.6, -0.56, 0.8, 0, 0.08, 0.58, 2.2),
    },
    poseMobile: {
      arrive: pose(0.26, -0.48, 0.74, 0, 0.08, 0.46, 2.8),
      hold: pose(0.44, -0.62, 0.56, 0, 0.01, 0.22, 3.4),
      depart: pose(0.24, -0.5, 0.7, 0, 0.06, 0.48, 2.5),
    },
    water: { lightX: 0, lightY: -0.2, depth: 0.95, particles: 1.1, caustics: 0.85, warmth: 0.1 },
  },
];

export const DESTINATION_IDS = DESTINATIONS.map((d) => d.id);

/** Every clip the journey can reach, in first-needed order. */
export const CLIP_ORDER: ClipKey[] = (() => {
  const seen = new Set<ClipKey>();
  const order: ClipKey[] = [];
  for (const destination of DESTINATIONS) {
    for (const key of [destination.clip, destination.transitionClip]) {
      if (key && !seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    }
  }
  return order;
})();
