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

const waitFor = async (expression, label, attempts = 60) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(expression)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

fs.mkdirSync("artifacts/koi-visuals", { recursive: true });
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://127.0.0.1:3000/" });
await waitFor(
  "document.readyState === 'complete' && Boolean(document.querySelector('.studio-site--koi'))",
  "the Labs homepage",
);
await waitFor(
  "document.querySelector('.studio-scroll-koi')?.dataset.ready === 'true'",
  "the koi video",
);
await delay(3200);

const capture = async (name) => {
  const response = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    `artifacts/koi-visuals/${name}.png`,
    Buffer.from(response.data, "base64"),
  );
};

const depthState = async () =>
  evaluate(`(() => {
    const root = document.querySelector('.studio-site--koi');
    const depth = document.querySelector('.studio-koi-depth-pass');
    if (!root || !depth) return null;
    const style = getComputedStyle(depth);
    return {
      scene: root.dataset.koiScene ?? null,
      opacity: Number.parseFloat(style.opacity),
      zIndex: style.zIndex,
    };
  })()`);

const assertDepth = (name, state, expectation) => {
  if (!state) throw new Error(`${name}: depth pass did not mount`);
  if (state.zIndex !== "3") {
    throw new Error(`${name}: expected foreground z-index 3, got ${state.zIndex}`);
  }
  if (expectation === "visible" && state.opacity < 0.05) {
    throw new Error(`${name}: foreground pass is not visible`);
  }
  if (expectation === "hidden" && state.opacity > 0.01) {
    throw new Error(`${name}: foreground pass should be hidden, got ${state.opacity}`);
  }
  console.log(`${name}:`, state);
};

const scrollToScene = async (scene) => {
  const found = await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const section = document.querySelector('[data-koi-scene="${scene}"]');
    if (!section) return false;
    section.scrollIntoView({ block: 'center' });
    return true;
  })()`);
  if (!found) throw new Error(`Missing scene: ${scene}`);
  await waitFor(
    `document.querySelector('.studio-site--koi')?.dataset.koiScene === '${scene}'`,
    `${scene} scene activation`,
  );
  await delay(1500);
};

assertDepth("hero", await depthState(), "visible");
await capture("01-hero-depth");

await scrollToScene("diagnose");
assertDepth("diagnose", await depthState(), "visible");
await capture("02-diagnose-popout");

await scrollToScene("products");
assertDepth("products", await depthState(), "hidden");
await capture("03-products-two-koi");

await scrollToScene("return");
assertDepth("return", await depthState(), "visible");
await capture("04-founder-return-depth");

socket.close();
