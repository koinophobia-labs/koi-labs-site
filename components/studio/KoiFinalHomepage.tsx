"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import ScrollKoiExperience from "@/components/studio/ScrollKoiExperience";
import { products, serviceOffers, workProjects } from "@/lib/commercial";

type FollowSide = "left" | "right" | "center";

type FollowSceneProps = {
  id: string;
  scene: string;
  label: string;
  frame: string;
  side: FollowSide;
  titleId: string;
  duo?: boolean;
  children: ReactNode;
};

type DestinationLinkProps = {
  href: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

const HOLD_START = 0.3;
const HOLD_END = 0.7;
const INTRO_DURATION_MS = 1800;

const featuredProducts = [products[1], products[0], products[2]].filter(Boolean);
const productSides: FollowSide[] = ["right", "left", "right"];

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
  ariaLabel,
  children,
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

function FollowScene({
  id,
  scene,
  label,
  frame,
  side,
  titleId,
  duo = false,
  children,
}: FollowSceneProps) {
  return (
    <section
      className={`koi-final__scene koi-final__scene--${scene}`}
      id={id}
      data-final-scene={scene}
      data-final-label={label}
      data-follow-side={side}
      data-koi-frame={frame}
      data-koi-scene={scene}
      data-koi-duo={duo ? "true" : undefined}
      aria-labelledby={titleId}
    >
      <div className="koi-final__sticky">{children}</div>
    </section>
  );
}

function KoiFinalMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-koi-final]");
    if (!root) return;

    const scenes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-final-scene]"),
    );
    const navLinks = Array.from(
      root.querySelectorAll<HTMLElement>("[data-final-nav]"),
    );
    const status = root.querySelector<HTMLElement>("[data-final-scene-status]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as NavigatorWithConnection).connection;
    const introStartedAt = performance.now();
    let animationFrame = 0;
    let lastActiveScene = "";

    const setStaticState = () => {
      scenes.forEach((scene, sceneIndex) => {
        scene.dataset.followActive = sceneIndex === 0 ? "true" : "false";
        scene.style.setProperty("--follow-progress", ".5");
        const parts = Array.from(
          scene.querySelectorAll<HTMLElement>("[data-follow-part]"),
        );
        parts.forEach((part) => {
          part.style.opacity = "1";
          part.style.filter = "none";
          part.style.transform = "none";
          part.style.pointerEvents = "auto";
        });
      });
      root.dataset.koiScene = "hero";
      root.dataset.followMotion = "static";
      root.style.setProperty("--follow-intro", "1");
      if (status) status.textContent = "Enter";
    };

    const render = (now: number) => {
      if (reducedMotion.matches || connection?.saveData) {
        setStaticState();
        return;
      }

      root.dataset.followMotion = "live";
      const viewportHeight = Math.max(window.innerHeight, 1);
      const viewportWidth = Math.max(window.innerWidth, 1);
      const introProgress = smooth(
        clamp((now - introStartedAt) / INTRO_DURATION_MS),
      );
      let activeScene: HTMLElement | null = null;
      let activeDistance = Number.POSITIVE_INFINITY;

      scenes.forEach((scene, sceneIndex) => {
        const rect = scene.getBoundingClientRect();
        const travel = Math.max(rect.height - viewportHeight, 1);
        const rawProgress = clamp(-rect.top / travel);
        const progress = sceneIndex === 0 ? 0.5 + rawProgress * 0.5 : rawProgress;
        const distanceFromHold = Math.abs(progress - 0.5);

        scene.style.setProperty("--follow-progress", progress.toFixed(5));

        if (distanceFromHold < activeDistance) {
          activeDistance = distanceFromHold;
          activeScene = scene;
        }

        const sceneSide = (scene.dataset.followSide ?? "left") as FollowSide;
        const parts = Array.from(
          scene.querySelectorAll<HTMLElement>("[data-follow-part]"),
        );

        parts.forEach((part, partIndex) => {
          const partSide = (part.dataset.followSide ?? sceneSide) as FollowSide;
          const delay = Number.parseFloat(
            part.dataset.followDelay ?? String(Math.min(partIndex * 0.035, 0.16)),
          );
          const localProgress = clamp(
            (progress - delay) / Math.max(1 - delay, 0.01),
          );
          const direction =
            partSide === "left" ? -1 : partSide === "right" ? 1 : 0;
          const entranceX =
            direction === 0
              ? (partIndex % 2 === 0 ? 1 : -1) * Math.min(100, viewportWidth * 0.08)
              : -direction * Math.min(250, viewportWidth * 0.2);
          const exitX =
            direction === 0
              ? (partIndex % 2 === 0 ? -1 : 1) * Math.min(150, viewportWidth * 0.12)
              : direction * Math.min(190, viewportWidth * 0.15);

          let opacity = 1;
          let x = 0;
          let y = 0;
          let rotation = 0;
          let scale = 1;
          let blur = 0;

          if (localProgress < HOLD_START) {
            const amount = smooth(localProgress / HOLD_START);
            opacity = amount;
            x = lerp(entranceX, 0, amount);
            y = lerp(70 + partIndex * 9, 0, amount);
            rotation = lerp(direction * -5, 0, amount);
            scale = lerp(0.96, 1, amount);
            blur = lerp(12, 0, amount);
          } else if (localProgress > HOLD_END) {
            const amount = smooth(
              (localProgress - HOLD_END) / (1 - HOLD_END),
            );
            opacity = 1 - amount;
            x = lerp(0, exitX, amount);
            y = lerp(0, -86 - partIndex * 7, amount);
            rotation = lerp(0, direction * 4, amount);
            scale = lerp(1, 0.975, amount);
            blur = lerp(0, 9, amount);
          }

          if (sceneIndex === 0) {
            opacity *= introProgress;
            x += lerp(70, 0, introProgress);
            blur = Math.max(blur, lerp(8, 0, introProgress));
          }

          part.style.opacity = opacity.toFixed(4);
          part.style.filter = `blur(${blur.toFixed(2)}px)`;
          part.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
            2,
          )}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(
            4,
          )})`;
          part.style.pointerEvents =
            scene === activeScene && opacity > 0.45 ? "auto" : "none";
        });
      });

      const selectedScene = activeScene as HTMLElement | null;

      scenes.forEach((scene) => {
        scene.dataset.followActive = scene === selectedScene ? "true" : "false";
      });

      if (selectedScene) {
        const activeName = selectedScene.dataset.finalScene ?? "hero";
        root.dataset.koiScene = activeName;
        if (activeName !== lastActiveScene) {
          lastActiveScene = activeName;
          const activeLabel = selectedScene.dataset.finalLabel ?? activeName;
          if (status) status.textContent = activeLabel;
          navLinks.forEach((link) => {
            link.dataset.active =
              link.dataset.finalNav === activeName ? "true" : "false";
          });
        }
      }

      root.style.setProperty("--follow-intro", introProgress.toFixed(4));
      root.style.setProperty(
        "--follow-viewport-ratio",
        (viewportWidth / viewportHeight).toFixed(4),
      );

      if (introProgress < 1) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const schedule = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(render);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
    };
  }, []);

  return null;
}

export default function KoiFinalHomepage() {
  return (
    <div
      className="studio-site studio-site--koi koi-world koi-final"
      data-koi-final
      data-koi-scene="hero"
    >
      <ScrollKoiExperience />
      <KoiFinalMotion />

      <header className="koi-final__header">
        <Link className="koi-final__brand" href="/" aria-label="Koinophobia Labs home">
          <span aria-hidden="true" />
          Koinophobia Labs
        </Link>

        <nav className="koi-final__nav" aria-label="Homepage navigation">
          <a data-final-nav="products" href="#products">
            Products
          </a>
          <a data-final-nav="systems" href="#systems">
            Systems
          </a>
          <a data-final-nav="work" href="#work">
            Work
          </a>
          <a data-final-nav="start" href="#start">
            Start
          </a>
        </nav>

        <Link className="koi-final__header-cta" href="/intake">
          Start a project <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </header>

      <aside className="koi-final__status" aria-live="polite">
        <span>Current</span>
        <b data-final-scene-status>Enter</b>
      </aside>

      <main>
        <FollowScene
          id="enter"
          scene="hero"
          label="Enter"
          frame="2.35"
          side="left"
          titleId="koi-final-hero-title"
        >
          <article className="koi-final__copy koi-final__copy--hero">
            <p className="koi-final__kicker" data-follow-part data-follow-delay="0.01">
              AI-native product studio · Chicago
            </p>
            <h1 id="koi-final-hero-title" data-follow-part data-follow-delay="0.05">
              <span>Koinophobia</span>
              <span>Labs</span>
            </h1>
            <p className="koi-final__hero-line" data-follow-part data-follow-delay="0.09">
              Build what ordinary thinking would never reach.
            </p>
            <p className="koi-final__body" data-follow-part data-follow-delay="0.13">
              Products, digital experiences, and intelligent systems built from
              first principles. Follow the koi through the lab.
            </p>
            <div className="koi-final__actions" data-follow-part data-follow-delay="0.16">
              <a href="#products">
                Enter the lab <ArrowDown size={16} aria-hidden="true" />
              </a>
              <Link href="/concierge?entry=home">
                Bring us a problem <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>

          <a className="koi-final__scroll-cue" href="#products" data-follow-part>
            <span>Scroll with the koi</span>
            <ArrowDown size={14} aria-hidden="true" />
          </a>
        </FollowScene>

        <FollowScene
          id="products"
          scene="products"
          label="Products"
          frame="5.15"
          side="center"
          titleId="koi-final-products-title"
          duo
        >
          <div className="koi-final__products-heading" data-follow-part data-follow-side="left">
            <p className="koi-final__kicker">Inside the lab</p>
            <h2 id="koi-final-products-title">Products in motion.</h2>
            <p>Three products. One studio. Built to move ideas forward.</p>
          </div>

          <div className="koi-final__product-constellation">
            {featuredProducts.map((product, index) => (
              <DestinationLink
                className={`koi-final__product koi-final__product--${index + 1}`}
                href={product.href}
                key={product.title}
                ariaLabel={`${product.cta}: ${product.title}`}
              >
                <article
                  data-follow-part
                  data-follow-side={productSides[index]}
                  data-follow-delay={(0.05 + index * 0.045).toFixed(3)}
                >
                  <span>0{index + 1}</span>
                  <strong>{product.title}</strong>
                  <small>{product.audience}</small>
                  <b>{product.status.replace("Internal Product · ", "")}</b>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </article>
              </DestinationLink>
            ))}
          </div>

          <Link className="koi-final__quiet-link" href="/products" data-follow-part>
            Enter the product universe <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </FollowScene>

        <FollowScene
          id="systems"
          scene="systems"
          label="Systems"
          frame="8.65"
          side="right"
          titleId="koi-final-systems-title"
        >
          <article className="koi-final__copy koi-final__copy--systems">
            <p className="koi-final__kicker" data-follow-part>
              Systems around the product
            </p>
            <h2 id="koi-final-systems-title" data-follow-part data-follow-delay="0.04">
              The visible experience is only the surface.
            </h2>
            <p className="koi-final__body" data-follow-part data-follow-delay="0.08">
              Koinophobia Labs builds the intake, routing, automation, and
              operating logic beneath it.
            </p>
            <div className="koi-final__service-current">
              {serviceOffers.slice(0, 4).map((offer, index) => (
                <Link
                  href={offer.href}
                  key={offer.slug}
                  data-follow-part
                  data-follow-side="right"
                  data-follow-delay={(0.11 + index * 0.035).toFixed(3)}
                >
                  <span>0{index + 1}</span>
                  <strong>{offer.title}</strong>
                  <small>{offer.price}</small>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </article>
        </FollowScene>

        <FollowScene
          id="work"
          scene="work"
          label="Work"
          frame="10.75"
          side="left"
          titleId="koi-final-work-title"
        >
          <article className="koi-final__copy koi-final__copy--work">
            <p className="koi-final__kicker" data-follow-part>
              Built in public · labeled honestly
            </p>
            <h2 id="koi-final-work-title" data-follow-part data-follow-delay="0.04">
              Proof leaves a wake.
            </h2>
            <div className="koi-final__work-current">
              {workProjects.slice(0, 3).map((project, index) => (
                <Link
                  href={project.previewUrl ?? `/work/${project.slug}`}
                  key={project.slug}
                  data-follow-part
                  data-follow-side="left"
                  data-follow-delay={(0.08 + index * 0.04).toFixed(3)}
                >
                  <span>0{index + 1}</span>
                  <div>
                    <strong>{project.title}</strong>
                    <small>{project.businessType}</small>
                  </div>
                  <b>{project.statusLabel}</b>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <Link className="koi-final__quiet-link" href="/work" data-follow-part>
              Enter the work archive <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </article>
        </FollowScene>

        <FollowScene
          id="start"
          scene="start"
          label="Start"
          frame="13.65"
          side="right"
          titleId="koi-final-start-title"
        >
          <article className="koi-final__founder" data-follow-part data-follow-side="left">
            <div className="koi-final__portrait">
              <Image
                src="/blake-portrait.jpg"
                alt="Blake Taylor, founder of Koinophobia Labs"
                fill
                sizes="88px"
              />
            </div>
            <div>
              <span>Founder-led by design</span>
              <strong>Blake Taylor builds the work.</strong>
              <Link href="/about">
                Meet the founder <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </article>

          <article className="koi-final__copy koi-final__copy--start">
            <p className="koi-final__kicker" data-follow-part>
              The next current starts here
            </p>
            <h2 id="koi-final-start-title" data-follow-part data-follow-delay="0.04">
              Bring the problem. We will build the system.
            </h2>
            <p className="koi-final__body" data-follow-part data-follow-delay="0.08">
              Start with a focused audit, use the concierge to find the right
              path, or send the project directly.
            </p>
            <div className="koi-final__actions" data-follow-part data-follow-delay="0.12">
              <Link href="/audit">Start with an audit</Link>
              <Link href="/intake">
                Start a project <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>

          <footer className="koi-final__footer" data-follow-part data-follow-delay="0.16">
            <span>Koinophobia Labs · Chicago</span>
            <nav aria-label="Footer navigation">
              <Link href="/services">Services</Link>
              <Link href="/products">Products</Link>
              <Link href="/work">Work</Link>
              <Link href="/about">About</Link>
            </nav>
            <span>Fear ordinary.</span>
          </footer>
        </FollowScene>
      </main>
    </div>
  );
}
