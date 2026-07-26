import type { Metadata } from "next";
import DevShell from "@/components/dev/DevShell";
import { logKindLabel, logLastUpdated, logProductLabel, orderedLogEntries } from "@/lib/dev/log";

// Served as koinophobia.dev/log via a host rewrite in next.config.ts.
// The chronological record: releases, defects, decisions, milestones, lessons.

export const metadata: Metadata = {
  title: { absolute: "Build log — Blake Taylor" },
  description:
    "The running record of building Career Forge, Trendi, You Know Ball, the concierge, and Koi Cave: releases, defects, reversals, and the decisions in between.",
  alternates: { canonical: "https://koinophobia.dev/log" },
  openGraph: {
    type: "website",
    siteName: "koinophobia.dev",
    url: "https://koinophobia.dev/log",
    title: "Build log — Blake Taylor",
    description:
      "What actually happened, newest first. Every entry is something that happened, not something promised.",
    images: [{ url: "https://koinophobia.dev/og-founder.png", width: 1200, height: 630 }],
  },
};

const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export default function DevLogPage() {
  return (
    <DevShell current="/log" narrow>
      <section className="devsec__head">
        <p className="devpage__kicker">Build log · updated {logLastUpdated}</p>
        <h1>What actually happened.</h1>
        <p className="devpage__lede">
          The running record of building all of this — releases, defects, reversals, and the
          decisions in between. Newest first. Every entry is something that happened, not
          something I&apos;m promising, and the specific claims carry their sources.
        </p>
        <p className="devlog__backfill">
          Entries before July 26, 2026 were backfilled that day from release records — delivery
          logs, merged pull requests, health endpoints. From July 26 on, the log is written as
          the work happens. Wrong entries get corrected by newer entries, never deleted.
        </p>
      </section>

      <ol className="devlog__list">
        {orderedLogEntries.map((entry) => (
          <li key={entry.slug} id={entry.slug}>
            <article className="devlog__entry" data-kind={entry.kind}>
              <div className="devlog__meta">
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                <span className="devlog__chip devlog__chip--kind">{logKindLabel[entry.kind]}</span>
                <span className="devlog__chip">{logProductLabel(entry)}</span>
              </div>
              <h2>{entry.title}</h2>
              <dl className="devlog__record">
                <div>
                  <dt>What changed</dt>
                  <dd>{entry.what}</dd>
                </div>
                <div>
                  <dt>Why it mattered</dt>
                  <dd>{entry.why}</dd>
                </div>
                <div>
                  <dt>What I decided next</dt>
                  <dd>{entry.next}</dd>
                </div>
              </dl>
              {entry.evidence?.length ? (
                <details className="devlog__evidence">
                  <summary>
                    {entry.evidence.length === 1 ? "1 source" : `${entry.evidence.length} sources`}
                  </summary>
                  <dl>
                    {entry.evidence.map((item) => (
                      <div key={item.claim}>
                        <dt>{item.claim}</dt>
                        <dd>{item.source}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
    </DevShell>
  );
}
