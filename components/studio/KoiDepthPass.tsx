"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const SINGLE_KOI_PRIMARY =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3HhOHQGL0oXayVyXOmPdMu1Mdi2/hf_20260817_180806_9199e09c-1519-4fea-b7d8-c115f41cbe92.mp4";
const SINGLE_KOI_FALLBACK = "/brand/koi-scroll-single.mp4";

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

export default function KoiDepthPass() {
  const pathname = usePathname();
  const depthVideoRef = useRef<HTMLVideoElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const chooseHost = () => {
      const connection = (navigator as NavigatorWithConnection).connection;
      setHost(
        reducedMotion.matches || connection?.saveData
          ? null
          : document.querySelector<HTMLElement>(".koi-world--finished"),
      );
    };

    chooseHost();
    reducedMotion.addEventListener("change", chooseHost);
    return () => reducedMotion.removeEventListener("change", chooseHost);
  }, [pathname]);

  useEffect(() => {
    if (!host) return;

    const depthVideo = depthVideoRef.current;
    if (!depthVideo) return;

    let animationFrame = 0;
    let lastSeekAt = 0;

    const syncDepthFrame = (now: number) => {
      const sourceVideo = host.querySelector<HTMLVideoElement>(
        ".studio-scroll-koi__video--single",
      );
      const depthPassVisible = host.dataset.koiScene !== "products";

      if (
        depthPassVisible &&
        document.visibilityState === "visible" &&
        sourceVideo &&
        sourceVideo.readyState >= sourceVideo.HAVE_METADATA &&
        depthVideo.readyState >= depthVideo.HAVE_METADATA
      ) {
        const sourceDuration = Number.isFinite(sourceVideo.duration)
          ? sourceVideo.duration
          : 15;
        const depthDuration = Number.isFinite(depthVideo.duration)
          ? depthVideo.duration
          : sourceDuration;
        const normalizedTime =
          sourceDuration > 0 ? sourceVideo.currentTime / sourceDuration : 0;
        const targetTime = Math.min(
          Math.max(normalizedTime * depthDuration, 0),
          Math.max(depthDuration - 0.04, 0),
        );

        if (
          now - lastSeekAt >= 32 &&
          Math.abs(depthVideo.currentTime - targetTime) > 0.008
        ) {
          depthVideo.currentTime = targetTime;
          lastSeekAt = now;
        }
      }

      animationFrame = window.requestAnimationFrame(syncDepthFrame);
    };

    depthVideo.pause();
    animationFrame = window.requestAnimationFrame(syncDepthFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      depthVideo.pause();
    };
  }, [host]);

  if (!host) return null;

  return createPortal(
    <div className="studio-koi-depth-pass" aria-hidden="true">
      <div className="studio-koi-depth-pass__shadow" />
      <video
        ref={depthVideoRef}
        className="studio-koi-depth-pass__video"
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
      >
        <source src={SINGLE_KOI_PRIMARY} type="video/mp4" />
        <source src={SINGLE_KOI_FALLBACK} type="video/mp4" />
      </video>
      <div className="studio-koi-depth-pass__glass" />
    </div>,
    host,
  );
}
