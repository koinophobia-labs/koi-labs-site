"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { preload } from "react-dom";

const ASSET = "/brand/koinophobia-labs-koi.webp";
const ASSET_SMALL = "/brand/koinophobia-labs-koi-640.webp";
const SRCSET = `${ASSET_SMALL} 640w, ${ASSET} 1120w`;
const SIZES = "(max-width: 640px) 82vw, (max-width: 1024px) 60vw, min(42vw, 560px)";

type Phase = "boot" | "enter" | "live" | "exit" | "done";

/* One timeline, one clock. Every phase is scheduled up front from the same
   start instant — no chained or re-entrant timers. */
const TIMELINE: ReadonlyArray<readonly [Phase, number]> = [
  ["enter", 0],
  ["live", 850],
  ["exit", 1950],
  ["done", 2800],
];
const REDUCED_TIMELINE: ReadonlyArray<readonly [Phase, number]> = [
  ["enter", 0],
  ["exit", 1000],
  ["done", 1600],
];
/* If the emblem hasn't decoded by then, skip the intro instead of animating
   a blank overlay. */
const ASSET_WAIT_CAP_MS = 1400;
/* Absolute kill switch: the overlay can never outlive this, whatever happens. */
const FAILSAFE_MS = 6000;

export default function BrandIntro() {
  const pathname = usePathname();
  const skipForImmediateAccess =
    pathname === "/trendi/privacy" || pathname === "/trendi/support";
  const [phase, setPhase] = useState<Phase>("boot");
  const imgRef = useRef<HTMLImageElement>(null);
  const startedRef = useRef(false);

  if (!skipForImmediateAccess) {
    preload(ASSET, {
      as: "image",
      imageSrcSet: SRCSET,
      imageSizes: SIZES,
      fetchPriority: "high",
    });
  }

  useEffect(() => {
    if (skipForImmediateAccess) return;
    const timers: number[] = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      for (const [next, at] of reduced ? REDUCED_TIMELINE : TIMELINE) {
        timers.push(window.setTimeout(() => setPhase(next), at));
      }
    };
    /* Skipping still routes through "exit" so the black backdrop dissolves
       into the page instead of hard-cutting. */
    const skip = () => {
      startedRef.current = true;
      setPhase("exit");
      timers.push(window.setTimeout(() => setPhase("done"), 950));
    };

    const img = imgRef.current;
    if (!img || (img.complete && img.naturalWidth === 0)) {
      skip();
    } else if (img.complete) {
      start();
    } else {
      img.addEventListener("load", start, { once: true });
      img.addEventListener("error", skip, { once: true });
      timers.push(
        window.setTimeout(() => {
          if (!startedRef.current) skip();
        }, ASSET_WAIT_CAP_MS),
      );
    }

    const failsafe = window.setTimeout(() => setPhase("done"), FAILSAFE_MS);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(failsafe);
      img?.removeEventListener("load", start);
      img?.removeEventListener("error", skip);
      startedRef.current = false;
    };
  }, [skipForImmediateAccess]);

  if (skipForImmediateAccess || phase === "done") return null;

  return (
    <div className="brand-intro" data-phase={phase} aria-hidden="true">
      <div className="brand-intro__backdrop" />
      <div className="brand-intro__stage">
        <div className="brand-intro__motion">
          {/* Static, pre-optimized brand asset with an explicit srcset;
              next/image optimization would only re-encode it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            className="brand-intro__emblem"
            src={ASSET}
            srcSet={SRCSET}
            sizes={SIZES}
            width={1120}
            height={1120}
            alt=""
            decoding="async"
            fetchPriority="high"
            draggable={false}
          />
          <div className="brand-intro__sweep" />
          <div className="brand-intro__pulse" />
        </div>
      </div>
    </div>
  );
}
