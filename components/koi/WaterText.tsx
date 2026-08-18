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

    // Only the reading copy flows — not labels, buttons, or nav.
    const SELECTOR =
      ".dest__inner h1, .dest__inner h2, .dest__inner .kw__lede, .dest__inner > div > p, .kw__kicker";

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

    const sections = new Map<string, HTMLElement>();
    document.querySelectorAll<HTMLElement>(".dest").forEach((section) => {
      const id = section.id;
      if (id) sections.set(id, section);
      section
        .querySelectorAll<HTMLElement>(SELECTOR)
        .forEach((el) => wrapWords(el));
    });

    // The active destination's words form as the visitor scrolls in (driven by
    // the live --koi-reveal the loop writes), lock stable through the reading
    // hold, then release as they scroll on. Inactive sections park "out".
    //   form    — arriving: words assembling on the current
    //   lock     — holding: fully formed, pinned stable, drift stilled
    //   release  — departing: words letting go as the koi moves on
    // Reverse scroll walks the same states backwards in exact step.
    let activeId = shell.dataset.koiDestination ?? "";
    let phase = shell.dataset.koiPhase ?? "arrive";
    const phaseToFlow = (p: string) =>
      p === "hold" ? "lock" : p === "depart" ? "release" : "form";
    const apply = () => {
      const flow = phaseToFlow(phase);
      for (const [sid, section] of sections) {
        section.dataset.flow = sid === activeId ? flow : "out";
      }
    };
    apply();

    const observer = new MutationObserver(() => {
      const nextId = shell.dataset.koiDestination ?? "";
      const nextPhase = shell.dataset.koiPhase ?? "arrive";
      if (nextId !== activeId || nextPhase !== phase) {
        activeId = nextId;
        phase = nextPhase;
        apply();
      }
    });
    observer.observe(shell, {
      attributes: true,
      attributeFilter: ["data-koi-destination", "data-koi-phase"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
