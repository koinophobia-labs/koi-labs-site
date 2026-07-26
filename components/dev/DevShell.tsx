import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LINKS } from "@/lib/links";
import { publishedNotes } from "@/lib/dev/lab";
import PersonalKoi from "@/components/dev-koi/PersonalKoi";

// Shared chrome for every koinophobia.dev route except the home page (which
// owns its own hero-scale topbar). One nav definition means the personal site
// can't grow a route that nothing links to.

// Notes only appears once something is actually published there. Linking to an
// empty section is worse than not having the section — it promises writing that
// isn't there. The route still resolves and explains itself; it just isn't
// advertised while every note is held for review.
export const DEV_NAV = [
  { href: "/products", label: "Products" },
  { href: "/log", label: "Log" },
  { href: "/lab", label: "Lab" },
  ...(publishedNotes.length > 0 ? [{ href: "/notes", label: "Notes" }] : []),
  { href: "/now", label: "Now" },
  { href: "/about", label: "About" },
  { href: "/connect", label: "Connect" },
];

export type DevWorld = "forge" | "signal" | "arena" | "cave" | "studio";

export default function DevShell({
  world,
  current,
  narrow,
  fieldX,
  children,
}: {
  /** Sets the accent theme. Omit for Blake-violet. */
  world?: DevWorld;
  /** Route that should be marked aria-current in the nav. */
  current?: string;
  narrow?: boolean;
  fieldX?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={narrow ? "devpage devpage--narrow" : "devpage"}
      data-world={world}
      style={fieldX ? ({ "--dh-field-x": fieldX } as React.CSSProperties) : undefined}
    >
      <div className="devpage__field" aria-hidden="true" />

      <header className="devpage__topbar">
        <Link className="devpage__wordmark" href="/">
          koinophobia.dev
        </Link>
        <nav className="devpage__nav" aria-label="Site">
          {DEV_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="devpage__footer">
        <span>koinophobia.dev — the person</span>
        <a href={LINKS.labs} target="_blank" rel="noopener noreferrer">
          koinophobialabs.com — the studio <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </footer>

      {/* Personal-site only. The studio companion is mounted in the root
          layout and gated by a hostname allowlist; this one is gated by the
          fact that nothing on koinophobialabs.com imports it. */}
      <PersonalKoi />
    </div>
  );
}
