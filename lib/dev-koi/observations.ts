import { experiments, publishedNotes } from "@/lib/dev/lab";
import { nowActiveWork, nowLastUpdated } from "@/lib/now";
import {
  getProduct,
  products,
  reachLabel,
  stageLabel,
  studio,
  type Product,
} from "@/lib/dev/universe";

/**
 * What the koi is allowed to notice.
 *
 * THE ONE RULE: every message is computed from the existing truth sources —
 * lib/dev/universe.ts, lib/now.ts, lib/dev/lab.ts. Nothing here restates a
 * status in its own words. If a product's stage changes, the koi's line changes
 * with it, because the line was never a separate copy of the fact.
 *
 * The studio's companion learned this the hard way and documented the failure
 * mode as "a shadow website that goes stale". A companion that describes the
 * site from memory is a second source of truth, and second sources drift.
 *
 * Corollary: when there is nothing verified to say, the koi says nothing.
 * Silence is a valid state and is used deliberately.
 */

export type KoiTrigger = "arrive" | "dwell" | "scroll-rest";

export type KoiAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type KoiObservation = {
  id: string;
  /** Exact public paths, or a prefix ending in "*". */
  routes: string[];
  trigger: KoiTrigger;
  /** One or two sentences. Concise on purpose. */
  message: string;
  action?: KoiAction;
  /** Higher wins when several are eligible. */
  priority: number;
  /** Minimum ms before this one may be shown again on this device. */
  cooldownMs: number;
  /**
   * "same"   — reduced motion changes nothing about this observation.
   * "static" — still offered, but the koi does not animate toward it.
   */
  reducedMotion: "same" | "static";
  /** Suppresses the observation when the underlying data can't support it. */
  eligible: () => boolean;
};

const MINUTE = 60_000;

const always = () => true;

/* ------------------------------------------------------------------ derived */

const openToAnyone = () => products.filter((p) => p.reach === "public");
const notInAnyonesHands = () => products.filter((p) => p.reach === "internal");

/** The most honest single line about a product's state, straight from the data. */
const stateLine = (product: Product) =>
  `${product.name}: ${stageLabel[product.stage].toLowerCase()}. ${reachLabel[product.reach]}.`;

/* ------------------------------------------------------------ observations */

const homeObservations: KoiObservation[] = [
  {
    id: "home-reach-split",
    routes: ["/"],
    trigger: "dwell",
    message: `Four builds here. ${openToAnyone().length} you can open right now; ${
      notInAnyonesHands().length
    } runs only on Blake's machine. The pages say which is which.`,
    action: { label: "See the products", href: "/products" },
    priority: 60,
    cooldownMs: 30 * MINUTE,
    reducedMotion: "same",
    eligible: () => products.length > 0,
  },
  {
    id: "home-two-sites",
    routes: ["/"],
    trigger: "scroll-rest",
    message: `There are two Koinophobia sites. This one is the workshop. ${studio.name} is where the client work lives, and it has its own front door.`,
    action: { label: "The studio", href: studio.href, external: true },
    priority: 40,
    cooldownMs: 45 * MINUTE,
    reducedMotion: "same",
    eligible: always,
  },
  {
    id: "home-unfinished",
    routes: ["/"],
    trigger: "dwell",
    message: "If you'd rather see something unfinished than something polished, the lab is where the half-built machines are.",
    action: { label: "The lab", href: "/lab" },
    priority: 35,
    cooldownMs: 45 * MINUTE,
    reducedMotion: "same",
    eligible: () => experiments.length > 0,
  },
];

const productsIndexObservations: KoiObservation[] = [
  {
    id: "products-stage-vs-reach",
    routes: ["/products"],
    trigger: "dwell",
    message:
      "Two labels, two questions. Stage is how far through release something got. Reach is who can use it today. They disagree more often than you'd think.",
    priority: 60,
    cooldownMs: 30 * MINUTE,
    reducedMotion: "same",
    eligible: always,
  },
  {
    id: "products-usable-now",
    routes: ["/products"],
    trigger: "scroll-rest",
    message: (() => {
      const open = openToAnyone();
      return open.length
        ? `If you only want the thing you can actually use: ${open.map((p) => p.name).join(" and ")}.`
        : "";
    })(),
    action: openToAnyone()[0]
      ? { label: `Open ${openToAnyone()[0].name}`, href: `/products/${openToAnyone()[0].slug}` }
      : undefined,
    priority: 55,
    cooldownMs: 30 * MINUTE,
    reducedMotion: "same",
    eligible: () => openToAnyone().length > 0,
  },
];

