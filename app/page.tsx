import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import StudioNav from "@/components/studio/StudioNav";
import StudioFooter from "@/components/studio/StudioFooter";
import ScrollKoiExperience from "@/components/studio/ScrollKoiExperience";
import {
  CTABand,
  FAQItem,
  PricingCard,
  ProcessStep,
  ProductCard,
  ProofItem,
  SectionIntro,
  WorkCard,
} from "@/components/studio";
import {
  businessProblems,
  faqs,
  processSteps,
  products,
  serviceOffers,
  trustItems,
  workProjects,
} from "@/lib/commercial";

export const metadata: Metadata = {
  title: "Koinophobia Labs | Websites, AI Workflows and Business Systems",
  description:
    "Founder-led websites, AI workflows, booking systems, and conversion improvements for small businesses. Start with a practical Revenue Leak Audit.",
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
    "Founder-led websites, AI workflows, booking systems, and conversion improvements for small businesses.",
};

export default function Home() {
  return (
    <div className="studio-site studio-site--koi">
      <ScrollKoiExperience />
      <StudioNav />
      <main>
        <section
          className="studio-hero"
          data-koi-frame="2.65"
          data-koi-scene="hero"
          data-koi-side="left"
        >
          <div className="studio-container studio-hero__grid">
            <div>
              <p className="studio-eyebrow">
                Founder-led systems for small businesses
              </p>
              <h1>
                Websites, AI workflows, and client systems that fix{" "}
                <span>real business friction.</span>
              </h1>
              <p className="studio-hero__lede">
                Koinophobia Labs helps small businesses losing time or revenue
                to outdated websites, messy inquiries, manual follow-up, and
                disconnected tools. You work directly with Blake from diagnosis
                through launch.
              </p>
              <div className="studio-hero__actions">
                <Link
                  className="studio-button"
                  href="/audit"
                  data-analytics="audit_cta_click"
                >
                  Start With an Audit
                </Link>
                <Link
                  className="studio-button studio-button--secondary"
                  href="/concierge?entry=home"
                  data-analytics="concierge_entry_click"
                >
                  Help Me Figure Out What I Need
                </Link>
              </div>
              <div className="studio-hero__tertiary-row">
                <Link
                  className="studio-hero__tertiary"
                  href="/intake"
                  data-analytics="project_inquiry_cta_click"
                >
                  Already know what you need? Start a project →
                </Link>
                <Link
                  className="studio-hero__tertiary"
                  href="/work"
                  data-analytics="client_work_view"
                >
                  View client work →
                </Link>
              </div>
            </div>
            <div
              className="studio-hero__system"
              aria-label="Example business system flow"
            >
              <span className="studio-system-label">
                A practical system, end to end
              </span>
              <div className="studio-system-flow">
                <div className="studio-system-node">
                  <span>01</span>
                  <p>
                    <b>Clear front door</b>Visitors understand the offer and next
                    step.
                  </p>
                </div>
                <div className="studio-system-node">
                  <span>02</span>
                  <p>
                    <b>Structured intake</b>The right details arrive in one place.
                  </p>
                </div>
                <div className="studio-system-node">
                  <span>03</span>
                  <p>
                    <b>Reliable follow-through</b>Routing, reminders, and handoff
                    stop relying on memory.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="studio-trust" aria-label="How the studio works">
          <div className="studio-container studio-trust__grid">
            {trustItems.map((item) => (
              <ProofItem key={item}>{item}</ProofItem>
            ))}
          </div>
        </section>

        <section
          className="studio-section"
          data-koi-frame="4.70"
          data-koi-scene="diagnose"
          data-koi-side="right"
        >
          <div className="studio-container">
            <SectionIntro
              eyebrow="Recognize the friction"
              title="Where businesses usually start losing customers"
              body="The visible symptom may be a weak website. The actual problem is often an unclear customer path or a process that breaks after someone shows interest."
            />
            <div className="studio-problem-grid">
              {businessProblems.map((problem, index) => (
                <article className="studio-problem-card" key={problem.title}>
                  <span>0{index + 1}</span>
                  <h3>{problem.title}</h3>
                  <p>{problem.body}</p>
                  <footer>{problem.service}</footer>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="studio-section studio-section--panel"
          data-analytics-view="client_work_view"
          data-koi-frame="5.55"
          data-koi-scene="work"
          data-koi-side="left"
        >
          <div className="studio-container">
            <SectionIntro
              eyebrow="Client work and business systems"
              title="Work built around real business problems"
              body="Every project below carries a visible status so a concept is never mistaken for a delivered client engagement."
            />
            <p className="studio-disclosure">
              Koinophobia Labs is building its external client portfolio in
              public. The current published business work is concept work;
              internal products appear separately below. No concept is presented
              as completed client work.
            </p>
            <div className="studio-work-grid">
              {workProjects.slice(0, 2).map((project) => (
                <WorkCard project={project} key={project.slug} />
              ))}
            </div>
            <div style={{ marginTop: 30 }}>
              <Link className="studio-text-link" href="/work">
                View all business work <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          className="studio-section"
          id="services"
          data-analytics-view="pricing_section_view"
          data-koi-frame="6.25"
          data-koi-scene="services"
          data-koi-side="right"
        >
          <div className="studio-container">
            <SectionIntro
              eyebrow="Clear offers"
              title="Useful work, with the likely range visible"
              body="No implementation begins until the scope, price, timeline, responsibilities, and revision process are approved."
            />
            <div className="studio-pricing-grid">
              {serviceOffers.slice(0, 4).map((offer) => (
                <PricingCard offer={offer} key={offer.slug} />
              ))}
            </div>
            <div className="studio-guarantee">
              <strong>
                You will know the agreed scope, price, timeline, and revision
                process before development starts.
              </strong>
              <p>
                AI workflows and front-office systems are custom-scoped because
                tool access, routing rules, integrations, and failure paths vary
                by business.
              </p>
            </div>
            <div style={{ marginTop: 30 }}>
              <Link className="studio-text-link" href="/services">
                Compare all services <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          className="studio-section studio-section--panel"
          data-koi-frame="6.90"
          data-koi-scene="process"
          data-koi-side="left"
        >
          <div className="studio-container">
            <SectionIntro
              eyebrow="The delivery process"
              title="Know what happens before the first build day"
              body="A focused six-step process keeps commercial decisions explicit and the work legible."
            />
            <div className="studio-process-grid">
              {processSteps.map((step) => (
                <ProcessStep {...step} key={step.number} />
              ))}
            </div>
            <div style={{ marginTop: 30 }}>
              <Link className="studio-text-link" href="/process">
                Read about revisions, ownership, and support{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          className="studio-section"
          data-koi-frame="7.30"
          data-koi-scene="products"
          data-koi-side="center"
          data-koi-duo="true"
        >
          <div className="studio-container">
            <SectionIntro
              eyebrow="Products built inside the lab"
              title="Technical depth, separated from client proof"
              body="These are Koinophobia Labs products. They demonstrate product strategy, interface design, AI integration, mobile thinking, safety work, and production delivery—not external client outcomes."
            />
            <div className="studio-product-grid">
              {products.map((product) => (
                <ProductCard product={product} key={product.title} />
              ))}
            </div>
          </div>
        </section>

        <section
          className="studio-section studio-section--panel"
          data-koi-frame="9.10"
          data-koi-scene="return"
          data-koi-side="right"
        >
          <div className="studio-container studio-founder-grid">
            <div className="studio-founder-photo">
              <Image
                src="/blake-portrait.jpg"
                alt="Blake Taylor, founder of Koinophobia Labs"
                fill
                sizes="(max-width: 760px) 100vw, 420px"
              />
            </div>
            <div className="studio-founder-copy">
              <p className="studio-eyebrow">Founder-led by design</p>
              <h2>The person scoping the work is the person building it.</h2>
              <p>
                Koinophobia Labs is an intentionally focused solo studio. Clients
                work directly with Blake Taylor across business diagnosis,
                product thinking, design, AI workflows, implementation, testing,
                and launch.
              </p>
              <p>
                The goal is a useful system with clear ownership—not layers of
                agency process or inflated deliverables.
              </p>
              <div className="studio-founder-facts">
                <div>
                  <strong>Direct communication</strong>
                  <span>No account-manager handoff</span>
                </div>
                <div>
                  <strong>Documented decisions</strong>
                  <span>Scope and responsibilities stay visible</span>
                </div>
                <div>
                  <strong>Operator background</strong>
                  <span>Customer operations and trust-heavy environments</span>
                </div>
                <div>
                  <strong>Builder proof</strong>
                  <span>Working internal products and tested releases</span>
                </div>
              </div>
              <Link className="studio-text-link" href="/about">
                Meet Blake and the studio{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          className="studio-section"
          data-koi-frame="10.55"
          data-koi-scene="answers"
          data-koi-side="left"
        >
          <div className="studio-container">
            <SectionIntro eyebrow="Straight answers" title="Before you commit" />
            <div className="studio-faq-list">
              {faqs.slice(0, 7).map((faq) => (
                <FAQItem {...faq} key={faq.question} />
              ))}
            </div>
            <div style={{ marginTop: 30 }}>
              <Link className="studio-text-link" href="/services#faq">
                Read every FAQ <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <div
          className="studio-koi-final-frame"
          data-koi-frame="11.65"
          data-koi-scene="close"
          data-koi-side="right"
        >
          <CTABand />
        </div>
      </main>
      <StudioFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </div>
  );
}
