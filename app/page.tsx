import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import KoiNavigationMotion from "@/components/studio/KoiNavigationMotion";
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

const primaryNavigation = [
  ["Home", "#enter", "hero", "Studio overview"],
  ["Products", "#products", "products", "Career Forge, Trendi, You Know Ball"],
  ["Services", "#systems", "systems", "Websites, AI workflows, automation"],
  ["Work", "#work", "work", "Published concept builds"],
  ["About", "#founder", "founder", "Founder-led studio"],
  ["Contact", "#start", "start", "Choose a starting point"],
] as const;

type DestinationLinkProps = {
  href: string;
  className: string;
  children: ReactNode;
  ariaLabel?: string;
  follow?: boolean;
};

type SectionMarkerProps = {
  number: string;
  label: string;
  description: string;
};

function DestinationLink({
  href,
  className,
  children,
  ariaLabel,
  follow = false,
}: DestinationLinkProps) {
  const followProps = follow ? { "data-koi-follow": "true" } : {};

  if (/^https?:\/\//.test(href)) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
        {...followProps}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      className={className}
      href={href}
      aria-label={ariaLabel}
      {...followProps}
    >
      {children}
    </Link>
  );
}

function SectionMarker({ number, label, description }: SectionMarkerProps) {
  return (
    <div className="koi-section-marker" data-koi-follow>
      <span>{number}</span>
      <strong>{label}</strong>
      <small>{description}</small>
    </div>
  );
}