/** Per-product observations, generated so a new product cannot be forgotten. */
const productObservations: KoiObservation[] = products.flatMap((product) => {
  const route = `/products/${product.slug}`;
  const items: KoiObservation[] = [
    {
      id: `product-${product.slug}-state`,
      routes: [route],
      trigger: "arrive",
      message: stateLine(product),
      priority: 70,
      cooldownMs: 20 * MINUTE,
      reducedMotion: "same",
      eligible: () => Boolean(getProduct(product.slug)),
    },
  ];

  // The honesty block is the most interesting thing on these pages, and the
  // easiest to scroll past.
  if (product.notYet.length > 0) {
    items.push({
      id: `product-${product.slug}-notyet`,
      routes: [route],
      trigger: "scroll-rest",
      message: `The part most sites leave out is near the bottom: ${product.notYet.length} things about ${product.name} that aren't true yet.`,
      priority: 50,
      cooldownMs: 30 * MINUTE,
      reducedMotion: "same",
      eligible: () => (getProduct(product.slug)?.notYet.length ?? 0) > 0,
    });
  }

  if (product.evidence.length > 0) {
    items.push({
      id: `product-${product.slug}-evidence`,
      routes: [route],
      trigger: "dwell",
      message: `That status was checked on ${product.verifiedAt}, against ${product.evidence.length} sources you can open yourself.`,
      priority: 30,
      cooldownMs: 45 * MINUTE,
      reducedMotion: "same",
      eligible: () => (getProduct(product.slug)?.evidence.length ?? 0) > 0,
    });
  }

  return items;
});

const nowObservations: KoiObservation[] = [
  {
    id: "now-active-count",
    routes: ["/now"],
    trigger: "arrive",
    message: `${nowActiveWork.length} things are moving right now. Last checked ${nowLastUpdated}.`,
    priority: 60,
    cooldownMs: 20 * MINUTE,
    reducedMotion: "same",
    eligible: () => nowActiveWork.length > 0,
  },
  {
    id: "now-unproven",
    routes: ["/now"],
    trigger: "scroll-rest",
    message:
      "The interesting column is what's still unproven. Shipping and being used are different states, and this page keeps them apart.",
    priority: 40,
    cooldownMs: 45 * MINUTE,
    reducedMotion: "same",
    eligible: always,
  },
];

