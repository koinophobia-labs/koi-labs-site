"use client";

import { useEffect, useRef, useState } from "react";

const SINGLE_KOI_SRC = "/brand/koi-scroll-single.mp4";
const DUO_KOI_SRC = "/brand/koi-scroll-duo.mp4";

const FALLBACK_DURATION_SECONDS = 12;
const HERO_SETTLE_SECONDS = 2.65;
const RAMP_START = 0.32;
const RAMP_END = 0.68;

type MotionMode = "pending" | "video" | "static";
type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};
type SceneCue = {
  position: number;
  normalizedTime: number;
  scene: string;
};
type SceneTime = {
  time: number;
  ramping: boolean;
  rampStrength: number;
  scene: string;
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smooth(value: number) {
  const bounded = clamp(value);
  return bounded * bounded * (3 - 2 * bounded);
}

function collectSceneCues(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-koi-frame]"))
    .map((element): SceneCue | null => {
      const frameSeconds = Number.parseFloat(element.dataset.koiFrame ?? "");
      if (!Number.isFinite(frameSeconds)) return null;

      const rect = element.getBoundingClientRect();
      return {
        position:
          window.scrollY +
          rect.top +
          Math.min(rect.height * 0.5, window.innerHeight * 0.68),
        normalizedTime: clamp(frameSeconds / FALLBACK_DURATION_SECONDS),
        scene: element.dataset.koiScene ?? "scene",
      };
    })
    .filter((cue): cue is SceneCue => cue !== null)
    .sort((left, right) => left.position - right.position);
}

/* Each content scene owns a real still frame. The first and final thirds of
   the distance between scenes are stagnant reading zones. Only the middle
   third advances the film, producing a deliberate speed ramp between plates. */
function mapScrollToSceneTime(
  focusPosition: number,
  cues: SceneCue[],
  duration: number,
): SceneTime {
  if (cues.length === 0) {
    return {
      time: (HERO_SETTLE_SECONDS / FALLBACK_DURATION_SECONDS) * duration,
      ramping: false,
      rampStrength: 0,
      scene: "hero",
    };
  }

  if (focusPosition <= cues[0].position) {
    return {
      time: cues[0].normalizedTime * duration,
      ramping: false,
      rampStrength: 0,
      scene: cues[0].scene,
    };
  }

  for (let index = 0; index < cues.length - 1; index += 1) {
    const current = cues[index];
    const next = cues[index + 1];
    if (focusPosition > next.position) continue;

    const span = Math.max(next.position - current.position, 1);
    const localProgress = clamp((focusPosition - current.position) / span);

    if (localProgress <= RAMP_START) {
      return {
        time: current.normalizedTime * duration,
        ramping: false,
        rampStrength: 0,
        scene: current.scene,
      };
    }
    if (localProgress >= RAMP_END) {
      return {
        time: next.normalizedTime * duration,
        ramping: false,
        rampStrength: 0,
        scene: next.scene,
      };
    }

    const rampProgress =
      (localProgress - RAMP_START) / (RAMP_END - RAMP_START);
    const eased = smooth(rampProgress);
    const normalizedTime =
      current.normalizedTime +
      (next.normalizedTime - current.normalizedTime) * eased;

    return {
      time: normalizedTime * duration,
      ramping: true,
      rampStrength: Math.sin(Math.PI * rampProgress),
      scene: rampProgress < 0.5 ? current.scene : next.scene,
    };
  }

  return {
    time: cues[cues.length - 1].normalizedTime * duration,
    ramping: false,
    rampStrength: 0,
    scene: cues[cues.length - 1].scene,
  };
}

function getDuoOpacity(section: HTMLElement) {
  const rect = section.getBoundingClientRect();
  const viewportHeight = Math.max(window.innerHeight, 1);
  const entering = clamp(
    (viewportHeight * 0.92 - rect.top) / (viewportHeight * 0.62),
  );
  const leaving = clamp(
    (rect.bottom - viewportHeight * 0.12) / (viewportHeight * 0.62),
  );
  return smooth(entering) * smooth(leaving);
}

