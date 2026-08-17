import fs from "node:fs";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pageTarget() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const targets = await fetch("http://127.0.0.1:9222/json/list").then((r) =>
        r.json(),
      );
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
  socket.addEventListener(
    "error",
    () => reject(new Error("DevTools socket failed")),
    { once: true },
  );
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
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
    throw new Error(
      response.exceptionDetails.text ?? "Browser evaluation failed",
    );
  }
  return response.result?.value;
};

const waitFor = async (expression, label) => {
  for (let i = 0; i < 80; i += 1) {
    if (await evaluate(expression)) return;
    await wait(250);
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
  "document.readyState === 'complete' && Boolean(document.querySelector('.koi-world--finished'))",
  "finished koi world",
);

// Production prefers the new Higgsfield masters and retains owned local files
// as fallbacks. Browser QA deliberately pins those local files so a temporary
// third-party CDN delay cannot hide an otherwise valid interface build.
await evaluate(`(() => {
  const single = document.querySelector('.studio-scroll-koi__video--single');
  const duo = document.querySelector('.studio-scroll-koi__video--duo');
  if (!single || !duo) return false;
  single.pause();
  duo.pause();
  single.src = '/brand/koi-scroll-single.mp4';
  duo.src = '/brand/koi-scroll-duo.mp4';
  single.load();
  duo.load();
  return true;
})()`);
await waitFor(
  "document.querySelector('.studio-scroll-koi__video--single')?.readyState >= 1 && document.querySelector('.studio-scroll-koi__video--duo')?.readyState >= 1",
  "local koi metadata",
);
await evaluate(`(() => {
  const layer = document.querySelector('.studio-scroll-koi');
  if (!layer) return false;
  layer.dataset.ready = 'true';
  return true;
})()`);
await waitFor(
  "document.querySelector('.koi-world--finished')?.dataset.koiLiving === 'true'",
  "living hero hold",
);
await wait(650);

const architecture = await evaluate(`(() => {
  const primaryLinks = [...document.querySelectorAll('.koi-world__primary-nav [data-koi-nav]')];
  return {
    products: document.querySelectorAll('.koi-product-node').length,
    scenes: document.querySelectorAll('[data-koi-frame]').length,
    followScenes: document.querySelectorAll('[data-koi-follow-scene]').length,
    followParts: document.querySelectorAll('[data-koi-follow]').length,
    sectionMarkers: document.querySelectorAll('.koi-section-marker').length,
    primaryNavLinks: primaryLinks.length,
    visiblePrimaryNavLinks: primaryLinks.filter((link) => {
      const style = getComputedStyle(link);
      return style.display !== 'none' && style.visibility !== 'hidden' && Number.parseFloat(style.opacity) > .8;
    }).length,
    oldRail: Boolean(document.querySelector('.koi-world__rail')),
    oldWayfinder: Boolean(document.querySelector('.koi-wayfinder')),
    legacy: Boolean(document.querySelector('.studio-problem-grid, .studio-pricing-grid, .studio-product-grid, .studio-trust')),
    companion: document.querySelector('.koi-companion') ? getComputedStyle(document.querySelector('.koi-companion')).display : 'none',
    opacity: Number.parseFloat(getComputedStyle(document.querySelector('.studio-scroll-koi__video--single')).opacity),
    brightness: Number.parseFloat(getComputedStyle(document.querySelector('.koi-world--finished')).getPropertyValue('--koi-video-brightness')),
    living: document.querySelector('.koi-world--finished')?.dataset.koiLiving ?? 'false',
  };
})()`);
if (
  architecture.products !== 3 ||
  architecture.scenes !== 6 ||
  architecture.followScenes !== 6 ||
  architecture.followParts < 30 ||
  architecture.sectionMarkers !== 6 ||
  architecture.primaryNavLinks !== 6 ||
  architecture.visiblePrimaryNavLinks !== 6 ||
  architecture.oldRail ||
  architecture.oldWayfinder ||
  architecture.legacy ||
  architecture.companion !== "none" ||
  architecture.opacity < 0.9 ||
  architecture.brightness < 0.95 ||
  architecture.living !== "true"
) {
  throw new Error(`Invalid final koi architecture: ${JSON.stringify(architecture)}`);
}

const livingState = () =>
  evaluate(`(() => {
    const root = document.querySelector('.koi-world--finished');
    const single = document.querySelector('.studio-scroll-koi__video--single');
    const duo = document.querySelector('.studio-scroll-koi__video--duo');
    if (!root || !single || !duo) return null;
    return {
      scene: root.dataset.koiScene,
      living: root.dataset.koiLiving,
      singleTime: single.currentTime,
      duoTime: duo.currentTime,
      idleX: getComputedStyle(root).getPropertyValue('--koi-idle-x').trim(),
      idleY: getComputedStyle(root).getPropertyValue('--koi-idle-y').trim(),
      brightness: Number.parseFloat(getComputedStyle(root).getPropertyValue('--koi-video-brightness')),
    };
  })()`);

const assertLiving = async (scene) => {
  const before = await livingState();
  await wait(420);
  const after = await livingState();
  if (!before || !after || after.scene !== scene || after.living !== 'true') {
    throw new Error(`${scene}: living hold is unavailable: ${JSON.stringify({ before, after })}`);
  }
  if (Math.abs(after.singleTime - before.singleTime) < .004) {
    throw new Error(`${scene}: the koi timeline is frozen: ${JSON.stringify({ before, after })}`);
  }
  if (before.idleX === after.idleX && before.idleY === after.idleY) {
    throw new Error(`${scene}: subtle depth drift is frozen: ${JSON.stringify({ before, after })}`);
  }
  if (after.brightness < .95) {
    throw new Error(`${scene}: koi visibility is too low: ${JSON.stringify(after)}`);
  }
};

const capture = async (name) => {
  const image = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    `artifacts/koi-visuals/${name}.png`,
    Buffer.from(image.data, "base64"),
  );
};

