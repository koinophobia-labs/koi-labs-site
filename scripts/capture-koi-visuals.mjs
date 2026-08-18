import fs from "node:fs";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pageTarget() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const targets = await fetch("http://127.0.0.1:9222/json/list").then((r) => r.json());
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {}
    await wait(250);
  }
  throw new Error("Chrome DevTools page target never became available");
}

const target = await pageTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(message.error.message));
  else waiter.resolve(message.result ?? {});
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", () => reject(new Error("DevTools socket failed")), { once: true });
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? "Browser evaluation failed");
  return response.result?.value;
};

const waitFor = async (expression, label) => {
  for (let i = 0; i < 120; i += 1) {
    if (await evaluate(expression)) return;
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

fs.mkdirSync("artifacts/koi-visuals", { recursive: true });
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://127.0.0.1:3000/" });
await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('.koi-final'))", "final koi homepage");
await waitFor("document.querySelector('.studio-scroll-koi')?.dataset.ready === 'true'", "final koi video");
await wait(3400);

const architecture = await evaluate(`(() => ({
  products: document.querySelectorAll('.koi-final__product').length,
  scenes: document.querySelectorAll('[data-final-scene]').length,
  followParts: document.querySelectorAll('[data-follow-part]').length,
  activeScene: document.querySelector('[data-final-scene][data-follow-active="true"]')?.dataset.finalScene,
  legacy: Boolean(document.querySelector('.studio-problem-grid, .studio-pricing-grid, .studio-product-grid, .studio-trust')),
  companion: document.querySelector('.koi-companion') ? getComputedStyle(document.querySelector('.koi-companion')).display : 'none',
  opacity: Number.parseFloat(getComputedStyle(document.querySelector('.studio-scroll-koi__video--single')).opacity),
  heroOpacity: Number.parseFloat(getComputedStyle(document.querySelector('.koi-final__copy--hero h1')).opacity),
}))()`);
if (
  architecture.products !== 3 ||
  architecture.scenes !== 5 ||
  architecture.followParts < 15 ||
  architecture.activeScene !== "hero" ||
  architecture.legacy ||
  architecture.companion !== "none" ||
  architecture.opacity < .7 ||
  architecture.heroOpacity < .6
) {
  throw new Error(`Invalid final koi architecture: ${JSON.stringify(architecture)}`);
}

const capture = async (name) => {
  const image = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  fs.writeFileSync(`artifacts/koi-visuals/${name}.png`, Buffer.from(image.data, "base64"));
};

const depthState = () => evaluate(`(() => {
  const root = document.querySelector('.studio-site--koi');
  const depth = document.querySelector('.studio-koi-depth-pass');
  if (!root || !depth) return null;
  const style = getComputedStyle(depth);
  return { scene: root.dataset.koiScene, opacity: Number.parseFloat(style.opacity), zIndex: style.zIndex };
})()`);

const assertDepth = (scene, state, visible) => {
  if (!state || state.zIndex !== "3") throw new Error(`${scene}: invalid depth pass`);
  if (visible && state.opacity < .05) throw new Error(`${scene}: depth pass is hidden`);
  if (!visible && state.opacity > .01) throw new Error(`${scene}: depth pass should be hidden`);
};

const settleAtHold = async (scene) => {
  const found = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const section = document.querySelector('[data-final-scene="${scene}"]');
    if (!section) return false;
    const top = window.scrollY + section.getBoundingClientRect().top;
    const travel = Math.max(section.getBoundingClientRect().height - window.innerHeight, 1);
    window.scrollTo(0, top + travel * .5);
    return true;
  })()`);
  if (!found) throw new Error(`Missing scene: ${scene}`);

  for (let attempt = 0; attempt < 14; attempt += 1) {
    await wait(140);
    const state = await evaluate(`(() => {
      const section = document.querySelector('[data-final-scene="${scene}"]');
      if (!section) return null;
      const progress = Number.parseFloat(
        getComputedStyle(section).getPropertyValue('--follow-progress') || '0',
      );
      const travel = Math.max(section.getBoundingClientRect().height - window.innerHeight, 1);
      return { progress, correction: (.5 - progress) * travel };
    })()`);
    if (!state) throw new Error(`Missing scene state: ${scene}`);
    if (Math.abs(state.progress - .5) <= .012) break;
    await evaluate(`window.scrollBy(0, ${Number(state.correction).toFixed(3)})`);
  }

  await waitFor(`document.querySelector('.studio-site--koi')?.dataset.koiScene === '${scene}'`, `${scene} activation`);
  await waitFor(`document.querySelector('[data-final-scene="${scene}"]')?.dataset.followActive === 'true'`, `${scene} information hold`);
  await wait(850);
};

const assertVisible = async (scene, selectors) => {
  const state = await evaluate(`(() => {
    const section = document.querySelector('[data-final-scene="${scene}"]');
    const progress = section
      ? Number.parseFloat(getComputedStyle(section).getPropertyValue('--follow-progress') || '0')
      : -1;
    const items = ${JSON.stringify(selectors)}.map((selector) => {
      const element = document.querySelector(selector);
      if (!element) return { selector, missing: true };
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        selector,
        missing: false,
        opacity: Number.parseFloat(style.opacity),
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      };
    });
    return { progress, items };
  })()`);

  if (!state || Math.abs(state.progress - .5) > .025) {
    throw new Error(`${scene}: failed to reach stagnant hold: ${JSON.stringify(state)}`);
  }

  for (const item of state.items) {
    if (
      item.missing ||
      item.opacity < .72 ||
      item.bottom <= 76 ||
      item.top >= 875 ||
      item.right <= 0 ||
      item.left >= 1440
    ) {
      throw new Error(`${scene}: important information is not visible: ${JSON.stringify(state)}`);
    }
  }
  console.log(`${scene} hold:`, JSON.stringify(state));
};

assertDepth("hero", await depthState(), true);
await assertVisible("hero", [".koi-final__copy--hero h1", ".koi-final__hero-line"]);
await capture("01-final-koi-hero");

await settleAtHold("products");
await assertVisible("products", [
  ".koi-final__products-heading",
  ".koi-final__product--1 article",
  ".koi-final__product--2 article",
  ".koi-final__product--3 article",
]);
assertDepth("products", await depthState(), false);
await capture("02-final-product-constellation");

await settleAtHold("systems");
await assertVisible("systems", [
  ".koi-final__copy--systems h2",
  ".koi-final__copy--systems .koi-final__body",
  ".koi-final__service-current",
]);
assertDepth("systems", await depthState(), true);
await capture("03-final-systems-follow");

await settleAtHold("start");
await assertVisible("start", [
  ".koi-final__copy--start h2",
  ".koi-final__copy--start .koi-final__body",
  ".koi-final__founder",
  ".koi-final__copy--start .koi-final__actions",
]);
assertDepth("start", await depthState(), true);
await capture("04-final-start-destination");

socket.close();
