import type { MetadataRoute } from "next";
import { workProjects } from "@/lib/commercial";
import { STUDIO_HOME_LAST_MODIFIED, STUDIO_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // /connect and /resume canonicalize to koinophobia.dev, so they are not listed here.
  const routes = [
    { path: "", lastModified: STUDIO_HOME_LAST_MODIFIED },
    { path: "/services", lastModified: "2026-07-18" },
    { path: "/work", lastModified: "2026-08-13" },
    { path: "/products", lastModified: "2026-08-13" },
    { path: "/process", lastModified: "2026-08-13" },
    { path: "/about", lastModified: "2026-07-17" },
    { path: "/audit", lastModified: "2026-07-18" },
    { path: "/concierge", lastModified: "2026-07-21" },
    { path: "/trendi", lastModified: "2026-08-13" },
    { path: "/trendi/privacy", lastModified: "2026-08-13" },
    { path: "/trendi/support", lastModified: "2026-08-13" },
    { path: "/you-know-ball/play", lastModified: "2026-07-17" },
  ];

  return [
    ...routes.map(({ path, lastModified }, index) => ({
      url: `${STUDIO_URL}${path}`,
      lastModified,
      changeFrequency: index === 0 ? ("weekly" as const) : ("monthly" as const),
      priority:
        index === 0
          ? 1
          : path === "/services" || path === "/work" || path === "/audit"
            ? 0.9
            : 0.7,
    })),
    ...workProjects.map((project) => ({
      url: `${STUDIO_URL}/work/${project.slug}`,
      lastModified: "2026-08-13",
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
