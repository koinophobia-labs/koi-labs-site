import fs from "node:fs";
import { setTimeout as wait } from "node:timers/promises";

const outputDirectory = "artifacts/koi-visuals";
const destinations = [
  ["enter", "01-koi-world-enter.png"],
  ["products", "02-product-constellation.png"],
  ["systems", "03-systems.png"],
  ["work", "04-work.png"],
  ["founder", "05-founder.png"],
  ["start", "06-final-koi-contact.png"],
];

fs.mkdirSync(outputDirectory, { recursive: true });

async function pageTarget() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const targets = await fetch("http://127.0.0.1:9222/json/list").then(
        (response) => response.json(),
      );
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome can take a moment to publish its debugging target.
    }
    await wait(250);
  }
  throw new Error("Chrome did not expose a page target on port 9222.");
}

const socket = new WebSocket(await pageTarget());
const pending = new Map();
let sequence = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  sequence += 1;
  return new Promise((resolve, reject) => {
    pending.set(sequence, { resolve, reject });
    socket.send(JSON.stringify({ id: sequence, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text ??
        "Page evaluation failed.",
    );
  }
  return result.result.value;
}

async function waitFor(expression, label, timeout = 20_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function capture(filename) {
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  fs.writeFileSync(
    `${outputDirectory}/${filename}`,
    Buffer.from(screenshot.data, "base64"),
  );
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://127.0.0.1:3000/" });
await waitFor(
  `document.readyState === "complete" && document.querySelector(".kw")?.dataset.koiReady === "true"`,
  "the current koi world to initialize",
);
await wait(900);

const architecture = await evaluate(`(() => {
  const shell = document.querySelector(".kw");
  const destinationIds = [...document.querySelectorAll("main .dest")].map(
    (section) => section.id,
  );
  return {
    ready: shell?.dataset.koiReady,
    motion: document.querySelector(".koi-world")?.dataset.motion,
    destinationIds,
    primaryLinks: document.querySelectorAll(".kw__nav [data-koi-link]").length,
    journeyLinks: document.querySelectorAll(".kw__map [data-koi-link]").length,
    productNodes: document.querySelectorAll(".kw__constellation > a").length,
    hasWater: Boolean(document.querySelector(".koi-world__water")),
    hasStage: Boolean(document.querySelector(".koi-world__stage")),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
})()`);

const expectedIds = destinations.map(([id]) => id);
if (
  architecture.ready !== "true" ||
  architecture.motion !== "cinematic" ||
  JSON.stringify(architecture.destinationIds) !== JSON.stringify(expectedIds) ||
  architecture.primaryLinks !== expectedIds.length ||
  architecture.journeyLinks !== expectedIds.length ||
  architecture.productNodes !== 4 ||
  !architecture.hasWater ||
  !architecture.hasStage ||
  architecture.overflow
) {
  throw new Error(
    `The rendered koi-world architecture is incomplete: ${JSON.stringify(architecture)}`,
  );
}

for (const [id, filename] of destinations) {
  await evaluate(`(() => {
    const section = document.getElementById(${JSON.stringify(id)});
    if (!section) throw new Error("Destination not found");
    const top = section.getBoundingClientRect().top + window.scrollY;
    const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: top + travel * 0.46, behavior: "instant" });
  })()`);
  await waitFor(
    `document.querySelector(".kw")?.dataset.koiDestination === ${JSON.stringify(id)}`,
    `destination ${id} to become current`,
  );
  await wait(900);

  const scene = await evaluate(`(() => {
    const section = document.getElementById(${JSON.stringify(id)});
    const content = section?.querySelector(".dest__inner");
    const heading = content?.querySelector("h1, h2");
    const headingRect = heading?.getBoundingClientRect();
    const currentLinks = [
      ...document.querySelectorAll('[data-koi-link][aria-current="location"]'),
    ].map((link) => link.dataset.koiLink);
    const mapTargets = [...document.querySelectorAll(".kw__map [data-koi-link]")];
    return {
      active: document.querySelector(".kw")?.dataset.koiDestination,
      phase: document.querySelector(".kw")?.dataset.koiPhase,
      contentOpacity: content ? Number(getComputedStyle(content).opacity) : 0,
      pointerEvents: content ? getComputedStyle(content).pointerEvents : "none",
      headingVisible: Boolean(
        headingRect &&
          headingRect.width > 0 &&
          headingRect.height > 0 &&
          headingRect.bottom > 80 &&
          headingRect.top < window.innerHeight - 40
      ),
      currentLinks,
      mapTargetsAccessible: mapTargets.every(
        (link) => link.getBoundingClientRect().height >= 44,
      ),
      clips: document.querySelectorAll(".koi-world__clip[data-koi-clip]").length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  })()`);

  if (
    scene.active !== id ||
    !["arrive", "hold", "depart"].includes(scene.phase) ||
    scene.contentOpacity < 0.7 ||
    scene.pointerEvents === "none" ||
    !scene.headingVisible ||
    scene.currentLinks.length !== 2 ||
    scene.currentLinks.some((link) => link !== id) ||
    !scene.mapTargetsAccessible ||
    scene.clips < 1 ||
    scene.overflow
  ) {
    throw new Error(
      `Destination ${id} failed its visual smoke state: ${JSON.stringify(scene)}`,
    );
  }

  await capture(filename);
}

await evaluate(`window.scrollTo({ top: 0, behavior: "instant" })`);
await waitFor(
  `document.querySelector(".kw")?.dataset.koiDestination === "enter"`,
  "reverse scrolling to restore the opening destination",
);

const frameCases = [
  { name: "small phone", width: 375, height: 667, mobile: true },
  { name: "landscape tablet", width: 900, height: 600, mobile: false },
  { name: "short laptop", width: 1280, height: 720, mobile: false },
  { name: "true ultrawide", width: 3440, height: 1440, mobile: false },
];

for (const frame of frameCases) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: frame.width,
    height: frame.height,
    deviceScaleFactor: 1,
    mobile: frame.mobile,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:3000/" });
  await waitFor(
    `document.readyState === "complete" && document.querySelector(".kw")?.dataset.koiReady === "true"`,
    `${frame.name} koi world to initialize`,
  );
  await wait(500);

  const chrome = await evaluate(`(() => {
    const masthead = document.querySelector(".kw__masthead")?.getBoundingClientRect();
    const map = document.querySelector(".kw__map")?.getBoundingClientRect();
    const nav = document.querySelector(".kw__nav");
    const labels = [...document.querySelectorAll(".kw__map-label")];
    const wideShell = document.querySelector("#start .dest__inner")?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      navDisplay: nav ? getComputedStyle(nav).display : "missing",
      mapInsideFrame: Boolean(
        map && map.left >= -1 && map.right <= innerWidth + 1 && map.top >= -1 && map.bottom <= innerHeight + 1
      ),
      mapClearsMasthead: Boolean(map && masthead && map.top >= masthead.bottom - 1),
      labelsHidden: labels.every((label) => getComputedStyle(label).display === "none"),
      shellWidthRatio: wideShell ? wideShell.width / innerWidth : 0,
    };
  })()`);

  if (
    chrome.overflow ||
    !chrome.mapInsideFrame ||
    (frame.width <= 1024 && (chrome.navDisplay !== "none" || !chrome.mapClearsMasthead)) ||
    (frame.width > 1024 && frame.width <= 1320 && !chrome.labelsHidden) ||
    (frame.width >= 2800 && chrome.shellWidthRatio < 0.48)
  ) {
    throw new Error(
      `${frame.name} chrome escaped or obscured the frame: ${JSON.stringify(chrome)}`,
    );
  }

  const sectionIds = frame.width >= 2800
    ? destinations.map(([id]) => id)
    : ["products", "systems"];
  for (const id of sectionIds) {
    await evaluate(`document.getElementById(${JSON.stringify(id)})?.scrollIntoView({ block: "start", behavior: "instant" })`);
    await wait(200);

    const landing = await evaluate(`(() => {
      const section = document.getElementById(${JSON.stringify(id)});
      const heading = section?.querySelector("h1, h2")?.getBoundingClientRect();
      const masthead = document.querySelector(".kw__masthead")?.getBoundingClientRect();
      const map = document.querySelector(".kw__map")?.getBoundingClientRect();
      const intersects = (a, b) => Boolean(
        a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      );
      return {
        headingInFrame: Boolean(
          heading && heading.left >= -1 && heading.right <= innerWidth + 1 &&
          heading.top >= -1 && heading.bottom <= innerHeight + 1
        ),
        headingObscured: intersects(heading, masthead) || intersects(heading, map),
        stagePosition: section ? getComputedStyle(section.querySelector(".dest__stage")).position : "missing",
      };
    })()`);

    const expectedStage = frame.width <= 1024 || (id === "systems" && frame.height <= 760)
      ? ["static", "relative"]
      : ["sticky"];
    if (
      !landing.headingInFrame ||
      landing.headingObscured ||
      !expectedStage.includes(landing.stagePosition)
    ) {
      throw new Error(
        `${frame.name} ${id} landing escaped the frame: ${JSON.stringify(landing)}`,
      );
    }

    const controls = await evaluate(`(async () => {
      const nodes = [...document.querySelectorAll(${JSON.stringify(`#${id} .dest__inner a, #${id} .dest__inner button`)})];
      const masthead = document.querySelector(".kw__masthead")?.getBoundingClientRect();
      const map = document.querySelector(".kw__map")?.getBoundingClientRect();
      const intersects = (a, b) => Boolean(
        a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      );
      const results = [];
      for (const node of nodes) {
        node.scrollIntoView({ block: "center", behavior: "instant" });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const rect = node.getBoundingClientRect();
        results.push({
          text: node.textContent?.trim().replace(/\\s+/g, " ").slice(0, 60),
          inFrame: rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
          obscured: intersects(rect, masthead) || intersects(rect, map),
        });
      }
      return results;
    })()`);

    if (controls.some((control) => !control.inFrame || control.obscured)) {
      throw new Error(
        `${frame.name} ${id} controls escaped the frame: ${JSON.stringify(controls)}`,
      );
    }

    if (frame.width <= 1024 || frame.width >= 2800) {
      await evaluate(`(() => {
        const section = document.getElementById(${JSON.stringify(id)});
        const top = section.getBoundingClientRect().top + window.scrollY;
        const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
        window.scrollTo({ top: top + travel * 0.46, behavior: "instant" });
      })()`);
      await waitFor(
        `document.querySelector(".kw")?.dataset.koiDestination === ${JSON.stringify(id)}`,
        `${frame.name} ${id} scene to become current`,
      );
      await wait(300);

      const sceneVisibility = await evaluate(`(() => {
        const clips = [...document.querySelectorAll(".koi-world__clip[data-koi-clip]")]
          .sort((a, b) => Number(getComputedStyle(b).opacity) - Number(getComputedStyle(a).opacity));
        const rect = clips[0]?.getBoundingClientRect();
        if (!rect) return 0;
        const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
        const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
        return (width * height) / Math.max(rect.width * rect.height, 1);
      })()`);
      if (sceneVisibility < 0.72) {
        throw new Error(
          `${frame.name} ${id} scene is over-clipped: ${sceneVisibility.toFixed(3)}`,
        );
      }
    }
  }
}

socket.close();
