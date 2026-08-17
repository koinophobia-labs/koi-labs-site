"use client";

import { useEffect } from "react";

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

const HOLD_START = 0.27;
const HOLD_END = 0.72;

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

export default function KoiNavigationMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".koi-world--finished");
    if (!root) return;

    const scenes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-koi-follow-scene]"),
    );
    const navigation = Array.from(
      root.querySelectorAll<HTMLElement>("[data-koi-nav]"),
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as NavigatorWithConnection).connection;
    const staticMode = reducedMotion.matches || Boolean(connection?.saveData);

    let animationFrame = 0;
    let lastScrollY = window.scrollY;
    let lastFrameAt = performance.now();
    let smoothedVelocity = 0;

    const render = (now: number) => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const viewportWidth = Math.max(window.innerWidth, 1);
      const elapsedMs = clamp(now - lastFrameAt, 1, 64);
      const scrollDelta = window.scrollY - lastScrollY;
      const velocity = scrollDelta / elapsedMs;
      smoothedVelocity +=
        (velocity - smoothedVelocity) * clamp(elapsedMs / 90);

      let activeScene: HTMLElement | null = null;
      let activeDistance = Number.POSITIVE_INFINITY;

      const sceneStates = scenes.map((scene, index) => {
        const rect = scene.getBoundingClientRect();
        const travel = Math.max(rect.height - viewportHeight, 1);
        const rawProgress = clamp(-rect.top / travel);
        const progress = index === 0 ? 0.5 + rawProgress * 0.5 : rawProgress;
        const distance = Math.abs(progress - 0.5);

        if (distance < activeDistance) {
          activeDistance = distance;
          activeScene = scene;
        }

        return { scene, progress };
      });

      sceneStates.forEach(({ scene, progress }, sceneIndex) => {
        const active = scene === activeScene;
        const side = scene.dataset.koiSide ?? "right";
        const direction = side === "left" ? -1 : side === "right" ? 1 : 0;
        const mobile = viewportWidth <= 760;
        const restX = mobile
          ? 0
          : direction * clamp(viewportWidth * 0.285, 290, 420);
        const verticalRatio = Number.parseFloat(scene.dataset.koiY ?? "0");
        const restY = mobile
          ? Math.min(viewportHeight * 0.24, 190)
          : verticalRatio * viewportHeight;
        const parts = Array.from(
          scene.querySelectorAll<HTMLElement>("[data-koi-follow]"),
        );

        scene.dataset.koiActive = active ? "true" : "false";
        scene.style.setProperty(
          "--koi-follow-wake-direction",
          String(direction || (sceneIndex % 2 === 0 ? 1 : -1)),
        );
        scene.style.setProperty(
          "--koi-follow-wake-opacity",
          active ? "0.34" : "0.07",
        );

        parts.forEach((part, partIndex) => {
          const lag = Math.min(partIndex * 0.032, 0.15);
          const localProgress = staticMode
            ? 0.5
            : clamp((progress - lag) / Math.max(1 - lag, 0.01));

          let x = restX;
          let y = restY + partIndex * 2;
          let opacity = active || staticMode ? 1 : 0;
          let rotation = 0;
          let scale = 1;
          let blur = 0;

          if (!staticMode && localProgress < HOLD_START) {
            const amount = smooth(localProgress / HOLD_START);
            x = lerp(direction * 28, restX, amount);
            y = lerp(92 + partIndex * 16, restY + partIndex * 2, amount);
            opacity = amount;
            rotation = lerp(direction * -8, 0, amount);
            scale = lerp(0.96, 1, amount);
            blur = lerp(9, 0, amount);
          } else if (!staticMode && localProgress > HOLD_END) {
            const amount = smooth(
              (localProgress - HOLD_END) / (1 - HOLD_END),
            );
            const departure =
              direction || (sceneIndex % 2 === 0 ? 1 : -1);
            x = lerp(restX, restX - departure * 230, amount);
            y = lerp(
              restY + partIndex * 2,
              restY - 110 - partIndex * 11,
              amount,
            );
            opacity = 1 - amount;
            rotation = lerp(0, departure * -7, amount);
            scale = lerp(1, 0.97, amount);
            blur = lerp(0, 7, amount);
          }

          part.style.opacity = opacity.toFixed(4);
          part.style.filter = `blur(${blur.toFixed(2)}px)`;
          part.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
            2,
          )}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(
            4,
          )})`;
        });
      });

      const activeSceneName = activeScene?.dataset.koiFollowScene ?? "hero";
      root.dataset.koiScene = activeSceneName;
      root.style.setProperty(
        "--koi-follow-speed",
        clamp(Math.abs(smoothedVelocity) / 2.2).toFixed(4),
      );

      navigation.forEach((item) => {
        const current = item.dataset.koiNav === activeSceneName;
        item.setAttribute("aria-current", current ? "true" : "false");
      });

      lastScrollY = window.scrollY;
      lastFrameAt = now;
    };

    const schedule = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(render);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete root.dataset.koiScene;
      root.style.removeProperty("--koi-follow-speed");
    };
  }, []);

  return null;
}
