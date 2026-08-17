import type { Metadata } from "next";
import KoiAnchorRendition from "@/components/studio/KoiAnchorRendition";

export const metadata: Metadata = {
  title: {
    absolute: "Koi Anchor Wake · Koinophobia Labs",
  },
  description:
    "A Koinophobia Labs homepage rendition where interface copy trails the koi, settles into still frames, and dissolves into its wake.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function KoiAnchorWakePage() {
  return <KoiAnchorRendition mode="wake" />;
}
