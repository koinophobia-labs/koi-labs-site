import type { NextConfig } from "next";

const DEV_HOST = "koinophobia.dev";
const LABS_HOST = "koinophobialabs.com";

/**
 * Production-like staging for the personal site. The Vercel domain
 * preview.koinophobia.dev is assigned to a chosen branch, so koinophobia.dev
 * changes can be exercised on a real hostname — host rewrites, host-gated
 * companions, real TLS — without touching production.
 *
 * Deliberately an EXACT host, never a wildcard: it mirrors only the personal
 * rewrites below and the personal koi's allowlist. It can never satisfy the
 * studio companion's allowlist, so nothing can leak onto koinophobialabs.com.
 * Canonicalizing redirects stay production-only on purpose — a tester on the
 * preview host must not be bounced to the live site mid-journey.
 */
const DEV_PREVIEW_HOST = "preview.koinophobia.dev";
const DEV_HOSTS = [DEV_HOST, DEV_PREVIEW_HOST];

/**
 * koinophobia.dev routes that live under /dev/* in the app tree.
 *
 * They need host-scoped rewrites because several of them (/products, /about)
 * collide with real studio pages of the same name. The studio keeps its page on
 * koinophobialabs.com; koinophobia.dev serves Blake's version from /dev/*.
 *
 * Each entry becomes a rewrite (public URL -> /dev source) and a redirect
 * (the /dev URL is never itself public — one canonical address per page).
 */
const DEV_ROUTES = [
  "/products",
  "/products/:slug",
  "/log",
  "/lab",
  "/notes",
  "/notes/:slug",
  "/about",
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // /home is an internal rewrite target; keep one public URL per host.
      {
        source: "/home",
        has: [{ type: "host", value: DEV_HOST }],
        destination: `https://${DEV_HOST}/`,
        permanent: false,
      },
      {
        source: "/home",
        has: [{ type: "host", value: LABS_HOST }],
        destination: `https://${DEV_HOST}/`,
        permanent: false,
      },
      // /dev/* is internal plumbing. On the personal host it collapses to the
      // clean URL; on the studio host it leaves for the personal host entirely.
      // Redirects run before beforeFiles rewrites, so this cannot loop — the
      // rewrite that follows is internal and never re-enters the redirect table.
      ...DEV_ROUTES.map((route) => ({
        source: `/dev${route}`,
        has: [{ type: "host" as const, value: DEV_HOST }],
        destination: `https://${DEV_HOST}${route}`,
        permanent: false,
      })),
      {
        source: "/dev/:path*",
        has: [{ type: "host", value: LABS_HOST }],
        destination: `https://${DEV_HOST}/:path*`,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      // Each personal rewrite exists once per dev host — exact values, so the
      // preview host behaves exactly like koinophobia.dev without a wildcard.
      beforeFiles: DEV_HOSTS.flatMap((host) => [
        // koinophobia.dev is Blake's personal home; koinophobialabs.com keeps
        // the studio homepage at the shared "/" route.
        {
          source: "/",
          has: [{ type: "host" as const, value: host }],
          destination: "/home",
        },
        ...DEV_ROUTES.map((route) => ({
          source: route,
          has: [{ type: "host" as const, value: host }],
          destination: `/dev${route}`,
        })),
        // Crawler files are per-host. app/sitemap.ts and app/robots.ts are the
        // studio's; koinophobia.dev gets its own from dedicated route handlers.
        {
          source: "/sitemap.xml",
          has: [{ type: "host" as const, value: host }],
          destination: "/dev-sitemap.xml",
        },
        {
          source: "/robots.txt",
          has: [{ type: "host" as const, value: host }],
          destination: "/dev-robots.txt",
        },
      ]),
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      // The staging host duplicates the personal site; crawlers must never
      // index it. Production hosts are untouched by this rule.
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: DEV_PREVIEW_HOST }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
