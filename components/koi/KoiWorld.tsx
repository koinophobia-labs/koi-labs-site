"use client";

import { useEffect, useRef, useState } from "react";
import {
  ARRIVE_END,
  CLIPS,
  DEPART_START,
  DESTINATIONS,
  FORM_SECONDS,
  type ClipKey,
  type Destination,
  type KoiPose,
} from "@/lib/koi/journey";
import { createWater, type WaterHandle } from "./water";

type MotionMode = "pending" | "cinematic" | "still";

const MOBILE_QUERY = "(max-width: 1024px)";
const ULTRAWIDE_MIN_WIDTH = 2800;
const ULTRAWIDE_MIN_ASPECT = 2;
const ULTRAWIDE_MOTION_WIDTH = 1600;
const ULTRAWIDE_SCALE = 0.84;
const READING_REST_PROGRESS = 0.46;
const POINTER_SETTLE_MS = 450;
const FADE_SECONDS = 0.24;
const LOOP_FADE = 0.42;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (v: number) => {
  const b = clamp(v);
  return b * b * (3 - 2 * b);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function mixPose(a: KoiPose, b: KoiPose, t: number): KoiPose {
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    scale: mix(a.scale, b.scale, t),
    rotate: mix(a.rotate, b.rotate, t),
    depth: mix(a.depth, b.depth, t),
    opacity: mix(a.opacity, b.opacity, t),
    blur: mix(a.blur, b.blur, t),
  };
}

function posesFor(destination: Destination, mobile: boolean) {
  const base = destination.pose;
  const overrides = mobile ? destination.poseMobile : undefined;
  return {
    arrive: overrides?.arrive ?? base.arrive,
    hold: overrides?.hold ?? base.hold,
    depart: overrides?.depart ?? base.depart,
  };
}

/** Which clip should be on screen for this destination at this local progress. */
function clipFor(destination: Destination, t: number): ClipKey {
  if (destination.transitionClip && t > DEPART_START + 0.06) {
    return destination.transitionClip;
  }
  return destination.clip;
}

