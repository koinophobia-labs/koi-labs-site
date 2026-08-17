import type { Metadata } from "next";
import KoiAnchorRendition from "@/components/studio/KoiAnchorRendition";

export const metadata: Metadata = {
  title: {
    absolute: "Koi Anchor Orbit · Koinophobia Labs",
  },
  description:
    "A Koinophobia Labs homepage rendition where interface copy orbits the koi and holds at readable anchor points.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function KoiAnchorOrbitPage() {
  return <KoiAnchorRendition mode="orbit" />;
}
