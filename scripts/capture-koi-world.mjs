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

socket.close();
