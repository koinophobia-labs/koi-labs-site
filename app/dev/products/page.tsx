import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import DevShell from "@/components/dev/DevShell";
import {
  products,
  reachLabel,
  stageFamily,
  stageFamilyLabel,
  stageLabel,
  studio,
  universeLastUpdated,
} from "@/lib/dev/universe";

// Served as koinophobia.dev/products via a host rewrite in next.config.ts.
// The studio's own /products page is a different page on a different domain.

export const metadata: Metadata = {
  title: { absolute: "Products — Blake Taylor" },
  description:
    "Five products built from problems I lived first: Career Forge, Trendi, You Know Ball, the Labs Concierge, and Koi Cave. Honest status on each one.",
  alternates: { canonical: "https://koinophobia.dev/products" },
  openGraph: {
    type: "website",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/products",
    title: "Products — Blake Taylor",
    description:
      "Career Forge, Trendi, You Know Ball, the Labs Concierge, Koi Cave. What each one is for, where it actually stands, and what it taught me.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
};

export default function DevProductsPage() {
  return (
    <DevShell current="/products">
      <section className="devprod-index__head">
        <p className="devpage__kicker">The universe · {products.length} products</p>
        <h1>Everything here started as a problem I had.</h1>
        <p className="devpage__lede">
          These aren&apos;t a portfolio. Each one exists because I hit the same wall twice and got
          tired of it — a job search with no feedback loop, an idea that died before the record
          button, an argument nobody kept score of, a front door I refused to fake, a tool I
          didn&apos;t want to rent.
        </p>
        <p className="devpage__lede">
          Every page below opens with the same question: who can use this today without asking me
          for anything? That answer is a fact. Everything after it is a story.
        </p>
        <p className="devsec__stamp">Status verified {universeLastUpdated}</p>
      </section>

      <section className="devprod-index__list" aria-label="Products">
        {products.map((product) => (
          <Link
            key={product.slug}
            className="devprod-card"
            href={`/products/${product.slug}`}
            data-world={product.identity.theme}
          >
            <div>
              <h2>{product.name}</h2>
              <p className="devprod-card__tagline">{product.tagline}</p>
              <p className="devprod-card__status">{product.status}</p>
              <span className="devprod-card__stage">
                {`${stageFamilyLabel[stageFamily[product.stage]]} · ${stageLabel[product.stage]}`}
              </span>
            </div>
            <span className="devpage__reach" data-reach={product.reach}>
              {reachLabel[product.reach]}
            </span>
          </Link>
        ))}
      </section>

      <section className="devprod-index__studio" aria-labelledby="devprod-studio">
        <h2 id="devprod-studio">{studio.name}</h2>
        <p>{studio.body}</p>
        <a
          className="devpage__btn devpage__btn--ghost"
          href={studio.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit the studio <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </section>
    </DevShell>
  );
}
