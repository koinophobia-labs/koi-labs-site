import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import KoiWorld from "@/components/koi/KoiWorld";
import { DESTINATIONS } from "@/lib/koi/journey";
import { LINKS } from "@/lib/links";
import { products, serviceOffers, studioConfig, workProjects } from "@/lib/commercial";

export const metadata: Metadata = {
  title: "Koinophobia Labs | AI-Native Products and Systems",
  description:
    "A founder-led Chicago studio building AI-native products, websites, automation, and internal systems from first principles. Follow the koi.",
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

const audit = serviceOffers.find((offer) => offer.slug === "audit")!;
const otherServices = serviceOffers.filter((offer) => offer.slug !== "audit");

/**
 * The constellation. Three shipped products plus the internal operator build,
 * labelled exactly as the repository labels it: private, dev-signed, not
 * distributable. No invented availability.
 */
const constellation = [
  ...products.map((product) => ({
    title: product.title,
    audience: product.audience,
    body: product.body,
    status: product.status.replace("Internal Product · ", ""),
    href: product.href,
    cta: product.cta,
    internal: false,
  })),
  {
    title: "Koi Cave",
    audience: "The studio's own operating loop",
    body:
      "A local-first operator system for notes, tasks, memory, and automations. It runs on one machine and stays there.",
    status: "Private build · not distributable",
    href: "/dev/products/koi-cave",
    cta: "Read the Koi Cave record",
    internal: true,
  },
];

const founderFacts = [
  "Blake scopes the problem, designs the solution, builds the system, runs the checks, and leads the handoff.",
  "High-volume customer operations at DraftKings; B.A. in Global Management, Earlham College.",
  "Client work and owned products share one toolchain — the products are where new techniques get proven first.",
];

const bandStyle = (index: number) => {
  const destination = DESTINATIONS[index];
  return {
    "--band-desktop": `${destination.band.desktop * 100}svh`,
    "--band-mobile": `${destination.band.mobile * 100}svh`,
  } as React.CSSProperties;
};

export default function Home() {
  return (
    <div className="kw" data-koi-destination="enter">
      <a className="kw__skip" href="#enter-copy">
        Skip the animation and read the page
      </a>

      <KoiWorld />

      <header className="kw__masthead">
        <Link className="kw__brand" href="#enter" aria-label="Koinophobia Labs, home">
          <span className="kw__brand-ring" aria-hidden="true" />
          Koinophobia Labs
        </Link>

        <nav className="kw__nav" aria-label="Primary">
          {DESTINATIONS.map((destination) => (
            <a
              key={destination.id}
              href={`#${destination.id}`}
              aria-label={`${destination.label}: ${destination.hint}`}
            >
              {destination.label}
            </a>
          ))}
        </nav>

        <Link className="kw__masthead-cta" href="/intake">
          Start a project <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <nav className="kw__map" aria-label="Journey">
        {DESTINATIONS.map((destination) => (
          <a
            key={destination.id}
            href={`#${destination.id}`}
            aria-label={`${destination.marker} ${destination.label}: ${destination.hint}`}
          >
            <span className="kw__map-label">{destination.label}</span>
            <span className="kw__map-dot" aria-hidden="true" />
          </a>
        ))}
      </nav>

      <main className="kw__main">
        {/* ---------------------------------------------------- 00 Enter */}
        <section
          className="dest dest--enter"
          id="enter"
          style={bandStyle(0)}
          aria-labelledby="enter-title"
        >
          <div className="dest__stage">
            <div className="dest__inner" id="enter-copy">
              <div>
                <p className="kw__marker">
                  <b>00</b> Enter the black water
                </p>
                <p className="kw__kicker">AI-native product studio · Chicago</p>
                <h1 id="enter-title">Build what ordinary thinking would never reach.</h1>
                <p className="kw__lede">
                  Koinophobia Labs builds AI-native products, websites, automation,
                  prototypes, and internal systems — founder-led from first scope to
                  launch. One builder, working software, no agency theater.
                </p>
                <div className="kw__actions">
                  <Link className="kw__btn kw__btn--primary" href="/intake">
                    Start a project <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <a className="kw__btn kw__btn--ghost" href="#products">
                    Follow the koi <ArrowDown size={16} aria-hidden="true" />
                  </a>
                </div>
              </div>

              <dl className="kw__panel kw__proof-strip">
                <div>
                  <dt>Built for</dt>
                  <dd>
                    Owners and operators who need a working system, not a deck.
                  </dd>
                </div>
                <div>
                  <dt>Lowest-risk start</dt>
                  <dd>
                    Revenue Leak Audit — {studioConfig.auditPrice} flat,{" "}
                    {studioConfig.auditTimeline}.
                  </dd>
                </div>
                <div>
                  <dt>How it works</dt>
                  <dd>
                    Scope and price are approved in writing before development begins.
                  </dd>
                </div>
              </dl>
            </div>
            <a className="kw__cue" href="#products">
              Follow the koi <ArrowDown size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* ------------------------------------------------- 01 Products */}
        <section
          className="dest dest--products"
          id="products"
          style={bandStyle(1)}
          aria-labelledby="products-title"
        >
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>01</b> The product constellation
              </p>
              <h2 id="products-title">
                Products the studio owns, ships, and answers for.
              </h2>
              <p>
                Each one started as a problem worth solving properly. Status is
                reported as it actually stands — nothing here is described as
                further along than it is.
              </p>

              <div className="kw__constellation">
                {constellation.map((node, index) => {
                  const external = /^https?:\/\//.test(node.href);
                  const className = `kw__node${node.internal ? " kw__node--internal" : ""}`;
                  const content = (
                    <>
                      <span className="kw__node-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3>{node.title}</h3>
                      <p>{node.body}</p>
                      <span className="kw__node-meta">
                        <span>{node.status}</span>
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </span>
                    </>
                  );
                  return external ? (
                    <a
                      key={node.title}
                      className={className}
                      href={node.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${node.cta} — for ${node.audience}`}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link
                      key={node.title}
                      className={className}
                      href={node.href}
                      aria-label={`${node.cta} — for ${node.audience}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>

              <div className="kw__actions">
                <Link className="kw__btn kw__btn--ghost" href="/products">
                  Every product, with honest status{" "}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- 02 Systems */}
        <section
          className="dest dest--systems"
          id="systems"
          style={bandStyle(2)}
          aria-labelledby="systems-title"
        >
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>02</b> Systems and services
              </p>
              <h2 id="systems-title">
                Find where the revenue leaks. Then build the system that stops it.
              </h2>
              <p>
                The visible experience is the surface. Koinophobia Labs builds the
                intake, routing, automation, and operating logic underneath it.
              </p>

              <div className="kw__systems-grid">
                <div className="kw__audit">
                  <p className="kw__kicker">Start here</p>
                  <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                    {audit.title}
                  </h3>
                  <div className="kw__audit-head">
                    <span className="kw__price">{audit.price}</span>
                    <span className="kw__price-note">
                      {audit.priceLabel} · {audit.timeline}
                    </span>
                  </div>
                  <p>{audit.forWhom}</p>
                  <ul className="kw__includes">
                    {audit.includes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: "1.1rem", fontSize: "0.9rem" }}>
                    <strong style={{ color: "#dbe8ef" }}>You receive:</strong>{" "}
                    {audit.deliverable}
                  </p>
                  <div className="kw__actions" style={{ marginTop: "1.3rem" }}>
                    <Link className="kw__btn kw__btn--primary" href={audit.href}>
                      {audit.cta} <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div className="kw__service-list">
                  {otherServices.map((offer, index) => (
                    <Link className="kw__service" href={offer.href} key={offer.slug}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{offer.title}</strong>
                      <b>{offer.price}</b>
                      <small>{offer.forWhom}</small>
                    </Link>
                  ))}
                  <Link className="kw__service" href="/services">
                    <span>—</span>
                    <strong>All services, scope and timelines</strong>
                    <b>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </b>
                    <small>
                      Pricing, what each engagement includes, and what is decided
                      before development starts.
                    </small>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- 03 Work */}
        <section
          className="dest dest--work"
          id="work"
          style={bandStyle(3)}
          aria-labelledby="work-title"
        >
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>03</b> Work and proof
              </p>
              <h2 id="work-title">Proof leaves a wake.</h2>
              <p>
                Published concept builds, labelled honestly. These are studio-built
                demonstrations of positioning, structure, and intake — not client
                case studies, and they carry no invented results.
              </p>

              <div className="kw__work-grid">
                {workProjects.map((project) => (
                  <Link
                    className="kw__proof"
                    href={project.previewUrl ?? `/work/${project.slug}`}
                    key={project.slug}
                  >
                    <span className="kw__tag">{project.statusLabel}</span>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                    <span className="kw__proof-open">
                      {project.businessType}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>

              <div className="kw__actions">
                <Link className="kw__btn kw__btn--ghost" href="/work">
                  Open the work archive <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- 04 Founder */}
        <section
          className="dest dest--founder"
          id="founder"
          style={bandStyle(4)}
          aria-labelledby="founder-title"
        >
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>04</b> The founder
              </p>
              <div className="kw__panel kw__founder">
                <div className="kw__portrait">
                  <Image
                    src="/blake-portrait.jpg"
                    alt="Blake Taylor, founder of Koinophobia Labs"
                    fill
                    sizes="(max-width: 860px) 170px, 260px"
                  />
                </div>
                <div>
                  <p className="kw__kicker">Blake Taylor · founder</p>
                  <h2 id="founder-title">You work with the builder.</h2>
                  <p>
                    One studio, one builder, no agency maze. The person making the
                    promise is the person responsible for the result — from the first
                    diagnosis through to the deployed system and its handoff.
                  </p>
                  <ul className="kw__founder-facts">
                    {founderFacts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                  <Link className="kw__text-link" href="/about">
                    Meet the founder <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- 05 Start */}
        <section
          className="dest dest--start"
          id="start"
          style={bandStyle(5)}
          aria-labelledby="start-title"
        >
          <div className="dest__stage">
            <div className="dest__inner">
              <p className="kw__marker">
                <b>05</b> Start a project
              </p>
              <h2 id="start-title">Bring the problem. We will build the system.</h2>
              <p>
                Start with a focused audit, describe the workflow, or send the project
                directly. Every path ends with a written scope before any development
                begins.
              </p>

              <div className="kw__paths">
                <Link className="kw__path" href="/audit">
                  <strong>Revenue Leak Audit</strong>
                  <small>
                    {studioConfig.auditPrice} flat · {studioConfig.auditTimeline} ·
                    prioritised PDF and walkthrough
                  </small>
                </Link>
                <Link className="kw__path" href="/intake">
                  <strong>Start a project</strong>
                  <small>
                    Websites, landing pages, AI workflows, prototypes, and custom
                    software.
                  </small>
                </Link>
                <Link className="kw__path" href="/concierge?entry=home">
                  <strong>Not sure what you need</strong>
                  <small>
                    Describe the friction in plain language and get a preliminary,
                    rules-grounded recommendation.
                  </small>
                </Link>
                <a className="kw__path" href={LINKS.email}>
                  <strong>Email the studio</strong>
                  <small>koinophobia999@gmail.com — Chicago, working remotely.</small>
                </a>
              </div>

              <div className="kw__actions" style={{ justifyContent: "center" }}>
                <Link className="kw__btn kw__btn--primary" href="/intake">
                  Start a project <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a className="kw__btn kw__btn--ghost" href="#enter">
                  Return to the beginning
                </a>
              </div>

              <footer className="kw__footer">
                <span>Koinophobia Labs · Chicago</span>
                <nav aria-label="Footer">
                  <Link href="/services">Services</Link>
                  <Link href="/products">Products</Link>
                  <Link href="/work">Work</Link>
                  <Link href="/about">About</Link>
                  <Link href="/process">Process</Link>
                </nav>
                <span>Fear ordinary.</span>
              </footer>
            </div>
          </div>
        </section>
      </main>

      <div className="kw__depth" aria-hidden="true">
        <span />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </div>
  );
}