const depthState = () =>
  evaluate(`(() => {
    const root = document.querySelector('.koi-world--finished');
    const depth = document.querySelector('.studio-koi-depth-pass');
    if (!root || !depth) return null;
    const style = getComputedStyle(depth);
    return {
      scene: root.dataset.koiScene,
      opacity: Number.parseFloat(style.opacity),
      zIndex: Number.parseFloat(style.zIndex),
    };
  })()`);

const followState = () =>
  evaluate(`(() => {
    const scene = document.querySelector('[data-koi-active="true"]');
    const parts = [...(scene?.querySelectorAll('[data-koi-follow]') ?? [])];
    const cluster = scene?.querySelector('.koi-follow-cluster');
    const stage = scene?.querySelector('.koi-follow-stage');
    const heading = scene?.querySelector('h1, h2');
    const marker = scene?.querySelector('.koi-section-marker');
    const panelStyle = cluster ? getComputedStyle(cluster, '::before') : null;
    const clusterStyle = cluster ? getComputedStyle(cluster) : null;
    const sceneStyle = scene ? getComputedStyle(scene) : null;
    const headingRect = heading?.getBoundingClientRect();
    const markerRect = marker?.getBoundingClientRect();
    const clusterRect = cluster?.getBoundingClientRect();
    return {
      scene: scene?.dataset.koiFollowScene ?? null,
      count: parts.length,
      visible: parts.filter((part) => Number.parseFloat(getComputedStyle(part).opacity) > .9).length,
      transforms: new Set(parts.map((part) => getComputedStyle(part).transform)).size,
      headingOpacity: heading ? Number.parseFloat(getComputedStyle(heading).opacity) : 0,
      headingColor: heading ? getComputedStyle(heading).color : '',
      readingOpacity: sceneStyle ? Number.parseFloat(sceneStyle.getPropertyValue('--koi-reading-opacity')) : 0,
      panelBackground: panelStyle?.backgroundImage ?? 'none',
      panelBorder: panelStyle?.borderTopColor ?? 'transparent',
      clusterOpacity: clusterStyle ? Number.parseFloat(clusterStyle.opacity) : 0,
      clusterVisibility: clusterStyle?.visibility ?? 'hidden',
      clusterDisplay: clusterStyle?.display ?? 'none',
      clusterInViewport: clusterRect ? (
        clusterRect.left >= 0 &&
        clusterRect.right <= document.documentElement.clientWidth &&
        clusterRect.top >= 72 &&
        clusterRect.bottom <= document.documentElement.clientHeight
      ) : false,
      stageZ: stage ? Number.parseFloat(getComputedStyle(stage).zIndex) : 0,
      activeMapLinks: document.querySelectorAll('.koi-world__primary-nav [aria-current="true"]').length,
      markerText: marker?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      markerVisible: markerRect ? markerRect.width > 20 && markerRect.height > 12 : false,
      headingInViewport: headingRect ? (
        headingRect.left >= 0 &&
        headingRect.right <= document.documentElement.clientWidth &&
        headingRect.top >= 70 &&
        headingRect.bottom <= document.documentElement.clientHeight
      ) : false,
    };
  })()`);

const assertDepth = (scene, state, visible) => {
  if (!state || state.zIndex !== 3) {
    throw new Error(`${scene}: invalid depth pass: ${JSON.stringify(state)}`);
  }
  if (visible && state.opacity < 0.05) {
    throw new Error(`${scene}: depth pass is hidden`);
  }
  if (!visible && state.opacity > 0.01) {
    throw new Error(`${scene}: depth pass should be hidden`);
  }
};

const assertFollow = (scene, state) => {
  if (!state || state.scene !== scene || state.count < 4) {
    throw new Error(`${scene}: missing follow content: ${JSON.stringify(state)}`);
  }
  if (
    state.visible < Math.min(5, state.count) ||
    state.headingOpacity < .95 ||
    state.readingOpacity < .9 ||
    state.panelBackground === 'none' ||
    state.panelBorder === 'rgba(0, 0, 0, 0)' ||
    state.clusterOpacity < .95 ||
    state.clusterVisibility === 'hidden' ||
    state.clusterDisplay === 'none' ||
    !state.clusterInViewport ||
    state.stageZ < 4 ||
    state.activeMapLinks !== 1 ||
    !state.markerVisible ||
    !state.markerText ||
    !state.headingInViewport ||
    !state.headingColor.includes('255')
  ) {
    throw new Error(`${scene}: information or navigation is not readable: ${JSON.stringify(state)}`);
  }
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
  await waitFor(
    `document.querySelector('.koi-world--finished')?.dataset.koiScene === '${scene}'`,
    `${scene} activation`,
  );
  await wait(1500);
};

assertDepth("hero", await depthState(), true);
assertFollow("hero", await followState());
await assertLiving("hero");
await capture("01-koi-world-hero");

await go("products");
assertDepth("products", await depthState(), false);
assertFollow("products", await followState());
await assertLiving("products");
await capture("02-product-constellation-two-koi");

await go("systems");
assertDepth("systems", await depthState(), true);
assertFollow("systems", await followState());
await assertLiving("systems");
await capture("03-systems-follow-the-koi");

await go("start");
assertDepth("start", await depthState(), true);
assertFollow("start", await followState());
await assertLiving("start");
await capture("04-final-koi-portal");

socket.close();