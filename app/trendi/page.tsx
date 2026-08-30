import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  Mic2,
  Sparkles,
  Video,
} from "lucide-react";
import TrendiCtaLink from "@/components/trendi/TrendiCtaLink";
import TrendiHeroVisual from "@/components/trendi/TrendiHeroVisual";
import TrendiMedia from "@/components/TrendiMedia";

const inquiryHref =
  "mailto:koinophobia999@gmail.com?subject=Trendi%20inquiry&body=Hi%20Blake%2C%0A%0AI%27d%20like%20to%20ask%20about%20Trendi.%0A%0AMy%20question%3A%0A";
const appStoreHref = "https://apps.apple.com/us/app/trendi-content-coach/id6776299336";

export const metadata: Metadata = {
  title: "Trendi | Your Content Coach",
  description:
    "Trendi is a content coach for iPhone. Type the thought and get one angle, three hook options, an editable script, a caption, and a simple shot plan.",
  alternates: { canonical: "https://koinophobialabs.com/trendi" },
  openGraph: {
    title: "Trendi | From messy thought to recordable words",
    description:
      "Say it messy. Trendi shapes the thought into a finishable draft in your voice.",
    url: "https://koinophobialabs.com/trendi",
    siteName: "Koinophobia Labs",
    type: "website",
    images: [
      {
        url: "/trendi/trendi-final-output.jpg",
        width: 886,
        height: 1802,
        alt: "Trendi coach pack with an angle, hooks, and recordable script",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trendi | From messy thought to recordable words",
    description:
      "Say it messy. Trendi shapes the thought into a finishable draft in your voice.",
    images: ["/trendi/trendi-final-output.jpg"],
  },
};

const steps = [
  {
    number: "01",
    icon: Mic2,
    title: "Dump the idea",
    body: "Type it or say it before you overthink it. Fragments, tangents, and half-formed thoughts are welcome.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Shape the thought",
    body: "Trendi finds the point and turns the messy input into clear, creator-specific words.",
  },
  {
    number: "03",
    icon: Video,
    title: "Record or publish",
    body: "Use the finishable draft on camera or carry it into your publishing workflow—not back into the notes graveyard.",
  },
];

const outputs = [
  "A clear point pulled from the raw thought",
  "Creator-specific language that sounds usable",
  "One focused, finishable draft",
  "Words structured to be spoken on camera",
];

const audiences = [
  ["Solo creators", "Turn the voice note you keep replaying into something ready to record."],
  ["Founder-creators", "Explain the thing you are building without sanding off your point of view."],
  ["Independent experts", "Freelancers, coaches, and consultants can start with what they know and make it clear enough to say."],
  ["Small business owners", "Create in your own voice without handing every useful thought to a content team."],
];

export default function TrendiPage() {
  return (
    <main className="trendiPage_world">
      <header className="trendiPage_nav" aria-label="Trendi navigation">
        <Link className="trendiPage_back" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Koinophobia Labs
        </Link>
        <p className="trendiPage_navMark" aria-label="Trendi">
          TRENDI
        </p>
        <a className="trendiPage_navCta" href={inquiryHref}>
          Ask about Trendi <ArrowRight size={15} aria-hidden="true" />
        </a>
      </header>

      <section id="trendi-hero" className="trendiPage_hero" aria-labelledby="trendi-title">
        <div className="trendiPage_heroGlow" aria-hidden="true" />
        <div className="trendiPage_heroCopy">
          <p className="trendiPage_eyebrow">
            Trendi <span>For iPhone</span> Your content coach
          </p>
          <p id="trendi-identity" className="trendiPage_identity" aria-hidden="true">TRENDI</p>
          <h1 id="trendi-title">
            Type the thought. Get words to say on camera.
          </h1>
          <p className="trendiPage_lede">
            Say it messy. Trendi turns a rough idea into hooks, a recordable script, a
            caption, and a simple shot plan—so you can stop circling the thought and
            start recording it.
          </p>
          <div className="trendiPage_actions">
            <TrendiCtaLink id="trendi-hero-cta" className="trendiPage_primary" href={appStoreHref}>
              Download on the App Store <ArrowRight size={17} aria-hidden="true" />
            </TrendiCtaLink>
            <a className="trendiPage_secondary" href="#real-product">
              Watch the real product <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
          <p className="trendiPage_releaseNote">
            Trendi: Content Coach is live on the App Store — free, no account required.
          </p>
        </div>
        <div className="trendiPage_heroSide">
          <TrendiHeroVisual
            variant="full"
            heroId="trendi-hero"
            wordmarkId="trendi-identity"
            ctaId="trendi-hero-cta"
          />
          <aside className="trendiPage_heroNote" aria-label="Product premise">
            <span>THE PREMISE</span>
            <p>Your best ideas should not die between the voice note and the record button.</p>
          </aside>
        </div>
      </section>

      <section id="real-product" className="trendiPage_product" aria-labelledby="real-product-title">
        <div className="trendiPage_sectionLead">
          <p className="trendiPage_sectionIndex">01 / Real product</p>
          <div>
            <h2 id="real-product-title">Start messy. Leave with something sayable.</h2>
            <p>
              This is the working iPhone experience—not a concept render. Press play to
              see the real capture flow.
            </p>
          </div>
        </div>
        <TrendiMedia />
      </section>

      <section className="trendiPage_flow" aria-labelledby="flow-title">
        <div className="trendiPage_sectionLead">
          <p className="trendiPage_sectionIndex">02 / The flow</p>
          <div>
            <h2 id="flow-title">From thought to record button in three moves.</h2>
          </div>
        </div>
        <ol className="trendiPage_steps">
          {steps.map(({ number, icon: Icon, title, body }) => (
            <li key={number}>
              <div className="trendiPage_stepTop">
                <span>{number}</span>
                <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="trendiPage_output" aria-labelledby="output-title">
        <div className="trendiPage_outputCopy">
          <p className="trendiPage_sectionIndex">03 / What comes out</p>
          <h2 id="output-title">Not more content sludge. A draft with your point still in it.</h2>
          <p>
            Trendi is designed around a smaller, more useful promise: help one real thought
            cross the gap into words you can speak.
          </p>
        </div>
        <ul className="trendiPage_outputList">
          {outputs.map((output) => (
            <li key={output}>
              <Check size={18} aria-hidden="true" />
              <span>{output}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="trendiPage_audience" aria-labelledby="audience-title">
        <div className="trendiPage_sectionLead">
          <p className="trendiPage_sectionIndex">04 / Made for</p>
          <div>
            <h2 id="audience-title">People with something real to say—and friction saying it.</h2>
          </div>
        </div>
        <div className="trendiPage_audienceGrid">
          {audiences.map(([title, body], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="trendiPage_proof" aria-labelledby="proof-title">
        <p className="trendiPage_sectionIndex">05 / Product proof</p>
        <div>
          <h2 id="proof-title">Built past the pitch deck.</h2>
          <p>
            Trendi is a working iPhone product. The interface and capture
            shown above come from the product itself.
          </p>
        </div>
        <ul aria-label="Trendi proof points">
          <li><strong>Real</strong><span>product capture</span></li>
          <li><strong>Platform</strong><span>iPhone</span></li>
          <li><strong>Focused</strong><span>one idea at a time</span></li>
        </ul>
      </section>

      <section className="trendiPage_final" aria-labelledby="launch-title">
        <p className="trendiPage_finalMark" aria-hidden="true">TRENDI</p>
        <div className="trendiPage_finalInner">
          <p className="trendiPage_eyebrow">Launching on iPhone</p>
          <h2 id="launch-title">Have a thought worth recording?</h2>
          <p>Tell Blake what you create and where your ideas usually get stuck.</p>
          <a className="trendiPage_primary" href={inquiryHref}>
            Ask about Trendi <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="trendiPage_footer">
        <p>Trendi · A Koinophobia Labs product</p>
        <nav aria-label="Trendi links">
          <Link href="/trendi/privacy">Privacy</Link>
          <Link href="/trendi/support">Support</Link>
          <Link href="/">Koinophobia Labs</Link>
        </nav>
      </footer>
    </main>
  );
}