const labObservations: KoiObservation[] = [
  {
    id: "lab-count",
    routes: ["/lab"],
    trigger: "arrive",
    message: `${experiments.length} experiments here. Each one ran, and each one changed Blake's mind about something.`,
    priority: 60,
    cooldownMs: 25 * MINUTE,
    reducedMotion: "same",
    eligible: () => experiments.length > 0,
  },
  {
    id: "lab-negative-result",
    routes: ["/lab"],
    trigger: "dwell",
    message:
      "A few of these are negative results — the finding was that the thing didn't work, or that a number couldn't be sourced. Those stayed up.",
    priority: 40,
    cooldownMs: 45 * MINUTE,
    reducedMotion: "same",
    eligible: () => experiments.some((e) => /couldn't|could not|overcorrect|wrong/i.test(e.finding)),
  },
];

const aboutObservations: KoiObservation[] = [
  // Deliberately one, low priority, long cooldown. The about page is prose and
  // should be allowed to talk without a fish interrupting.
  {
    id: "about-one-path",
    routes: ["/about"],
    trigger: "scroll-rest",
    message: "When you're done reading, the work itself is one click away.",
    action: { label: "The products", href: "/products" },
    priority: 20,
    cooldownMs: 60 * MINUTE,
    reducedMotion: "same",
    eligible: always,
  },
];

const connectObservations: KoiObservation[] = [
  {
    id: "connect-routing",
    routes: ["/connect"],
    trigger: "dwell",
    message:
      "Depends what you came for. Trying something, testing a beta, and hiring the studio all go different places — the studio has its own intake, so this page doesn't duplicate it.",
    action: { label: "Hire the studio", href: studio.href, external: true },
    priority: 50,
    cooldownMs: 45 * MINUTE,
    reducedMotion: "same",
    eligible: always,
  },
];

const notesObservations: KoiObservation[] = [
  {
    id: "notes-held",
    routes: ["/notes"],
    trigger: "arrive",
    message:
      "Nothing published here yet. The notes exist, but they carry Blake's name and he hasn't read them closely enough to stand behind them in public.",
    priority: 60,
    cooldownMs: 30 * MINUTE,
    reducedMotion: "same",
    // Only speaks to the empty state. If notes are ever published, it goes quiet.
    eligible: () => publishedNotes.length === 0,
  },
];

export const observations: KoiObservation[] = [
  ...homeObservations,
  ...productsIndexObservations,
  ...productObservations,
  ...nowObservations,
  ...labObservations,
  ...aboutObservations,
  ...connectObservations,
  ...notesObservations,
].filter((o) => o.message.trim().length > 0);

/* ---------------------------------------------------------------- selection */

/**
 * Public route for a given pathname.
 *
 * koinophobia.dev serves /products, /lab, /about etc. via host rewrites onto
 * /dev/*. usePathname() reports the PUBLIC path in production but the /dev path
 * when the app tree is hit directly (local dev, direct preview URLs). Observation
 * routes are written as public paths, so normalize once here rather than
 * doubling every pattern.
 */
export const normalizeRoute = (pathname: string) =>
  pathname.replace(/^\/dev(?=\/|$)/, "") || "/";

const routeMatches = (pattern: string, pathname: string) =>
  pattern.endsWith("*") ? pathname.startsWith(pattern.slice(0, -1)) : pattern === pathname;

/**
 * The best thing to say here, or null.
 *
 * `seen` are ids already shown on this device within cooldown. Returning null is
 * the common case and the correct one — the koi is quiet far more than it talks.
 */
export function selectObservation(
  pathname: string,
  trigger: KoiTrigger,
  seen: Set<string>
): KoiObservation | null {
  const route = normalizeRoute(pathname);
  const eligible = observations
    .filter((o) => o.trigger === trigger)
    .filter((o) => o.routes.some((r) => routeMatches(r, route)))
    .filter((o) => !seen.has(o.id))
    .filter((o) => {
      try {
        return o.eligible();
      } catch {
        // A broken predicate must silence the observation, never surface it.
        return false;
      }
    });

  if (eligible.length === 0) return null;
  return eligible.sort((a, b) => b.priority - a.priority)[0];
}

/** Per-product accent world, so the koi belongs to the page it's resting on. */
export function worldForRoute(pathname: string): string | undefined {
  // On koinophobia.dev the public path is /products/<slug>. Locally (and on any
  // preview that hits the app tree directly) the same page is /dev/products/…,
  // because the host rewrite only happens for the real hostname. Accept both, so
  // the koi's temperament isn't silently wrong everywhere except production.
  const match = normalizeRoute(pathname).match(/^\/products\/([a-z-]+)$/);
  if (!match) return undefined;
  return getProduct(match[1])?.identity.theme;
}

/**
 * Movement temperament per world. Same creature, different mood — not four
 * mascots. Values are multipliers applied to the shared motion constants.
 */
export const worldTemperament: Record<string, { drift: number; period: number }> = {
  forge: { drift: 0.7, period: 1.0 }, // orderly, structured
  signal: { drift: 1.15, period: 0.85 }, // smoother, more conversational
  arena: { drift: 1.3, period: 0.65 }, // quicker, competitive
  studio: { drift: 0.6, period: 0.9 }, // composed, at the front desk
  cave: { drift: 0.45, period: 1.6 }, // quietest, long rests
};
