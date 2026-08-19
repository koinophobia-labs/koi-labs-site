"use client";

import { useEffect, useRef } from "react";

/**
 * WaterText — makes the words live in the water.
 *
 * Every word of the copy inside this wrapper is split into its own element so
 * it can:
 *   - flow in on a current when its destination becomes active (a light-wipe
 *     that carries the words up out of the dark, word by word),
 *   - drift continuously as if suspended in moving water,
 *   - part and displace when the koi's wake passes near it.
 *
 * It reads two signals off the page root:
 *   [data-koi-destination]  — which destination is active (drives flow-in)
 *   --koi-surge / --koi-x   — the koi's motion (drives displacement)
 *
 * No text is baked into anything; this only wraps existing real HTML, so it
 * stays selectable, accessible and SEO-visible. Reduced motion skips all of it.
 */
export default function WaterText() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const shell = document.querySelector<HTMLElement>(".kw");
    if (!shell) return;

    // Only display type lives in the water. Body copy, ledes, kickers and
    // labels read as ordinary text — the signature effect is reserved for the
    // headlines, so reading never has to fight the ocean.
    const SELECTOR = ".dest__inner h1, .dest__inner h2";

    const wrapWords = (el: HTMLElement) => {
      if (el.dataset.watered === "true") return;
      el.dataset.watered = "true";
      const text = el.textContent ?? "";
      const words = text.split(/(\s+)/);
      el.textContent = "";
      let wi = 0;
      for (const chunk of words) {
        if (/^\s+$/.test(chunk)) {
          el.appendChild(document.createTextNode(chunk));
          continue;
        }
        if (!chunk) continue;
        const span = document.createElement("span");
        span.className = "kw-word";
        span.textContent = chunk;
        span.style.setProperty("--w", String(wi));
        // A stable per-word phase so the suspension drift is organic, not uniform.
        span.style.setProperty("--phase", ((wi * 137.5) % 360).toFixed(0));
        el.appendChild(span);
        wi += 1;
      }
      el.style.setProperty("--words", String(wi));
    };

    document.querySelectorAll<HTMLElement>(".dest").forEach((section) => {
      section
        .querySelectorAll<HTMLElement>(SELECTOR)
        .forEach((el) => wrapWords(el));
    });

    // The per-destination flow states (form / lock / release / out) and the
    // per-section --koi-reveal are written by the KoiWorld loop itself, which
    // is the only code that knows where every destination sits each frame.
  }, []);

  return null;
}
