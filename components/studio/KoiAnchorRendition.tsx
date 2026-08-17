"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import ScrollKoiExperience from "@/components/studio/ScrollKoiExperience";
import { products, serviceOffers, workProjects } from "@/lib/commercial";

export type KoiAnchorMode = "orbit" | "wake";

type KoiAnchorRenditionProps = {
  mode: KoiAnchorMode;
};

type DestinationLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

type AnchorSceneProps = {
  id: string;
  scene: string;
  frame: string;
  angle: number;
  side: "left" | "right" | "center";
  titleId: string;
  duo?: boolean;
  children: ReactNode;
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

const HOLD_START = 0.34;
const HOLD_END = 0.66;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smooth(value: number) {
  const bounded = clamp(value);
  return bounded * bounded * (3 - 2 * bounded);
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

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

function AnchorScene({
  id,
  scene,
  frame,
  angle,
  side,
  titleId,
  duo = false,
  children,
}: AnchorSceneProps) {
  return (
    <section
      className="koi-anchor__scene"
      id={id}
      data-anchor-scene={scene}
      data-anchor-angle={angle}
      data-anchor-side={side}
      data-koi-frame={frame}
      data-koi-scene={scene}
      data-koi-duo={duo ? "true" : undefined}
      aria-labelledby={titleId}
    >
      <div className="koi-anchor__sticky">
        <div className="koi-anchor__center" aria-hidden="true">
          <span />
          <span />
          <b>KOI / ANCHOR</b>
        </div>
        <div className="koi-anchor__arm" aria-hidden="true" />
        <article className="koi-anchor__copy">{children}</article>
      </div>
    </section>
  );
}

function KoiAnchorMotion({ mode }: { mode: KoiAnchorMode }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      `[data-koi-anchor-mode="${mode}"]`,
    );
    if (!root) return;

    const scenes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-anchor-scene]"),
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as NavigatorWithConnection).connection;
    let animationFrame = 0;

    const setHeldState = (scene: HTMLElement, index: number) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const restAngle = Number.parseFloat(scene.dataset.anchorAngle ?? "0");
      const radius =
        viewportWidth <= 760
          ? Math.min(190, viewportWidth * 0.34)
          : clamp(viewportWidth * 0.285, 300, 440);

      scene.style.setProperty("--anchor-progress", "0.5");
      scene.style.setProperty("--anchor-copy-opacity", "1");
      scene.style.setProperty("--anchor-copy-scale", "1");
      scene.style.setProperty("--anchor-angle", `${restAngle}deg`);
      scene.style.setProperty("--anchor-counter-angle", `${-restAngle}deg`);
      scene.style.setProperty("--anchor-radius", `${radius}px`);
      scene.dataset.anchorActive = index === 0 ? "true" : "false";

      const side = scene.dataset.anchorSide ?? "right";
      const direction = side === "left" ? -1 : side === "right" ? 1 : 0;
      const restX =
        direction === 0
          ? 0
          : direction *
            (viewportWidth <= 760
              ? Math.min(120, viewportWidth * 0.18)
              : clamp(viewportWidth * 0.27, 300, 420));
      const restY =
        side === "center"
          ? Math.min(viewportHeight * 0.25, 220)
          : viewportWidth <= 760
            ? Math.min(viewportHeight * 0.2, 150)
            : 0;

      const parts = Array.from(
        scene.querySelectorAll<HTMLElement>("[data-anchor-part]"),
      );
      parts.forEach((part, partIndex) => {
        part.style.opacity = "1";
        part.style.filter = "blur(0px)";
        part.style.transform = `translate3d(${restX}px, ${
          restY + partIndex * 2
        }px, 0) rotate(0deg) scale(1)`;
      });
    };

    const render = () => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const viewportWidth = Math.max(window.innerWidth, 1);
      let activeScene: HTMLElement | null = null;
      let activeDistance = Number.POSITIVE_INFINITY;

      scenes.forEach((scene, index) => {
        const rect = scene.getBoundingClientRect();
        const travel = Math.max(rect.height - viewportHeight, 1);
        const rawProgress = clamp(-rect.top / travel);
        const progress =
          index === 0 ? 0.5 + rawProgress * 0.5 : rawProgress;
        const distanceFromHold = Math.abs(progress - 0.5);

        scene.style.setProperty("--anchor-progress", progress.toFixed(5));

        if (distanceFromHold < activeDistance) {
          activeDistance = distanceFromHold;
          activeScene = scene;
        }

        const restAngle = Number.parseFloat(scene.dataset.anchorAngle ?? "0");
        const clockwise = index % 2 === 0 ? 1 : -1;
        const desktopRadius = clamp(viewportWidth * 0.285, 300, 440);
        const mobileRadius = Math.min(190, viewportWidth * 0.34);
        const restRadius = viewportWidth <= 760 ? mobileRadius : desktopRadius;

        let copyOpacity = 1;
        let copyScale = 1;
        let orbitAngle = restAngle;
        let orbitRadius = restRadius;

        if (progress < HOLD_START) {
          const amount = smooth(progress / HOLD_START);
          copyOpacity = amount;
          copyScale = lerp(0.88, 1, amount);
          orbitAngle = lerp(restAngle - clockwise * 104, restAngle, amount);
          orbitRadius = lerp(restRadius + 150, restRadius, amount);
        } else if (progress > HOLD_END) {
          const amount = smooth((progress - HOLD_END) / (1 - HOLD_END));
          copyOpacity = 1 - amount;
          copyScale = lerp(1, 0.9, amount);
          orbitAngle = lerp(restAngle, restAngle + clockwise * 104, amount);
          orbitRadius = lerp(restRadius, restRadius + 170, amount);
        }

        scene.style.setProperty(
          "--anchor-copy-opacity",
          copyOpacity.toFixed(4),
        );
        scene.style.setProperty("--anchor-copy-scale", copyScale.toFixed(4));
        scene.style.setProperty("--anchor-angle", `${orbitAngle.toFixed(3)}deg`);
        scene.style.setProperty(
          "--anchor-counter-angle",
          `${(-orbitAngle).toFixed(3)}deg`,
        );
        scene.style.setProperty("--anchor-radius", `${orbitRadius.toFixed(2)}px`);

        if (mode === "wake") {
          const side = scene.dataset.anchorSide ?? "right";
          const direction = side === "left" ? -1 : side === "right" ? 1 : 0;
          const restX =
            direction === 0
              ? 0
              : direction *
                (viewportWidth <= 760
                  ? Math.min(120, viewportWidth * 0.18)
                  : clamp(viewportWidth * 0.27, 300, 420));
          const restY =
            side === "center"
              ? Math.min(viewportHeight * 0.25, 220)
              : viewportWidth <= 760
                ? Math.min(viewportHeight * 0.2, 150)
                : 0;

          const parts = Array.from(
            scene.querySelectorAll<HTMLElement>("[data-anchor-part]"),
          );
          parts.forEach((part, partIndex) => {
            const lag = Math.min(partIndex * 0.034, 0.16);
            const localProgress = clamp(
              (progress - lag) / Math.max(1 - lag, 0.01),
            );
            let x = restX;
            let y = restY + partIndex * 2;
            let opacity = 1;
            let rotation = 0;
            let scale = 1;
            let blur = 0;

            if (localProgress < HOLD_START) {
              const amount = smooth(localProgress / HOLD_START);
              x = lerp(direction * 24, restX, amount);
              y = lerp(92 + partIndex * 18, restY + partIndex * 2, amount);
              opacity = amount;
              rotation = lerp(direction * -13, 0, amount);
              scale = lerp(0.94, 1, amount);
              blur = lerp(10, 0, amount);
            } else if (localProgress > HOLD_END) {
              const amount = smooth(
                (localProgress - HOLD_END) / (1 - HOLD_END),
              );
              x = lerp(
                restX,
                restX - (direction || (index % 2 === 0 ? 1 : -1)) * 230,
                amount,
              );
              y = lerp(
                restY + partIndex * 2,
                restY - 110 - partIndex * 13,
                amount,
              );
              opacity = 1 - amount;
              rotation = lerp(0, (direction || 1) * -9, amount);
              scale = lerp(1, 0.96, amount);
              blur = lerp(0, 8, amount);
            }

            part.style.opacity = opacity.toFixed(4);
            part.style.filter = `blur(${blur.toFixed(2)}px)`;
            part.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
              2,
            )}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(
              4,
            )})`;
          });
        }
      });

      scenes.forEach((scene) => {
        scene.dataset.anchorActive =
          scene === activeScene ? "true" : "false";
      });
    };

    const schedule = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(render);
    };

    if (reducedMotion.matches || connection?.saveData) {
      scenes.forEach(setHeldState);
      return;
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [mode]);

  return null;
}

export default function KoiAnchorRendition({
  mode,
}: KoiAnchorRenditionProps) {
  const isOrbit = mode === "orbit";

  return (
    <div
      className={`studio-site studio-site--koi koi-world koi-anchor koi-anchor--${mode}`}
      data-koi-anchor-mode={mode}
    >
      <ScrollKoiExperience />
      <KoiAnchorMotion mode={mode} />

      <header className="koi-anchor__header">
        <Link
          className="koi-anchor__brand"
          href="/"
          aria-label="Return to the current Koinophobia Labs homepage"
        >
          <span aria-hidden="true" />
          Koinophobia Labs
        </Link>

        <div className="koi-anchor__mode-label" aria-live="polite">
          <small>{isOrbit ? "Rendition A" : "Rendition B"}</small>
          <strong>{isOrbit ? "Orbit" : "Wake"}</strong>
        </div>

        <nav aria-label="Koi anchor rendition switcher">
          <Link href="/">Current</Link>
          <Link
            href="/koi-renditions/orbit"
            aria-current={isOrbit ? "page" : undefined}
          >
            Orbit
          </Link>
          <Link
            href="/koi-renditions/wake"
            aria-current={!isOrbit ? "page" : undefined}
          >
            Wake
          </Link>
        </nav>
      </header>

      <aside className="koi-anchor__legend" aria-hidden="true">
        <span>{isOrbit ? "COPY ORBITS THE KOI" : "COPY TRAILS THE KOI"}</span>
        <b>HOLD</b>
        <i />
        <b>RAMP</b>
        <i />
        <b>HOLD</b>
      </aside>

      <main>
        <AnchorScene
          id="anchor-enter"
          scene="hero"
          frame="2.65"
          angle={205}
          side="left"
          titleId="anchor-hero-title"
        >
          <p className="koi-anchor__kicker" data-anchor-part>
            AI-native product studio · Chicago
          </p>
          <h1 id="anchor-hero-title" data-anchor-part>
            Build what ordinary thinking would never reach.
          </h1>
          <p className="koi-anchor__body" data-anchor-part>
            The koi holds the center. Products, systems, proof, and the next
            action collect around its movement.
          </p>
          <div className="koi-anchor__actions" data-anchor-part>
            <a href="#anchor-products">
              Follow the koi <ArrowDown size={16} aria-hidden="true" />
            </a>
            <Link href="/concierge?entry=home">
              Bring us a problem <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </AnchorScene>

        <AnchorScene
          id="anchor-products"
          scene="products"
          frame="3.65"
          angle={-22}
          side="right"
          titleId="anchor-products-title"
          duo
        >
          <p className="koi-anchor__kicker" data-anchor-part>
            Inside the lab
          </p>
          <h2 id="anchor-products-title" data-anchor-part>
            Three products move inside the same current.
          </h2>
          <div className="koi-anchor__links" data-anchor-part>
            {products.map((product, index) => (
              <DestinationLink
                href={product.href}
                key={product.title}
                ariaLabel={`${product.cta}: ${product.title}`}
              >
                <span>0{index + 1}</span>
                <strong>{product.title}</strong>
                <small>{product.audience}</small>
                <ArrowUpRight size={15} aria-hidden="true" />
              </DestinationLink>
            ))}
          </div>
          <Link className="koi-anchor__quiet-link" href="/products" data-anchor-part>
            Enter the product universe
          </Link>
        </AnchorScene>

        <AnchorScene
          id="anchor-systems"
          scene="systems"
          frame="5.85"
          angle={166}
          side="left"
          titleId="anchor-systems-title"
        >
          <p className="koi-anchor__kicker" data-anchor-part>
            Systems around the product
          </p>
          <h2 id="anchor-systems-title" data-anchor-part>
            The visible experience is only the surface.
          </h2>
          <p className="koi-anchor__body" data-anchor-part>
            Koinophobia Labs also builds the intake, routing, automation, and
            operating logic underneath it.
          </p>
          <div className="koi-anchor__links" data-anchor-part>
            {serviceOffers.slice(0, 4).map((offer, index) => (
              <Link href={offer.href} key={offer.slug}>
                <span>0{index + 1}</span>
                <strong>{offer.title}</strong>
                <small>{offer.price}</small>
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </AnchorScene>

        <AnchorScene
          id="anchor-work"
          scene="work"
          frame="7.65"
          angle={18}
          side="right"
          titleId="anchor-work-title"
        >
          <p className="koi-anchor__kicker" data-anchor-part>
            Built in public · labeled honestly
          </p>
          <h2 id="anchor-work-title" data-anchor-part>
            Proof follows where the koi has already moved.
          </h2>
          <div className="koi-anchor__links koi-anchor__links--work" data-anchor-part>
            {workProjects.slice(0, 3).map((project, index) => (
              <Link
                href={project.previewUrl ?? `/work/${project.slug}`}
                key={project.slug}
              >
                <span>0{index + 1}</span>
                <strong>{project.title}</strong>
                <small>{project.statusLabel}</small>
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
          <Link className="koi-anchor__quiet-link" href="/work" data-anchor-part>
            Enter the work archive
          </Link>
        </AnchorScene>

        <AnchorScene
          id="anchor-founder"
          scene="founder"
          frame="9.55"
          angle={205}
          side="left"
          titleId="anchor-founder-title"
        >
          <div className="koi-anchor__portrait" data-anchor-part>
            <Image
              src="/blake-portrait.jpg"
              alt="Blake Taylor, founder of Koinophobia Labs"
              fill
              sizes="96px"
            />
          </div>
          <p className="koi-anchor__kicker" data-anchor-part>
            Founder-led by design
          </p>
          <h2 id="anchor-founder-title" data-anchor-part>
            One studio. One builder. No agency maze.
          </h2>
          <p className="koi-anchor__body" data-anchor-part>
            Blake Taylor scopes, designs, builds, tests, and ships the work.
            The person making the promise stays responsible for the result.
          </p>
          <Link className="koi-anchor__quiet-link" href="/about" data-anchor-part>
            Meet the founder
          </Link>
        </AnchorScene>

        <AnchorScene
          id="anchor-start"
          scene="start"
          frame="11.65"
          angle={88}
          side="center"
          titleId="anchor-start-title"
        >
          <p className="koi-anchor__kicker" data-anchor-part>
            The next orbit starts here
          </p>
          <h2 id="anchor-start-title" data-anchor-part>
            Bring the problem. We will build the system.
          </h2>
          <p className="koi-anchor__body" data-anchor-part>
            Start with a focused audit, let the concierge find the right path,
            or send the project directly.
          </p>
          <div className="koi-anchor__actions" data-anchor-part>
            <Link href="/audit">Start with an audit</Link>
            <Link href="/intake">
              Start a project <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </AnchorScene>
      </main>

      <footer className="koi-anchor__footer">
        <span>Koinophobia Labs · Chicago</span>
        <span>{isOrbit ? "The words orbit." : "The words leave a wake."}</span>
      </footer>
    </div>
  );
}
