import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GitBranch, IdCard, Mail, QrCode } from "lucide-react";
import { LINKS } from "@/lib/links";
import { nowLastUpdated, nowSnapshot } from "@/lib/now";
import { publishedNotes } from "@/lib/dev/lab";
import { latestLogEntries, logKindLabel, logLastUpdated, logProductLabel } from "@/lib/dev/log";
import {
  products,
  reachLabel,
  stageFamily,
  stageFamilyLabel,
  universeLastUpdated,
} from "@/lib/dev/universe";
import PersonalKoi from "@/components/dev-koi/PersonalKoi";

// This page is the root of koinophobia.dev (rewritten from "/" for that host in
// next.config.ts). koinophobialabs.com explains the studio; this page explains
// Blake — and works as his founder OS: what's active, what stage everything is
// really at, what just happened, how he builds, and where each kind of visitor
// should go next.

export const metadata: Metadata = {
  title: { absolute: "Blake Taylor" },
  description:
    "Chicago-based founder and product builder. I build systems that turn chaos into leverage — Career Forge, Trendi, You Know Ball, the Labs Concierge, and Koinophobia Labs.",
  alternates: { canonical: "https://koinophobia.dev/" },
  openGraph: {
    type: "website",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/",
    title: "Blake Taylor — I build systems that turn chaos into leverage",
    description:
      "Chicago-based founder and product builder. A living record of what's being built, tested, and shipped — with honest status on everything.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blake Taylor — I build systems that turn chaos into leverage",
    description:
      "Chicago-based founder and product builder. Products built from lived problems, documented honestly.",
    images: ["https://koinophobia.dev/og-founder.png"],
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Blake Taylor",
  url: "https://koinophobia.dev",
  image: "https://koinophobia.dev/blake-portrait.jpg",
  jobTitle: "Founder & Product Builder",
  worksFor: { "@type": "Organization", name: "Koinophobia Labs", url: "https://koinophobialabs.com" },
  address: { "@type": "PostalAddress", addressLocality: "Chicago", addressRegion: "IL" },
  sameAs: [LINKS.linkedin, LINKS.github, "https://koinophobialabs.com"],
};

// Rendered from lib/dev/universe.ts so the home page cannot describe a product
// differently from the product's own page. Origins stay here because they're
// the homepage's job — one line on why the thing exists at all.
const origins: Record<string, string> = {
  "career-forge": "Started from my own layoff.",
  trendi: "Started from watching good ideas die before the record button.",
  "you-know-ball": "Started from a lifetime of sports arguments.",
  concierge: "Started from refusing to give my own studio a fake front door.",
  "koi-cave": "Started from not wanting to rent my own context back.",
};

const systems = products.map((product) => ({
  name: product.name,
  origin: origins[product.slug] ?? "",
  body: product.problem,
  status: product.status,
  reach: product.reach,
  family: stageFamilyLabel[stageFamily[product.stage]],
  href: `/products/${product.slug}`,
  // These go to the product's story page on this site, not to the product
  // itself — "Open" would promise a launch that doesn't happen here.
  cta: `Read the ${product.name} story`,
}));

// The operating cycle, each step carrying a receipt from the record rather
// than a slogan. If a step can't point at something that happened, it doesn't
// belong here.
const loop = [
  {
    step: "01",
    title: "Live the pain",
    receipt:
      "Every product here started as my own problem — a job search with no feedback loop, an idea dead before the record button, an argument nobody kept score of.",
  },
  {
    step: "02",
    title: "Build the system",
    receipt:
      "Deterministic cores before AI polish: a résumé engine that can't hallucinate your history, a debate score a player can reconstruct by hand.",
  },
  {
    step: "03",
    title: "Pressure-test it",
    receipt:
      "I audit my own releases like an adversary. One audit closed Career Forge's checkout the day it found a payment could vanish without a trace.",
  },
  {
    step: "04",
    title: "Watch real use",
    receipt:
      "Two Trendi defects survived weeks of green simulator runs and fell within hours of a genuine install on a real phone. The device decides.",
  },
  {
    step: "05",
    title: "Refine — or refuse",
    receipt:
      "Trendi's better-writing pipeline is switched off on purpose. A better sentence doesn't beat a broken written mode.",
  },
  {
    step: "06",
    title: "Ship again",
    receipt:
      "Builds 120, 121 and 122 went to TestFlight in one evening once the loop was tight. Then the cycle starts over.",
  },
];

export default function DevHomePage() {
  const logStrip = latestLogEntries(3);

  return (
    <div className="devhome">
      <div className="devhome__field" aria-hidden="true" />
      <header className="devhome__topbar">
        <span className="devhome__wordmark">koinophobia.dev</span>
        <nav className="devhome__nav" aria-label="Site">
          <Link href="/products">Products</Link>
          <Link href="/log">Log</Link>
          <Link href="/lab">Lab</Link>
          {/* Notes appears only once something is published there. Linking to
              an empty section promises writing that isn't up yet. */}
          {publishedNotes.length > 0 ? <Link href="/notes">Notes</Link> : null}
          <Link href="/now">Now</Link>
          <Link href="/about">About</Link>
          <Link href="/connect">Connect</Link>
        </nav>
      </header>

      <main>
        <section className="devhome__hero" aria-labelledby="devhome-title">
          <div className="devhome__hero-text">
            <p className="devhome__kicker">Blake Taylor · Chicago, IL</p>
            <h1 id="devhome-title">
              I build systems that turn <span>chaos into leverage.</span>
            </h1>
            <p className="devhome__lede">
              I&apos;m a founder and product builder. I spent three years inside high-volume
              sportsbook operations at DraftKings, where small process failures get expensive fast.
              In 2025 I started building my own products around that lesson, and in 2026 — after my
              role was eliminated — I stopped building around a job and went all in.
            </p>
            <p className="devhome__lede devhome__lede--secondary">
              Everything here started as a real problem in my own life. This is the working record:
              what I&apos;m building, where each thing honestly stands, what broke on the way, and
              what it changed my mind about. The studio sells outcomes. This site shows the
              machinery.
            </p>
            <div className="devhome__hero-actions">
              <Link className="devhome__btn" href="/products">
                See what I&apos;m building
              </Link>
              <Link className="devhome__btn devhome__btn--ghost" href="/log">
                Read the build log
              </Link>
            </div>
          </div>
          <figure className="devhome__portrait">
            <Image
              src="/blake-portrait.jpg"
              alt="Blake Taylor in downtown Chicago"
              width={640}
              height={800}
              priority
            />
            <figcaption>Chicago, IL — founder, Koinophobia Labs</figcaption>
          </figure>
        </section>

        <section className="devhome__now" id="now" aria-labelledby="devhome-now-title">
          <div className="devhome__now-head">
            <h2 id="devhome-now-title">Right now</h2>
            <span className="devhome__now-stamp">status · {nowLastUpdated}</span>
          </div>
          <ul className="devhome__now-list">
            {nowSnapshot.map((entry) => (
              <li key={entry.label}>
                <span className="devhome__now-label">{entry.label}</span>
                <span className="devhome__now-line">{entry.line}</span>
              </li>
            ))}
          </ul>
          <Link className="devhome__now-more" href="/now">
            Read the full update <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </section>

        <section className="devhome__systems" id="systems" aria-labelledby="devhome-systems-title">
          <div className="devhome__section-head">
            <h2 id="devhome-systems-title">The systems</h2>
            <p>
              {/* This Next version drops the space after a line-initial JSX
                  expression at SSR time — join the count explicitly. */}
              {`${systems.length} builds, one operating idea. `}Each one exists because I lived
              the problem first — they&apos;re evidence of how I think, not inventory. Every
              status is the real one, checked against artifacts on {universeLastUpdated},
              including the ones that aren&apos;t in anyone&apos;s hands yet.
            </p>
          </div>
          <div className="devhome__system-list">
            {systems.map((system, index) => (
              <article className="devhome__system" key={system.name}>
                <div className="devhome__system-meta">
                  <span className="devhome__system-index">0{index + 1}</span>
                  <span className="devhome__system-stage">{system.family}</span>
                  <span className="devhome__system-status">{reachLabel[system.reach]}</span>
                </div>
                <div className="devhome__system-body">
                  <h3>{system.name}</h3>
                  <p className="devhome__system-origin">{system.origin}</p>
                  <p>{system.body}</p>
                  <Link className="devhome__system-link" href={system.href} aria-label={system.cta}>
                    {system.cta} <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="devhome__texture">
            The studio is the same idea pointed at other people&apos;s businesses.{" "}
            <a href={LINKS.labs} target="_blank" rel="noopener noreferrer">
              That work lives on its own site
            </a>
            .
          </p>
        </section>

        <section className="devhome__log" aria-labelledby="devhome-log-title">
          <div className="devhome__section-head">
            <h2 id="devhome-log-title">From the build log</h2>
            <p>
              The record itself — releases, defects, reversals, and the decisions in between.
              Updated {logLastUpdated}.
            </p>
          </div>
          <ol className="devhome__log-list">
            {logStrip.map((entry) => (
              <li key={entry.slug}>
                <Link className="devhome__log-entry" href={`/log#${entry.slug}`}>
                  <span className="devhome__log-meta">
                    <time dateTime={entry.date}>{entry.date}</time>
                    <span>{logProductLabel(entry)}</span>
                    <span className="devhome__log-kind">{logKindLabel[entry.kind]}</span>
                  </span>
                  <strong>{entry.title}</strong>
                  <span className="devhome__log-what">{entry.what}</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link className="devhome__now-more" href="/log">
            The whole log <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </section>

        {/* The writing section only exists when there is writing. Every field
            note is currently held for Blake's review, so this collapses to the
            log rather than advertising an empty archive. */}
        {publishedNotes.length > 0 ? (
          <section className="devhome__principles" aria-labelledby="devhome-notes-title">
            <div className="devhome__section-head">
              <h2 id="devhome-notes-title">What I&apos;m learning</h2>
              <p>
                Essays from inside the work — a blocked release, a feature I switched off on
                purpose, a number I chased for months.
              </p>
            </div>
            <div className="devhome__principle-grid">
              {publishedNotes.slice(0, 3).map((note) => (
                <article key={note.slug}>
                  <h3>
                    <Link href={`/notes/${note.slug}`}>{note.title}</Link>
                  </h3>
                  <p>{note.hook}</p>
                </article>
              ))}
            </div>
            <p className="devhome__texture">
              <Link href="/notes">All field notes</Link> · <Link href="/lab">the lab</Link>
            </p>
          </section>
        ) : null}

        <section className="devhome__principles" id="how" aria-labelledby="devhome-how-title">
          <div className="devhome__section-head">
            <h2 id="devhome-how-title">How I build</h2>
            <p>
              The same cycle runs through everything here — the products, the studio&apos;s client
              systems, and the safety work: find where a process quietly costs someone time, money,
              or nerve; replace the repeated decision with a system; then try to break my own
              release before anyone else can.
            </p>
          </div>
          <div className="devhome__principle-grid devhome__loop">
            {loop.map((item) => (
              <article key={item.step}>
                <span className="devhome__loop-num">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.receipt}</p>
              </article>
            ))}
          </div>
          <p className="devhome__texture">
            Off the clock it&apos;s hoops arguments, the gym, and anime — which explains at least one
            of the products above. <Link href="/about">The longer version, and why the site is
            called koinophobia</Link>.
          </p>
        </section>

        <section className="devhome__connect" aria-labelledby="devhome-connect-title">
          <div className="devhome__connect-card">
            <h2 id="devhome-connect-title">Start here</h2>
            <p>
              Six doors, depending on who you are. Every one ends somewhere specific — I read
              everything that comes in.
            </p>
            <div className="devroute">
              <a
                className="devroute__item"
                href={LINKS.labs}
                target="_blank"
                rel="noopener noreferrer"
              >
                <em>Your business leaks time</em>
                <strong>Hire the studio</strong>
                <span>
                  Sites, intake, and AI front-office systems. Start with the audit — or describe
                  the problem to the koi on this page.
                </span>
              </a>
              <Link className="devroute__item" href="/products">
                <em>Curious about the products</em>
                <strong>See the constellation</strong>
                <span>
                  Two are open to anyone right now. Every page says exactly where it stands, with
                  sources.
                </span>
              </Link>
              <a
                className="devroute__item"
                href="https://apps.apple.com/us/app/trendi-content-coach/id6776299336"
              >
                <em>You&apos;d try Trendi</em>
                <strong>Get it on the App Store</strong>
                <span>
                  Trendi: Content Coach is live — free, no account required. Type a messy
                  thought, leave with words to say on camera.
                </span>
              </a>
              <Link className="devroute__item" href="/resume">
                <em>You&apos;re hiring</em>
                <strong>The formal version</strong>
                <span>
                  Résumé and PDF for the conventional artifact — and the log, if you want to see
                  how I actually work.
                </span>
              </Link>
              <a className="devroute__item" href={LINKS.email}>
                <em>You build too</em>
                <strong>Compare notes</strong>
                <span>
                  Collaborations, systems talk, or telling me where I&apos;m wrong. Both welcome.
                </span>
              </a>
              <Link className="devroute__item" href="/log">
                <em>Just following along</em>
                <strong>Read the build log</strong>
                <span>What shipped, what broke, what I decided next. Updated as it happens.</span>
              </Link>
            </div>
            <div className="devhome__connect-actions">
              <a className="devhome__btn" href={LINKS.email}>
                <Mail size={17} aria-hidden="true" /> Email me
              </a>
              <a
                className="devhome__btn devhome__btn--ghost"
                href={LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn (opens in a new tab)"
              >
                <IdCard size={17} aria-hidden="true" /> LinkedIn
              </a>
              <a
                className="devhome__btn devhome__btn--ghost"
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub (opens in a new tab)"
              >
                <GitBranch size={17} aria-hidden="true" /> GitHub
              </a>
              <Link className="devhome__btn devhome__btn--ghost" href="/connect">
                <QrCode size={17} aria-hidden="true" /> The fast card
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="devhome__footer">
        <span>koinophobia.dev — the person</span>
        <a href={LINKS.labs} target="_blank" rel="noopener noreferrer">
          koinophobialabs.com — the studio <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <PersonalKoi />
    </div>
  );
}
