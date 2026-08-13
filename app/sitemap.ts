import type { MetadataRoute } from "next";
import { workProjects } from "@/lib/commercial";

const base = "https://koinophobialabs.com";
export default function sitemap(): MetadataRoute.Sitemap {
  // /connect and /resume canonicalize to koinophobia.dev, so they are not listed here.
  const routes = ["", "/services", "/work", "/products", "/process", "/about", "/audit", "/concierge", "/trendi", "/trendi/privacy", "/trendi/support", "/you-know-ball/play"];
  return [...routes.map((route, index) => ({ url: `${base}${route}`, changeFrequency: index === 0 ? "weekly" as const : "monthly" as const, priority: index === 0 ? 1 : route === "/services" || route === "/work" || route === "/audit" ? .9 : .7 })), ...workProjects.map((project) => ({ url: `${base}/work/${project.slug}`, changeFrequency: "monthly" as const, priority: .75 }))];
}
