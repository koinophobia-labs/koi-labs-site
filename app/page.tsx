import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import ScrollKoiExperience from "@/components/studio/ScrollKoiExperience";
import {
  products,
  serviceOffers,
  workProjects,
} from "@/lib/commercial";

export const metadata: Metadata = {
  title: "Koinophobia Labs | AI-Native Products and Systems",
  description:
    "A founder-led Chicago studio building AI-native products, websites, and business systems from first principles.",
  alternates: { canonical: "https://koinophobialabs.com/" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Koinophobia Labs",
  url: "https://koinophobialabs.com",
  image: "https://koinophobialabs.com/koi-mark.png",
  email: "koinophobia999@gmail.com",
  founder: { "@type": "Person", name: "Blake Taylor" },
  areaServed: ["Chicago", "United States"],
  description:
    "A founder-led studio building AI-native products, websites, and business systems.",
};

const chapters = [
  ["01", "Products", "#products"],
  ["02", "Systems", "#systems"],
  ["03", "Work", "#work"],
  ["04", "Founder", "#founder"],
  ["05", "Start", "#start"],
] as const;

type DestinationLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
  ariaLabel?: string;
};

function DestinationLink({
  href,
  className,
  children,
  ariaLabel,
}: DestinationLinkProps) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export default function Home() {
  return (
    <div className="studio-site studio-site--koi koi-world">
      <ScrollKoiExperience />

      <header className="koi-world__header">
        <Link className="koi-world__brand" href="/" aria-label="Koinophobia Labs home">
          <span className="koi-world__brand-ring" aria-hidden="true" />
          <span>Koinophobia Labs</span>
        </Link>
        <Link className="koi-world__header-cta" href="/intake">
          Start a project <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <nav className="koi-world__rail" aria-label="Homepage chapters">
        {chapters.map(([number, label, href]) => (
          <a href={href} key={href}>
            <span>{number}</span>
            <b>{label}</b>
          </a>
        ))}
      </nav>

      <main>
        <section
          className="koi-scene koi-scene--hero"
          id="enter"
          data-koi-frame="2.65"
          data-koi-scene="hero"
          aria-labelledby="koi-hero-title"
        >
          <div className="koi-world__wordmark" aria-hidden="true">
            <span>Koinophobia</span>
            <span>Labs</span>
          </div>

          <div className="koi-scene__hero-copy">
            <p className="koi-kicker">AI-native product studio · Chicago</p>
            <h1 id="koi-hero-title">
              Build what ordinary thinking would never reach.
            </h1>
            <p>
              Products, digital experiences, and intelligent systems built from
              first principles. The koi is not decoration. It is the path through
              the lab.
            </p>
            <div className="koi-actions">
              <a href="#products">
                Enter the lab <ArrowDown size={16} aria-hidden="true" />
              </a>
              <Link href="/concierge?entry=home">
                Bring us a problem <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <a className="koi-scroll-cue" href="#products">
            <span>Follow the koi</span>
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </section>

        <section
          className="koi-scene koi-scene--products"
          id="products"
          data-koi-frame="3.65"
          data-koi-scene="products"
          data-koi-duo="true"
          aria-labelledby="koi-products-title"
        >
          <div className="koi-scene__center-label">
            <p className="koi-kicker">Inside the lab</p>
            <h2 id="koi-products-title">Three products orbiting one studio.</h2>
          </div>

          <div className="koi-product-orbit">
            {products.map((product, index) => (
              <DestinationLink
                className={`koi-product-node koi-product-node--${index + 1}`}
                href={product.href}
                key={product.title}
                ariaLabel={`${product.cta}: ${product.title}`}
              >
                <span className="koi-product-node__number">0{index + 1}</span>
                <strong>{product.title}</strong>
                <small>{product.audience}</small>
                <span className="koi-product-node__status">
                  {product.status.replace("Internal Product · ", "")}
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </DestinationLink>
            ))}
          </div>

          <Link className="koi-scene__edge-link" href="/products">
            Product universe <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>

        <section
          className="koi-scene koi-scene--systems"
          id="systems"
          data-koi-frame="5.85"
          data-koi-scene="systems"
          aria-labelledby="koi-systems-title"
        >
          <div className="koi-scene__side-copy">
            <p className="koi-kicker">Systems around the product</p>
            <h2 id="koi-systems-title">The visible experience is only the surface.</h2>
            <p>
              Koinophobia Labs also builds the intake, routing, automation, and
              operating logic underneath it.
            </p>
          </div>

          <div className="koi-service-current" aria-label="Koinophobia Labs services">
            {serviceOffers.slice(0, 4).map((offer, index) => (
              <Link href={offer.href} key={offer.slug}>
                <span>0{index + 1}</span>
                <strong>{offer.title}</strong>
                <small>{offer.price}</small>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section
          className="koi-scene koi-scene--work"
          id="work"
          data-koi-frame="7.65"
          data-koi-scene="work"
          aria-labelledby="koi-work-title"
        >
          <div className="koi-scene__work-heading">
            <p className="koi-kicker">Built in public · labeled honestly</p>
            <h2 id="koi-work-title">Proof leaves a wake.</h2>
          </div>

          <div className="koi-work-wake">
            {workProjects.slice(0, 3).map((project, index) => (
              <Link
                href={project.previewUrl ?? `/work/${project.slug}`}
                key={project.slug}
              >
                <span>0{index + 1}</span>
                <div>
                  <strong>{project.title}</strong>
                  <small>{project.businessType}</small>
                </div>
                <b>{project.statusLabel}</b>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>

          <Link className="koi-scene__edge-link" href="/work">
            Enter the work archive <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>

        <section
          className="koi-scene koi-scene--founder"
          id="founder"
          data-koi-frame="9.55"
          data-koi-scene="founder"
          aria-labelledby="koi-founder-title"
        >
          <div className="koi-founder-note">
            <div className="koi-founder-note__portrait">
              <Image
                src="/blake-portrait.jpg"
                alt="Blake Taylor, founder of Koinophobia Labs"
                fill
                sizes="120px"
              />
            </div>
            <div>
              <p className="koi-kicker">Founder-led by design</p>
              <h2 id="koi-founder-title">One studio. One builder. No agency maze.</h2>
              <p>
                Blake Taylor scopes, designs, builds, tests, and ships the work.
                The person making the promise is the person responsible for the
                result.
              </p>
              <Link href="/about">
                Meet the founder <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          className="koi-scene koi-scene--start"
          id="start"
          data-koi-frame="11.65"
          data-koi-scene="start"
          aria-labelledby="koi-start-title"
        >
          <div className="koi-portal">
            <p className="koi-kicker">The next orbit starts here</p>
            <h2 id="koi-start-title">Bring the problem. We will build the system.</h2>
            <p>
              Start with a focused audit, use the concierge to find the right
              path, or send the project directly.
            </p>
            <div className="koi-actions koi-actions--center">
              <Link href="/audit">Start with an audit</Link>
              <Link href="/intake">
                Start a project <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <footer className="koi-world__footer">
            <span>Koinophobia Labs · Chicago</span>
            <nav aria-label="Footer navigation">
              <Link href="/services">Services</Link>
              <Link href="/products">Products</Link>
              <Link href="/work">Work</Link>
              <Link href="/about">About</Link>
            </nav>
            <span>Fear ordinary.</span>
          </footer>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </div>
  );
}
