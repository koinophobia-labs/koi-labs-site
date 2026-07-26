import { publishedNotes } from "@/lib/dev/lab";
import { logEntries } from "@/lib/dev/log";
import { products } from "@/lib/dev/universe";

// koinophobia.dev's own sitemap.
//
// One Next app serves two domains, and app/sitemap.ts is hard-coded to the
// studio. Before this route, koinophobia.dev/sitemap.xml advertised
// koinophobialabs.com URLs and the personal pages were effectively unlisted.
//
// This is a plain Route Handler rather than a second sitemap.ts because the
// metadata convention is one-per-app and caches by host-agnostic key; a route
// handler reached through a host rewrite keeps each domain's sitemap static and
// unambiguous. next.config.ts rewrites koinophobia.dev/sitemap.xml here.

const base = "https://koinophobia.dev";

export function GET() {
  const urls = [
    { path: "", priority: "1.0", changefreq: "weekly" },
    { path: "/products", priority: "0.9", changefreq: "monthly" },
    ...products.map((product) => ({
      path: `/products/${product.slug}`,
      priority: "0.8",
      changefreq: "monthly",
    })),
    // The log is only advertised while it actually has entries.
    ...(logEntries.length > 0 ? [{ path: "/log", priority: "0.9", changefreq: "weekly" }] : []),
    { path: "/now", priority: "0.9", changefreq: "weekly" },
    // /notes is only advertised to crawlers once something is published there.
    ...(publishedNotes.length > 0
      ? [
          { path: "/notes", priority: "0.8", changefreq: "weekly" },
          ...publishedNotes.map((note) => ({
            path: `/notes/${note.slug}`,
            priority: "0.7",
            changefreq: "yearly",
          })),
        ]
      : []),
    { path: "/lab", priority: "0.7", changefreq: "monthly" },
    { path: "/about", priority: "0.8", changefreq: "monthly" },
    { path: "/connect", priority: "0.7", changefreq: "monthly" },
    { path: "/resume", priority: "0.7", changefreq: "monthly" },
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) =>
      `  <url><loc>${base}${entry.path}</loc><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
