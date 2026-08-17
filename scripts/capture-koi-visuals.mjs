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
  for (let i = 0; i < 60; i += 1) {
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
await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('.koi-world'))", "koi world");
await waitFor("document.querySelector('.studio-scroll-koi')?.dataset.ready === 'true'", "koi video");
await wait(3200);

const architecture = await evaluate(`(() => ({
  products: document.querySelectorAll('.koi-product-node').length,
  scenes: document.querySelectorAll('[data-koi-frame]').length,
  legacy: Boolean(document.querySelector('.studio-problem-grid, .studio-pricing-grid, .studio-product-grid, .studio-trust')),
  companion: document.querySelector('.koi-companion') ? getComputedStyle(document.querySelector('.koi-companion')).display : 'none',
  opacity: Number.parseFloat(getComputedStyle(document.querySelector('.studio-scroll-koi__video--single')).opacity),
}))()`);
if (architecture.products !== 3 || architecture.scenes !== 6 || architecture.legacy || architecture.companion !== "none" || architecture.opacity < .7) {
  throw new Error(`Invalid koi-world architecture: ${JSON.stringify(architecture)}`);
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

const go = async (scene) => {
  const found = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const section = document.querySelector('[data-koi-scene="${scene}"]');
    if (!section) return false;
    section.scrollIntoView({ block: 'center' });
    return true;
  })()`);
  if (!found) throw new Error(`Missing scene: ${scene}`);
  await waitFor(`document.querySelector('.studio-site--koi')?.dataset.koiScene === '${scene}'`, `${scene} activation`);
  await wait(1500);
};

assertDepth("hero", await depthState(), true);
await capture("01-koi-world-hero");
await go("products");
assertDepth("products", await depthState(), false);
await capture("02-product-constellation-two-koi");
await go("systems");
assertDepth("systems", await depthState(), true);
await capture("03-systems-around-the-koi");
await go("start");
assertDepth("start", await depthState(), true);
await capture("04-koi-portal");

socket.close();