export default function Home() {
  return (
    <div className="studio-site studio-site--koi koi-world koi-world--finished">
      <ScrollKoiExperience />
      <KoiNavigationMotion />

      <header className="koi-world__header">
        <Link
          className="koi-world__brand"
          href="#enter"
          aria-label="Koinophobia Labs home"
        >
          <span className="koi-world__brand-ring" aria-hidden="true" />
          <span>Koinophobia Labs</span>
        </Link>

        <nav className="koi-world__primary-nav" aria-label="Primary navigation">
          {primaryNavigation.map(([label, href, scene, description]) => (
            <a
              href={href}
              data-koi-nav={scene}
              aria-current={scene === "hero" ? "true" : undefined}
              aria-label={`${label}: ${description}`}
              key={scene}
            >
              {label}
            </a>
          ))}
        </nav>

        <Link className="koi-world__header-cta" href="/intake">
          Start a project <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <main>
        <section
          className="koi-scene koi-scene--hero"
          id="enter"
          data-koi-frame="2.0"
          data-koi-scene="hero"
          data-koi-follow-scene="hero"
          data-koi-side="left"
          data-koi-y="0.03"
          aria-labelledby="koi-hero-title"
        >
          <div className="koi-follow-stage">
            <div className="koi-follow-wake" aria-hidden="true" />
            <div className="koi-world__wordmark" aria-hidden="true">
              <span>Koinophobia</span>
              <span>Labs</span>
            </div>

            <div className="koi-follow-cluster koi-follow-cluster--hero">
              <div className="koi-scene__hero-copy">
                <SectionMarker
                  number="00"
                  label="Home"
                  description="Studio overview"
                />
                <p className="koi-kicker" data-koi-follow>
                  AI-native product studio · Chicago
                </p>
                <h1 id="koi-hero-title" data-koi-follow>
                  Build what ordinary thinking would never reach.
                </h1>
                <p data-koi-follow>
                  Products, digital experiences, and intelligent systems built
                  from first principles. The koi moves first. The lab follows.
                </p>
                <div className="koi-actions" data-koi-follow>
                  <a href="#products">
                    Follow the koi <ArrowDown size={16} aria-hidden="true" />
                  </a>
                  <Link href="/concierge?entry=home">
                    Bring us a problem{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>

            <a className="koi-scroll-cue" href="#products">
              <span>Information follows the koi</span>
              <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section
          className="koi-scene koi-scene--products"
          id="products"
          data-koi-frame="4.8"
          data-koi-scene="products"
          data-koi-follow-scene="products"
          data-koi-side="left"
          data-koi-y="-0.02"
          data-koi-duo="true"
          aria-labelledby="koi-products-title"
        >
          <div className="koi-follow-stage">
            <div className="koi-follow-wake" aria-hidden="true" />
            <div className="koi-follow-cluster">
              <SectionMarker
                number="01"
                label="Products"
                description="Career Forge, Trendi, You Know Ball"
              />
              <div className="koi-scene__center-label">
                <p className="koi-kicker" data-koi-follow>
                  Inside the lab
                </p>
                <h2 id="koi-products-title" data-koi-follow>
                  Three products moving inside one current.
                </h2>
              </div>

              <div className="koi-product-orbit">
                {products.map((product, index) => (
                  <DestinationLink
                    className={`koi-product-node koi-product-node--${index + 1}`}
                    href={product.href}
                    key={product.title}
                    ariaLabel={`${product.cta}: ${product.title}`}
                    follow
                  >
                    <span className="koi-product-node__number">
                      0{index + 1}
                    </span>
                    <strong>{product.title}</strong>
                    <small>{product.audience}</small>
                    <span className="koi-product-node__status">
                      {product.status.replace("Internal Product · ", "")}
                    </span>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </DestinationLink>
                ))}
              </div>

              <Link
                className="koi-scene__edge-link"
                href="/products"
                data-koi-follow
              >
                Product universe{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          className="koi-scene koi-scene--systems"
          id="systems"
          data-koi-frame="7.1"
          data-koi-scene="systems"
          data-koi-follow-scene="systems"
          data-koi-side="right"
          data-koi-y="-0.02"
          aria-labelledby="koi-systems-title"
        >
          <div className="koi-follow-stage">
            <div className="koi-follow-wake" aria-hidden="true" />
            <div className="koi-follow-cluster">
              <SectionMarker
                number="02"
                label="Services"
                description="Websites, AI workflows, automation"
              />
              <div className="koi-scene__side-copy">
                <p className="koi-kicker" data-koi-follow>
                  Systems around the product
                </p>
                <h2 id="koi-systems-title" data-koi-follow>
                  The visible experience is only the surface.
                </h2>
                <p data-koi-follow>
                  Koinophobia Labs builds the intake, routing, automation, and
                  operating logic underneath the interface.
                </p>
              </div>

              <div
                className="koi-service-current"
                aria-label="Koinophobia Labs services"
              >
                {serviceOffers.slice(0, 4).map((offer, index) => (
                  <Link href={offer.href} key={offer.slug} data-koi-follow>
                    <span>0{index + 1}</span>
                    <strong>{offer.title}</strong>
                    <small>{offer.price}</small>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="koi-scene koi-scene--work"
          id="work"
          data-koi-frame="9.35"
          data-koi-scene="work"
          data-koi-follow-scene="work"
          data-koi-side="left"
          data-koi-y="0.02"
          aria-labelledby="koi-work-title"
        >
          <div className="koi-follow-stage">
            <div className="koi-follow-wake" aria-hidden="true" />
            <div className="koi-follow-cluster">
              <SectionMarker
                number="03"
                label="Work"
                description="Concept builds and product proof"
              />
              <div className="koi-scene__work-heading">
                <p className="koi-kicker" data-koi-follow>
                  Built in public · labeled honestly
                </p>
                <h2 id="koi-work-title" data-koi-follow>
                  Proof leaves a wake.
                </h2>
              </div>

              <div className="koi-work-wake">
                {workProjects.slice(0, 3).map((project, index) => (
                  <Link
                    href={project.previewUrl ?? `/work/${project.slug}`}
                    key={project.slug}
                    data-koi-follow
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

              <Link
                className="koi-scene__edge-link"
                href="/work"
                data-koi-follow
              >
                Enter the work archive{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          className="koi-scene koi-scene--founder"
          id="founder"
          data-koi-frame="11.7"
          data-koi-scene="founder"
          data-koi-follow-scene="founder"
          data-koi-side="right"
          data-koi-y="0.02"
          aria-labelledby="koi-founder-title"
        >
          <div className="koi-follow-stage">
            <div className="koi-follow-wake" aria-hidden="true" />
            <div className="koi-follow-cluster">
              <SectionMarker
                number="04"
                label="About"
                description="Founder-led studio"
              />
              <div className="koi-founder-note">
                <div
                  className="koi-founder-note__portrait"
                  data-koi-follow
                >
                  <Image
                    src="/blake-portrait.jpg"
                    alt="Blake Taylor, founder of Koinophobia Labs"
                    fill
                    sizes="120px"
                  />
                </div>
                <div>
                  <p className="koi-kicker" data-koi-follow>
                    Founder-led by design
                  </p>
                  <h2 id="koi-founder-title" data-koi-follow>
                    One studio. One builder. No agency maze.
                  </h2>
                  <p data-koi-follow>
                    Blake Taylor scopes, designs, builds, tests, and ships the
                    work. The person making the promise is responsible for the
                    result.
                  </p>
                  <Link href="/about" data-koi-follow>
                    Meet the founder{" "}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="koi-scene koi-scene--start"
          id="start"
          data-koi-frame="14.15"
          data-koi-scene="start"
          data-koi-follow-scene="start"
          data-koi-side="right"
          data-koi-y="0.12"
          aria-labelledby="koi-start-title"
        >
          <div className="koi-follow-stage">
            <div className="koi-follow-wake" aria-hidden="true" />
            <div className="koi-follow-cluster koi-follow-cluster--start">
              <SectionMarker
                number="05"
                label="Contact"
                description="Choose a starting point"
              />
              <div className="koi-portal">
                <p className="koi-kicker" data-koi-follow>
                  The next orbit starts here
                </p>
                <h2 id="koi-start-title" data-koi-follow>
                  Bring the problem. We will build the system.
                </h2>
                <p data-koi-follow>
                  Start with a focused audit, use the concierge to find the
                  right path, or send the project directly.
                </p>
                <div
                  className="koi-actions koi-actions--center"
                  data-koi-follow
                >
                  <Link href="/audit">Start with an audit</Link>
                  <Link href="/intake">
                    Start a project{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
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
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </div>
  );
}