function setVisualVariables(
  root: HTMLElement,
  progress: number,
  speedStrength: number,
  rampStrength: number,
  duoOpacity: number,
) {
  root.style.setProperty("--koi-scroll-progress", progress.toFixed(5));
  root.style.setProperty(
    "--koi-scroll-progress-percent",
    `${(progress * 100).toFixed(3)}%`,
  );
  root.style.setProperty("--koi-scroll-speed", speedStrength.toFixed(4));
  root.style.setProperty("--koi-ramp-strength", rampStrength.toFixed(4));
  root.style.setProperty(
    "--koi-video-scale",
    (1.025 + speedStrength * 0.012).toFixed(5),
  );
  root.style.setProperty(
    "--koi-video-brightness",
    (0.55 + rampStrength * 0.08).toFixed(4),
  );
  root.style.setProperty(
    "--koi-heading-position",
    `${(28 + rampStrength * 42).toFixed(2)}%`,
  );
  root.style.setProperty(
    "--koi-heading-glow",
    `${(2 + rampStrength * 8).toFixed(2)}px`,
  );
  root.style.setProperty(
    "--koi-heading-glow-alpha",
    (0.02 + rampStrength * 0.14).toFixed(3),
  );
  root.style.setProperty(
    "--koi-accent-glow",
    `${(7 + rampStrength * 14).toFixed(2)}px`,
  );
  root.style.setProperty(
    "--koi-accent-glow-alpha",
    (0.08 + rampStrength * 0.42).toFixed(3),
  );
  root.style.setProperty(
    "--koi-plate-opacity",
    (0.46 + rampStrength * 0.12).toFixed(3),
  );
  root.style.setProperty("--koi-duo-opacity", duoOpacity.toFixed(4));
  root.style.setProperty(
    "--koi-single-opacity",
    (0.73 - duoOpacity * 0.32).toFixed(4),
  );
  root.style.setProperty(
    "--koi-duo-video-opacity",
    (duoOpacity * 0.74).toFixed(4),
  );
}

