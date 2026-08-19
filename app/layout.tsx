import type { Metadata, Viewport } from "next";
import {
  Archivo,
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Newsreader,
  Sora,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import BrandIntro from "@/components/brand/BrandIntro";
import "./globals.css";
import "./founder.css";
import "./ecosystem-pages-refresh.css";
import "./home.css";
import "./career-forge-home.css";
import "./you-know-ball-home-fix.css";
import "./trendi-feature.css";
import "./trendi-hero-visual.css";
import "./brand.css";
import "./brand-intro.css";
import "./founder-editorial.css";
import "./product-worlds.css";
import "./commercial.css";
import "./koi-world.css";
import "./dev-system.css";
import "./dev-home.css";
import "./dev-product.css";
import "./dev-pages.css";
import "./dev-log.css";
import "./dev-koi.css";
import "./front-office.css";
import "./connect-card.css";
import "./resume-dev.css";
import "./now-dev.css";
import AnalyticsBridge from "@/components/studio/AnalyticsBridge";
import KoiCompanion from "@/components/companion/KoiCompanion";
import {
  STUDIO_DESCRIPTION,
  STUDIO_SOCIAL_IMAGE,
  STUDIO_TITLE,
  STUDIO_URL,
} from "@/lib/seo";
import "./koi-companion.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(STUDIO_URL),
  title: {
    default: STUDIO_TITLE,
    template: "%s | Koinophobia Labs",
  },
  description: STUDIO_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/koi-emblem.svg", type: "image/svg+xml" }],
    shortcut: ["/brand/koi-emblem.svg"],
    apple: [
      { url: "/brand/apple-icon", type: "image/png", sizes: "256x256" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Koinophobia Labs",
    url: STUDIO_URL,
    title: STUDIO_TITLE,
    description: STUDIO_DESCRIPTION,
    images: [STUDIO_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: STUDIO_TITLE,
    description: STUDIO_DESCRIPTION,
    images: ["/brand/social-card"],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#080511",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${sora.variable} ${inter.variable} ${jetbrains.variable} ${archivo.variable} ${newsreader.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <BrandIntro />
        <AnalyticsBridge />
        <Analytics />
        {children}
        <KoiCompanion />
      </body>
    </html>
  );
}
