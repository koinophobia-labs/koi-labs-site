import fs from "node:fs";

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function findPageTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await fetch("http://127.0.0.1:9222/json/list").then(
        (response) => response.json(),
      );
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // Chrome may still be starting.
    }
    await delay(250);
  }
  throw new Error("Chrome DevTools page target never became available");
}

const pageTarget = await findPageTarget();
const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
const pending = new Map();
let messageId = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  if (!message.id) return;
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(message.error.message));
  else waiter.resolve(message.result ?? {});
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener(
    "error",
    () => reject(new Error("Chrome DevTools socket failed to open")),
    { once: true },
  );
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++messageId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text ?? "Browser evaluation failed");
  }
  return response.result?.value;
};

const waitFor = async (expression, label, attempts = 80) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(expression)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

fs.mkdirSync("artifacts/koi-anchor-renditions", { recursive: true });
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

const navigate = async (path, mode) => {
  await send("Page.navigate", { url: `http://127.0.0.1:3000${path}` });
  await waitFor(
    `document.readyState === 'complete' && Boolean(document.querySelector('[data-koi-anchor-mode="${mode}"]'))`,
    `${mode} rendition`,
  );
  await waitFor(
    "document.querySelector('.studio-scroll-koi')?.dataset.ready === 'true'",
    `${mode} koi video`,
  );
  await delay(3200);
};

const capture = async (name) => {
  const response = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    `artifacts/koi-anchor-renditions/${name}.png`,
    Buffer.from(response.data, "base64"),
  );
};

const assertCenteredAnchor = async (mode) => {
  const state = await evaluate(`(() => {
    const root = document.querySelector('[data-koi-anchor-mode="${mode}"]');
    const ring = root?.querySelector('.koi-anchor__center');
    const copy = root?.querySelector('[data-anchor-active="true"] .koi-anchor__copy');
    const companion = document.querySelector('.koi-companion');
    if (!root || !ring || !copy) return null;
    const ringRect = ring.getBoundingClientRect();
    const copyStyle = getComputedStyle(copy);
    return {
      centerX: ringRect.left + ringRect.width / 2,
      centerY: ringRect.top + ringRect.height / 2,
      viewportX: window.innerWidth / 2,
      viewportY: window.innerHeight / 2,
      copyOpacity: Number.parseFloat(copyStyle.opacity),
      copyTransform: copyStyle.transform,
      companionDisplay: companion ? getComputedStyle(companion).display : 'absent',
      sceneCount: root.querySelectorAll('[data-anchor-scene]').length,
    };
  })()`);

  if (!state) throw new Error(`${mode}: anchor state unavailable`);
  if (Math.abs(state.centerX - state.viewportX) > 4) {
    throw new Error(`${mode}: koi anchor is not horizontally centered`);
  }
  if (Math.abs(state.centerY - state.viewportY) > 4) {
    throw new Error(`${mode}: koi anchor is not vertically centered`);
  }
  if (state.copyOpacity < 0.45 || state.copyTransform === "none") {
    throw new Error(`${mode}: anchored copy is not visibly following the koi`);
  }
  if (state.companionDisplay !== "none" && state.companionDisplay !== "absent") {
    throw new Error(`${mode}: corner companion competes with the master koi`);
  }
  if (state.sceneCount !== 6) {
    throw new Error(`${mode}: expected six anchor scenes, got ${state.sceneCount}`);
  }
  console.log(`${mode}:`, state);
};

const assertWakeFragments = async () => {
  const state = await evaluate(`(() => {
    const scene = document.querySelector('[data-koi-anchor-mode="wake"] [data-anchor-active="true"]');
    const parts = [...(scene?.querySelectorAll('[data-anchor-part]') ?? [])];
    return {
      count: parts.length,
      visible: parts.filter((part) => Number.parseFloat(getComputedStyle(part).opacity) > .45).length,
      transforms: new Set(parts.map((part) => getComputedStyle(part).transform)).size,
    };
  })()`);

  if (state.count < 3 || state.visible < 3 || state.transforms < 2) {
    throw new Error(`wake: fragments are not trailing independently: ${JSON.stringify(state)}`);
  }
};

const scrollToScene = async (mode, scene) => {
  const found = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const root = document.querySelector('[data-koi-anchor-mode="${mode}"]');
    const target = root?.querySelector('[data-anchor-scene="${scene}"]');
    if (!target) return false;
    const travel = Math.max(target.getBoundingClientRect().height - window.innerHeight, 1);
    window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top + travel * .5);
    return true;
  })()`);
  if (!found) throw new Error(`Missing ${mode} scene: ${scene}`);
  await waitFor(
    `document.querySelector('[data-koi-anchor-mode="${mode}"]')?.dataset.koiScene === '${scene}'`,
    `${mode} ${scene} scene`,
  );
  await delay(1100);
};

await navigate("/koi-renditions/orbit", "orbit");
await assertCenteredAnchor("orbit");
await capture("01-orbit-hero");
await scrollToScene("orbit", "products");
await assertCenteredAnchor("orbit");
await capture("02-orbit-products");

await navigate("/koi-renditions/wake", "wake");
await assertCenteredAnchor("wake");
await assertWakeFragments();
await capture("03-wake-hero");
await scrollToScene("wake", "systems");
await assertCenteredAnchor("wake");
await assertWakeFragments();
await capture("04-wake-systems");

socket.close();