export default function ScrollKoiExperience() {
  const singleRef = useRef<HTMLVideoElement>(null);
  const duoRef = useRef<HTMLVideoElement>(null);
  const [motionMode, setMotionMode] = useState<MotionMode>("pending");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const chooseMode = () => {
      const connection = (navigator as NavigatorWithConnection).connection;
      setMotionMode(
        reducedMotion.matches || connection?.saveData ? "static" : "video",
      );
    };

    chooseMode();
    reducedMotion.addEventListener("change", chooseMode);
    return () => reducedMotion.removeEventListener("change", chooseMode);
  }, []);

  useEffect(() => {
    if (motionMode !== "video") return;

    const single = singleRef.current;
    const duo = duoRef.current;
    const root = single?.closest(".studio-site--koi") as HTMLElement | null;
    if (!single || !duo || !root) return;

    const duoSection = root.querySelector<HTMLElement>("[data-koi-duo]");
    let sceneCues = collectSceneCues(root);
    let animationFrame = 0;
    let lastFrameAt = performance.now();
    let lastScrollY = window.scrollY;
    let smoothedVelocity = 0;
    let currentTime = single.currentTime || 0;
    let continuityOffset = 0;
    let lastSeekAt = 0;
    let hasScrolled = window.scrollY > 4;
    let scrollInitialized = false;
    let introComplete = false;

    const durationOf = (video: HTMLVideoElement) =>
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : FALLBACK_DURATION_SECONDS;

    const refreshSceneCues = () => {
      sceneCues = collectSceneCues(root);
    };

    const startHeroMotion = () => {
      if (hasScrolled || introComplete || document.hidden) return;
      single.muted = true;
      single.playbackRate = 0.65;
      void single.play().catch(() => {
        /* Autoplay can be denied by browser policy. Scroll scrubbing still
           works because it does not depend on play(). */
      });
    };

    const initializeScroll = (focusPosition: number) => {
      const duration = durationOf(single);
      currentTime = single.currentTime || 0;
      const mapped = mapScrollToSceneTime(focusPosition, sceneCues, duration);
      continuityOffset = currentTime - mapped.time;
      scrollInitialized = true;
      single.pause();
      duo.pause();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        single.pause();
        duo.pause();
      } else {
        startHeroMotion();
      }
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(refreshSceneCues);
    resizeObserver?.observe(root);
    window.addEventListener("resize", refreshSceneCues);

    const tick = (now: number) => {
      const elapsedMs = clamp(now - lastFrameAt, 1, 64);
      const scrollY = window.scrollY;
      const scrollDelta = scrollY - lastScrollY;
      const rawVelocity = scrollDelta / elapsedMs;
      const velocityBlend = clamp(elapsedMs / 90);
      smoothedVelocity += (rawVelocity - smoothedVelocity) * velocityBlend;

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = clamp(scrollY / maxScroll);
      const focusPosition = scrollY + window.innerHeight * 0.5;
      const speedStrength = clamp(Math.abs(smoothedVelocity) / 2.2);
      let rampStrength = 0;

      if (!hasScrolled && Math.abs(scrollY) > 4) {
        hasScrolled = true;
        initializeScroll(focusPosition);
      }

      if (!hasScrolled) {
        const duration = durationOf(single);
        const heroEnd = Math.min(HERO_SETTLE_SECONDS, duration - 0.08);
        if (
          single.readyState >= single.HAVE_METADATA &&
          single.currentTime >= heroEnd
        ) {
          single.pause();
          single.currentTime = heroEnd;
          currentTime = heroEnd;
          introComplete = true;
        }
        root.dataset.koiScene = "hero";
        root.style.setProperty("--koi-ramping", "0");
      } else {
        if (!scrollInitialized) initializeScroll(focusPosition);

        single.pause();
        duo.pause();

        const duration = durationOf(single);
        const mapped = mapScrollToSceneTime(
          focusPosition,
          sceneCues,
          duration,
        );
        const targetTime = mapped.time + continuityOffset;
        rampStrength = mapped.rampStrength;
        root.dataset.koiScene = mapped.scene;
        root.style.setProperty("--koi-ramping", mapped.ramping ? "1" : "0");

        const elapsedSeconds = elapsedMs / 1000;
        const response = mapped.ramping
          ? 8 + speedStrength * 24
          : 5 + speedStrength * 8;
        const catchUp = 1 - Math.exp(-response * elapsedSeconds);
        currentTime += (targetTime - currentTime) * catchUp;
        continuityOffset *= Math.exp(-3.2 * elapsedSeconds);

        const safeSingleTime = clamp(currentTime, 0, duration - 0.04);
        if (now - lastSeekAt >= 28) {
          if (
            single.readyState >= single.HAVE_METADATA &&
            Math.abs(single.currentTime - safeSingleTime) > 0.012
          ) {
            single.currentTime = safeSingleTime;
          }

          if (duo.readyState >= duo.HAVE_METADATA) {
            const duoDuration = durationOf(duo);
            const synchronizedDuoTime = clamp(
              (safeSingleTime / duration) * duoDuration,
              0,
              duoDuration - 0.04,
            );
            if (Math.abs(duo.currentTime - synchronizedDuoTime) > 0.012) {
              duo.currentTime = synchronizedDuoTime;
            }
          }
          lastSeekAt = now;
        }
      }

      const duoOpacity = duoSection ? getDuoOpacity(duoSection) : 0;
      setVisualVariables(
        root,
        progress,
        speedStrength,
        rampStrength,
        duoOpacity,
      );

      lastScrollY = scrollY;
      lastFrameAt = now;
      animationFrame = window.requestAnimationFrame(tick);
    };

    single.addEventListener("loadedmetadata", startHeroMotion);
    document.addEventListener("visibilitychange", handleVisibility);
    if (single.readyState >= single.HAVE_METADATA) startHeroMotion();
    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", refreshSceneCues);
      single.removeEventListener("loadedmetadata", startHeroMotion);
      document.removeEventListener("visibilitychange", handleVisibility);
      single.pause();
      duo.pause();
      delete root.dataset.koiScene;
      root.style.removeProperty("--koi-scroll-progress");
      root.style.removeProperty("--koi-scroll-progress-percent");
      root.style.removeProperty("--koi-scroll-speed");
      root.style.removeProperty("--koi-ramp-strength");
      root.style.removeProperty("--koi-ramping");
      root.style.removeProperty("--koi-video-scale");
      root.style.removeProperty("--koi-video-brightness");
      root.style.removeProperty("--koi-heading-position");
      root.style.removeProperty("--koi-heading-glow");
      root.style.removeProperty("--koi-heading-glow-alpha");
      root.style.removeProperty("--koi-accent-glow");
      root.style.removeProperty("--koi-accent-glow-alpha");
      root.style.removeProperty("--koi-plate-opacity");
      root.style.removeProperty("--koi-duo-opacity");
      root.style.removeProperty("--koi-single-opacity");
      root.style.removeProperty("--koi-duo-video-opacity");
    };
  }, [motionMode]);

  return (
    <div
      className="studio-scroll-koi"
      data-motion={motionMode}
      data-ready={ready ? "true" : "false"}
      aria-hidden="true"
    >
      <div className="studio-scroll-koi__poster" />
      {motionMode === "video" ? (
        <>
          <video
            ref={singleRef}
            className="studio-scroll-koi__video studio-scroll-koi__video--single"
            muted
            playsInline
            preload="auto"
            poster="/brand/koinophobia-labs-koi.webp"
            tabIndex={-1}
            onCanPlay={() => setReady(true)}
          >
            <source src={SINGLE_KOI_SRC} type="video/mp4" />
          </video>
          <video
            ref={duoRef}
            className="studio-scroll-koi__video studio-scroll-koi__video--duo"
            muted
            playsInline
            preload="auto"
            poster="/brand/koinophobia-labs-koi.webp"
            tabIndex={-1}
          >
            <source src={DUO_KOI_SRC} type="video/mp4" />
          </video>
        </>
      ) : null}
      <div className="studio-scroll-koi__depth" />
      <div className="studio-scroll-koi__vignette" />
      <div className="studio-scroll-koi__progress" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