function markCurrentDestination(shell: HTMLElement, id: string) {
  shell.dataset.koiDestination = id;
  for (const link of shell.querySelectorAll<HTMLElement>("[data-koi-link]")) {
    if (link.dataset.koiLink === id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

export default function KoiWorld() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MotionMode>("pending");
  const [active, setActive] = useState(0);

  // ---- Choose the experience the visitor has actually asked for ----------
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => {
      const nav = navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      };
      const constrained =
        nav.connection?.saveData === true ||
        /^(slow-2g|2g)$/.test(nav.connection?.effectiveType ?? "");
      setMode(reduced.matches || constrained ? "still" : "cinematic");
    };
    decide();
    reduced.addEventListener("change", decide);
    return () => reduced.removeEventListener("change", decide);
  }, []);

  // ---- Mirror the chosen experience onto the page shell -----------------
  useEffect(() => {
    const shell = rootRef.current?.closest(".kw") as HTMLElement | null;
    if (!shell) return;
    shell.dataset.motion = mode;
    return () => {
      delete shell.dataset.motion;
    };
  }, [mode]);

  // ---- The cinematic experience -----------------------------------------
  useEffect(() => {
    if (mode !== "cinematic") return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!root || !canvas || !stage) return;
    // Data attributes drive the reading surfaces, so they live on the page
    // wrapper. Numeric composition variables go on the document root so the
    // water, the koi and the copy all read the same frame.
    const shell = (root.closest(".kw") as HTMLElement | null) ?? root;
    const vars = document.documentElement;

    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    let mobile = mobileQuery.matches;

    let water: WaterHandle | null = null;
    try {
      water = createWater(canvas);
    } catch {
      water = null;
    }
    if (!water) canvas.style.display = "none";

    // --- Video pool -------------------------------------------------------
    const pool = new Map<ClipKey, HTMLVideoElement>();

    const sourceFor = (key: ClipKey) => {
      const clip = CLIPS[key];
      const size = mobile ? "854" : "1280";
      // H.264 only, deliberately. VP9/AV1 re-encodes of this footage measured
      // the same size or larger at equal quality (near-black frames compress
      // extremely well in H.264), so a second rendition would cost payload and
      // decode support without buying anything.
      return { mp4: `/koi/${clip.id}-${size}.mp4` };
    };

    const ensureVideo = (
      key: ClipKey,
      preload: "metadata" | "auto" = "auto",
    ) => {
      const existing = pool.get(key);
      if (existing) {
        if (preload === "auto" && existing.preload !== "auto") {
          existing.preload = "auto";
          existing.load();
        }
        return existing;
      }

      const video = document.createElement("video");
      video.className = "koi-world__clip";
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = preload;
      video.setAttribute("aria-hidden", "true");
      video.setAttribute("tabindex", "-1");
      video.poster = CLIPS[key].poster;
      const { mp4 } = sourceFor(key);
      const source = document.createElement("source");
      source.src = mp4;
      source.type = "video/mp4";
      video.append(source);

      video.dataset.koiClip = key;
      video.style.opacity = "0";

      // If a segment cannot be fetched or decoded, hold on THIS clip's own
      // poster frame rather than swapping in a different clip. That preserves
      // each destination's distinct angle in degraded mode — a decode failure
      // must never collapse six camera angles into one. The poster is already
      // set to this clip's still, so there is nothing more to swap; we only
      // mark the element so the render loop treats it as a static frame and
      // stops trying to play it.
      const fallback = () => {
        if (video.dataset.koiFallback === "true") return;
        video.dataset.koiFallback = "true";
        video.dataset.koiStatic = "true";
      };
      video.addEventListener("error", fallback);
      video.querySelector("source")?.addEventListener("error", fallback);

      stage.appendChild(video);
      pool.set(key, video);
      return video;
    };

    // --- Loop state -------------------------------------------------------
    let mountedKey: ClipKey = DESTINATIONS[0].clip;
    let envelope = 0;
    let frame = 0;
    let lastFrameAt = performance.now();
    let lastScrollY = window.scrollY;
    let velocity = 0;
    let smoothed: KoiPose | null = null;
    let pointerX = -1;
    let pointerY = -1;
    let pointerAmp = 0;
    let lastPointerAt = Number.NEGATIVE_INFINITY;
    let paused = false;
    let activeIndex = -1;
    let lastWaterAt = 0;
    let waterSettled = false;
    const published = new Map<string, string>();
    const publish = (name: string, value: string) => {
      if (published.get(name) === value) return;
      published.set(name, value);
      vars.style.setProperty(name, value);
    };

    const bands: {
      destination: Destination;
      el: HTMLElement;
      top: number;
      height: number;
    }[] = [];

    // Time-based formation floors, one per destination. See FORM_SECONDS.
    const floors = new Map<string, number>();

    const measure = () => {
      bands.length = 0;
      for (const destination of DESTINATIONS) {
        const el = document.getElementById(destination.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        bands.push({
          destination,
          el,
          top: rect.top + window.scrollY,
          height: Math.max(rect.height, 1),
        });
      }
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.35);
      const baseScale = mobile ? 0.68 : window.innerWidth >= 2200 ? 0.68 : 0.82;
      const pixelBudget = mobile ? 900_000 : 2_200_000;
      const requestedPixels =
        window.innerWidth * baseScale * dpr * window.innerHeight * baseScale * dpr;
      const budgetScale = Math.min(1, Math.sqrt(pixelBudget / requestedPixels));
      water?.resize(
        window.innerWidth * baseScale * budgetScale,
        window.innerHeight * baseScale * budgetScale,
        dpr,
      );
    };

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerX = event.clientX / window.innerWidth;
      pointerY = 1 - event.clientY / window.innerHeight;
      pointerAmp = 1;
      lastPointerAt = performance.now();
    };
    const onPointerLeave = () => {
      pointerX = -1;
      pointerY = -1;
      lastPointerAt = Number.NEGATIVE_INFINITY;
    };

    const onVisibility = () => {
      paused = document.hidden;
      if (paused) {
        for (const video of pool.values()) video.pause();
      } else {
        lastFrameAt = performance.now();
      }
    };

    const onMediaChange = () => {
      const next = mobileQuery.matches;
      if (next === mobile) return;
      mobile = next;
      // Swap every mounted clip to the correct rendition.
      for (const [key, video] of pool) {
        const { mp4 } = sourceFor(key);
        const source = video.querySelector("source");
        if (source && source.getAttribute("src") !== mp4) {
          source.src = mp4;
          video.load();
        }
      }
      measure();
    };

    const onKoiLinkClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[data-koi-link]");
      const id = link?.dataset.koiLink;
      if (!link || !id || link.target === "_blank") return;

      const band = bands.find((candidate) => candidate.destination.id === id);
      if (!band) return;

      event.preventDefault();
      const activationOffset = window.innerHeight * (mobile ? 0.22 : 0.38);
      const travel = Math.max(
        band.height - window.innerHeight,
        band.height * 0.45,
      );
      const top = id === DESTINATIONS[0].id
        ? 0
        : clamp(
            band.top + travel * READING_REST_PROGRESS - activationOffset,
            0,
            Math.max(document.documentElement.scrollHeight - window.innerHeight, 0),
          );
      window.history.replaceState(null, "", `#${id}`);
      window.scrollTo({ top, behavior: "smooth" });
    };

    const tick = (now: number) => {
      frame = window.requestAnimationFrame(tick);
      const dt = clamp((now - lastFrameAt) / 1000, 0.001, 0.064);
      lastFrameAt = now;

      if (paused) return;

      const scrollY = window.scrollY;
      const rawVelocity = (scrollY - lastScrollY) / dt / Math.max(window.innerHeight, 1);
      lastScrollY = scrollY;
      velocity += (rawVelocity - velocity) * clamp(dt * 9);

      // --- Locate the visitor in the journey -------------------------------
      const activationOffset = window.innerHeight * (mobile ? 0.22 : 0.38);
      const focus = scrollY + activationOffset;
      let band = bands[0];
      for (const candidate of bands) {
        if (focus >= candidate.top) band = candidate;
      }
      if (!band) return;

      const destination = band.destination;
      const travel = Math.max(band.height - window.innerHeight, band.height * 0.45);
      const t = scrollY < 2 && band.destination.index === 0
        ? ARRIVE_END + 0.15
        : clamp((focus - band.top) / travel);

      if (destination.index !== activeIndex) {
        activeIndex = destination.index;
        markCurrentDestination(shell, destination.id);
        setActive(destination.index);
      }

      // --- Phase: arrive -> hold -> depart ---------------------------------
      const poses = posesFor(destination, mobile);
      let target: KoiPose;
      let phase: "arrive" | "hold" | "depart";
      // Reveal drives the reading surface: 0 = entering, 1 = fully settled.
      // It climbs across the arrival, stays pinned through the reading hold,
      // then eases away during departure. Because it is a pure function of
      // scroll position, reverse scrolling retraces the transition exactly.
      let reveal: number;
      if (t < ARRIVE_END) {
        phase = "arrive";
        const p = t / ARRIVE_END;
        target = mixPose(poses.arrive, poses.hold, smooth(p));
        reveal = smooth(p);
      } else if (t < DEPART_START) {
        phase = "hold";
        target = poses.hold;
        reveal = 1;
      } else {
        phase = "depart";
        const p = (t - DEPART_START) / (1 - DEPART_START);
        target = mixPose(poses.hold, poses.depart, smooth(p));
        reveal = 1 - smooth(p);
      }
      shell.dataset.koiPhase = phase;

      // --- Words: per-destination reveal and flow ---------------------------
      // Reveal is written on every section, not only the active one, because
      // on mobile several sections share the screen. Scroll drives formation
      // while the visitor is moving; a per-destination floor climbs with time
      // whenever a section is being looked at, so a nav jump, a deep link, or
      // a phone's natural reading flow always ends with the words formed.
      for (const candidate of bands) {
        const cid = candidate.destination.id;
        const cTravel = Math.max(
          candidate.height - window.innerHeight,
          candidate.height * 0.45,
        );
        const isActive = cid === destination.id;
        const isLast = candidate.destination.index === DESTINATIONS.length - 1;
        // The journey's final destination has nothing to depart into: its
        // words hold formed to the very bottom of the page.
        const rawT = isActive ? t : clamp((focus - candidate.top) / cTravel);
        const ct = isLast ? Math.min(rawT, DEPART_START - 0.001) : rawT;
        const onScreen =
          candidate.top < scrollY + window.innerHeight * (mobile ? 0.78 : 1) &&
          candidate.top + candidate.height > scrollY;

        let floor = floors.get(cid) ?? 0;
        if (mobile ? onScreen : isActive && ct < DEPART_START) {
          floor = Math.min(1, floor + dt / FORM_SECONDS);
        } else if (!onScreen) {
          floor = 0;
        }
        floors.set(cid, floor);

        let wordReveal: number;
        let flow: "form" | "lock" | "release" | "out";
        if (mobile) {
          // Phones read in natural flow: words form as the copy arrives and
          // then stay formed. Release is a sticky-stage idea — on a phone it
          // would dissolve text the visitor is still reading.
          wordReveal = smooth(floor);
          flow =
            !onScreen && floor === 0 ? "out" : wordReveal >= 0.98 ? "lock" : "form";
        } else if (isActive) {
          const scrollReveal =
            ct < ARRIVE_END
              ? smooth(ct / ARRIVE_END)
              : ct < DEPART_START
                ? 1
                : 1 - smooth((ct - DEPART_START) / (1 - DEPART_START));
          wordReveal =
            ct >= DEPART_START ? scrollReveal : Math.max(scrollReveal, smooth(floor));
          flow =
            phase === "depart" && !isLast
              ? "release"
              : wordReveal >= 0.98
                ? "lock"
                : "form";
        } else {
          wordReveal = 0;
          flow = "out";
        }

        candidate.el.style.setProperty("--koi-reveal", wordReveal.toFixed(4));
        if (candidate.el.dataset.flow !== flow) candidate.el.dataset.flow = flow;
      }

      // The koi carries inertia: it lags the scroll slightly, like a body with
      // mass, instead of being welded to the scroll offset.
      const follow = 1 - Math.exp(-(phase === "depart" ? 7.5 : 4.4) * dt);
      smoothed = smoothed ? mixPose(smoothed, target, follow) : target;

      const speed = clamp(Math.abs(velocity) / 1.6);
      const surge =
        phase === "depart"
          ? smooth((t - DEPART_START) / (1 - DEPART_START)) * 0.8 + speed * 0.5
          : speed * 0.55;
      const readingRest = phase === "hold" && Math.abs(velocity) < 0.04;

      // --- Clip management --------------------------------------------------
      const desired = clipFor(destination, t);
      ensureVideo(desired, "auto");
      // The initial frame loads only the lead clip. Once the visitor actually
      // moves, warm one beat ahead during the latter half of the reading hold.
      // Metadata arrives first; full decode begins close enough to departure to
      // avoid a transition stall without paying for three videos at page load.
      const hasMoved = scrollY > Math.max(72, window.innerHeight * 0.08);
      const next = DESTINATIONS[destination.index + 1];
      if (next && hasMoved && t > 0.42) {
        ensureVideo(next.clip, t > 0.56 ? "auto" : "metadata");
      }
      if (destination.transitionClip && hasMoved && t > 0.5) {
        ensureVideo(
          destination.transitionClip,
          t > DEPART_START - 0.04 ? "auto" : "metadata",
        );
      }

      if (mountedKey !== desired) {
        envelope -= dt / FADE_SECONDS;
        if (envelope <= 0) {
          envelope = 0;
          const outgoing = pool.get(mountedKey);
          if (outgoing) {
            outgoing.pause();
            outgoing.style.opacity = "0";
          }
          mountedKey = desired;
        }
      } else {
        envelope += dt / FADE_SECONDS;
      }
      envelope = clamp(envelope);

      const video = pool.get(mountedKey);
      let loopFade = 1;
      if (video && video.dataset.koiStatic !== "true") {
        if (video.paused && video.readyState >= 2) {
          void video.play().catch(() => {
            /* Autoplay refusal is handled by the poster underneath. */
          });
        }
        // Motion belongs to travel; a reading rest is calm, not a freeze-frame.
        // With the koi present through the hold, a stopped frame reads as a
        // broken video — so the fish keeps station at a slow ambient drift and
        // accelerates only when the visitor moves on.
        const rate = readingRest
          ? 0.45
          : phase === "arrive"
            ? 0.62
            : 0.72 + surge * 1.15;
        const clamped = clamp(rate, 0.25, 2.2);
        if (Math.abs(video.playbackRate - clamped) > 0.02) {
          video.playbackRate = clamped;
        }

        // Dip the koi into the dark across the loop seam so the cut never pops.
        const duration = Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : CLIPS[mountedKey].duration;
        const time = video.currentTime;
        const edge = Math.min(time, duration - time);
        loopFade = 0.45 + 0.55 * smooth(clamp(edge / LOOP_FADE));
      }

      // --- Publish the composition -----------------------------------------
      const pose = smoothed;
      const depth = clamp(pose.depth);
      const opacity = pose.opacity * envelope * loopFade;
      // Viewport-relative translation keeps growing after the reading shell
      // has reached its desktop max. On a 3440px canvas that pushed most of
      // the koi beyond the right edge. Cap only the ultrawide travel range and
      // trim scale slightly so the fish remains a guide inside the scene.
      const ultrawide =
        window.innerWidth >= ULTRAWIDE_MIN_WIDTH &&
        window.innerWidth / Math.max(window.innerHeight, 1) >= ULTRAWIDE_MIN_ASPECT;
      const horizontalFactor = ultrawide
        ? Math.min(1, ULTRAWIDE_MOTION_WIDTH / window.innerWidth)
        : 1;
      const displayScale = pose.scale * (ultrawide ? ULTRAWIDE_SCALE : 1);
      publish("--koi-x", `${(pose.x * 50 * horizontalFactor).toFixed(3)}vw`);
      publish("--koi-y", `${(pose.y * 50).toFixed(3)}vh`);
      publish("--koi-scale", displayScale.toFixed(4));
      publish("--koi-rotate", `${pose.rotate.toFixed(3)}deg`);
      publish("--koi-blur", `${pose.blur.toFixed(2)}px`);
      publish("--koi-opacity", opacity.toFixed(4));
      publish("--koi-depth", depth.toFixed(4));
      publish("--koi-front", smooth(clamp((depth - 0.42) / 0.4)).toFixed(4));
      publish("--koi-surge", clamp(surge).toFixed(4));
      publish("--koi-phase-t", t.toFixed(4));
      publish("--koi-reveal", reveal.toFixed(4));
      publish(
        "--koi-hold",
        (1 - smooth(clamp(Math.abs(t - 0.46) / 0.3))).toFixed(4),
      );
      if (video) {
        video.style.opacity = "1";
      }

      // --- Water ------------------------------------------------------------
      const pointerActive = pointerX >= 0 && now - lastPointerAt < POINTER_SETTLE_MS;
      pointerAmp += ((pointerActive ? 1 : 0) - pointerAmp) * clamp(dt * 4);
      const calm = readingRest && pointerAmp < 0.02;
      if (shell.dataset.koiRest !== String(calm)) {
        shell.dataset.koiRest = String(calm);
      }

      if (water) {
        const w = destination.water;
        const nextWater = DESTINATIONS[destination.index + 1]?.water ?? w;
        const blend = phase === "depart"
          ? smooth((t - DEPART_START) / (1 - DEPART_START))
          : 0;
        const renderInterval = calm ? (mobile ? 66 : 50) : mobile ? 33 : 22;
        const shouldRender = calm
          ? !waterSettled
          : now - lastWaterAt >= renderInterval;
        if (shouldRender) {
          lastWaterAt = now;
          water.render({
            time: now / 1000,
            progress: clamp(
              (destination.index + t) / Math.max(DESTINATIONS.length - 1, 1),
            ),
            surge: clamp(surge),
            depth: mix(w.depth, nextWater.depth, blend),
            particles: mix(w.particles, nextWater.particles, blend) * (mobile ? 0.6 : 1),
            caustics: mix(w.caustics, nextWater.caustics, blend),
            warmth: mix(w.warmth, nextWater.warmth, blend),
            lightX: mix(w.lightX, nextWater.lightX, blend),
            lightY: mix(w.lightY, nextWater.lightY, blend),
            pointerX,
            pointerY,
            pointerAmp: pointerAmp * 0.9,
            quality: mobile ? 0.5 : 1,
          });
        }
        waterSettled = calm;
      }
    };

    measure();
    // Arriving at the top of the page, the hero is already formed — the
    // journey begins readable. Formation choreography plays for every other
    // destination, and for the hero again on the way back up.
    if (window.scrollY < 2) floors.set(DESTINATIONS[0].id, 1);
    ensureVideo(DESTINATIONS[0].clip);
    shell.setAttribute("data-koi-ready", "true");

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resizeObserver?.observe(document.body);
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("orientationchange", measure);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    shell.addEventListener("click", onKoiLinkClick);
    mobileQuery.addEventListener("change", onMediaChange);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      shell.removeEventListener("click", onKoiLinkClick);
      mobileQuery.removeEventListener("change", onMediaChange);
      for (const video of pool.values()) {
        video.pause();
        video.removeAttribute("src");
        for (const source of video.querySelectorAll("source")) {
          source.removeAttribute("src");
        }
        video.load();
        video.remove();
      }
      pool.clear();
      water?.dispose();
      shell.removeAttribute("data-koi-ready");
      delete shell.dataset.koiPhase;
      delete shell.dataset.koiRest;
      for (const band of bands) {
        band.el.style.removeProperty("--koi-reveal");
        delete band.el.dataset.flow;
      }
      for (const name of [
        "--koi-x", "--koi-y", "--koi-scale", "--koi-rotate", "--koi-blur",
        "--koi-opacity", "--koi-depth", "--koi-front", "--koi-surge",
        "--koi-phase-t", "--koi-reveal", "--koi-hold",
      ]) {
        vars.style.removeProperty(name);
      }
      published.clear();
    };
  }, [mode]);

  // ---- The designed still experience ------------------------------------
  useEffect(() => {
    if (mode !== "still") return;
    const root = rootRef.current;
    if (!root) return;
    const shell = (root.closest(".kw") as HTMLElement | null) ?? root;
    const sections = DESTINATIONS.map((destination) =>
      document.getElementById(destination.id),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sections.indexOf(entry.target as HTMLElement);
          if (index < 0) continue;
          markCurrentDestination(shell, DESTINATIONS[index].id);
          setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const section of sections) if (section) observer.observe(section);
    return () => observer.disconnect();
  }, [mode]);

  return (
    <div
      className="koi-world"
      ref={rootRef}
      data-motion={mode}
      aria-hidden="true"
    >
      <canvas className="koi-world__water" ref={canvasRef} />
      <div className="koi-world__stage" ref={stageRef} />
      <div className="koi-world__veil" />
      <div className="koi-world__grain" />
      {mode === "still" ? (
        <div className="koi-world__stills">
          {DESTINATIONS.map((destination, index) => (
            <div
              key={destination.id}
              className="koi-world__still"
              data-on={index === active ? "true" : "false"}
              style={{ backgroundImage: `url(${CLIPS[destination.clip].poster})` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
