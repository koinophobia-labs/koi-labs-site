/**
 * The black water.
 *
 * A single fullscreen fragment shader, no dependencies, no textures, no assets.
 * It renders the environment the koi swims through: layered depth, drifting
 * caustics, suspended particulate, wake displacement and a cursor-following
 * light. Because it is entirely procedural and driven by uniforms it scrubs
 * perfectly in both directions and costs nothing to download.
 */

const VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // Fullscreen triangle. No buffers required.
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform float uProgress;   // 0..1 journey progress
uniform float uSurge;      // 0..1 travel/speed-ramp strength
uniform float uDepth;      // 0..1 how lifted and structured the water is
uniform float uParticles;  // density multiplier
uniform float uCaustics;   // caustic band strength
uniform float uWarmth;     // -1 cool .. 1 warm
uniform vec2  uLight;      // light direction, normalised screen space
uniform vec2  uPointer;    // pointer position, 0..1, -1 when absent
uniform float uPointerAmp; // 0..1 pointer light strength
uniform float uQuality;    // 0.5 low .. 1 full

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

// Fine suspended particulate on three parallax planes.
float motes(vec2 uv, float plane, float t) {
  float scale = mix(26.0, 74.0, plane);
  vec2 drift = vec2(t * (0.006 + plane * 0.014), -t * (0.011 + plane * 0.026));
  // Surge streaks the motes toward the direction of travel.
  vec2 p = uv * scale + drift * scale;
  p.y -= uSurge * plane * 3.4;
  vec2 cell = floor(p);
  vec2 f = fract(p) - 0.5;
  float r = hash21(cell + plane * 31.7);
  if (r < 0.86) return 0.0;
  vec2 jitter = vec2(hash21(cell + 3.1), hash21(cell + 7.7)) - 0.5;
  f -= jitter * 0.7;
  // Streak the particle along Y when surging.
  f.y /= 1.0 + uSurge * 3.0;
  float d = length(f);
  float core = smoothstep(0.16, 0.0, d);
  return core * (0.25 + 0.75 * hash21(cell + 13.3));
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uRes.x / max(uRes.y, 1.0), 1.0);
  float t = uTime;

  // --- Depth volume -------------------------------------------------------
  // A body of water, not a flat backdrop: a slow vertical gradient crossed by
  // very large low-contrast masses that drift at different rates.
  float column = 1.0 - smoothstep(-0.65, 0.85, p.y);
  vec2 lightDir = normalize(uLight + vec2(0.0001));
  float toward = dot(normalize(p + vec2(0.0001)), lightDir);

  float bodyA = fbm(p * 0.55 + vec2(t * 0.012, -t * 0.019));
  float bodyB = fbm(p * 1.25 + vec2(-t * 0.021, t * 0.014) + bodyA * 0.4);
  float volume = mix(bodyA, bodyB, 0.55);

  float depthLift = uDepth * (0.055 + 0.075 * volume) * (0.35 + 0.65 * column);
  depthLift *= 0.55 + 0.45 * smoothstep(-1.0, 1.0, toward);

  // --- Caustics -----------------------------------------------------------
  // Thin refracted bands from the surface far above. Kept low contrast so they
  // read as light in water rather than a decorative pattern.
  float causticPhase = t * 0.09 + uProgress * 1.6;
  vec2 cp = p * 2.6 + vec2(causticPhase * 0.4, causticPhase * 0.16);
  cp += vec2(fbm(cp * 0.6 + causticPhase * 0.1), fbm(cp * 0.6 - causticPhase * 0.08)) * 0.9;
  float bands = abs(sin(cp.y * 2.2 + fbm(cp * 0.9) * 3.4));
  bands = pow(1.0 - bands, 5.0);
  float caustic = bands * uCaustics * (0.16 + 0.5 * column) * (0.45 + 0.55 * uDepth);
  caustic *= 1.0 + uSurge * 1.1;

  // --- Particulate --------------------------------------------------------
  float dust = 0.0;
  if (uQuality > 0.75) {
    dust += motes(uv, 0.15, t) * 0.30;
    dust += motes(uv, 0.55, t) * 0.42;
    dust += motes(uv, 1.00, t) * 0.55;
  } else {
    dust += motes(uv, 0.35, t) * 0.34;
    dust += motes(uv, 0.90, t) * 0.5;
  }
  dust *= uParticles * (0.5 + 0.5 * column);

  // --- Pointer light ------------------------------------------------------
  float pointer = 0.0;
  if (uPointer.x >= 0.0) {
    vec2 d = (uv - uPointer) * vec2(uRes.x / max(uRes.y, 1.0), 1.0);
    pointer = exp(-dot(d, d) * 7.5) * uPointerAmp;
  }

  // --- Compose ------------------------------------------------------------
  // Rich blacks: the floor is never pure #000, it is a very dark blue-green
  // that warms slightly toward the end of the journey.
  vec3 cool = vec3(0.021, 0.030, 0.038);
  vec3 warm = vec3(0.036, 0.031, 0.030);
  vec3 base = mix(cool, warm, clamp(uWarmth * 0.5 + 0.5, 0.0, 1.0));

  vec3 lightTint = mix(vec3(0.55, 0.72, 0.86), vec3(0.88, 0.82, 0.72),
                       clamp(uWarmth * 0.5 + 0.5, 0.0, 1.0));

  vec3 col = base * (0.35 + 1.5 * depthLift + 0.25 * column * uDepth);
  col += lightTint * caustic * 0.5;
  col += lightTint * dust * 0.55;
  col += lightTint * pointer * 0.06;
  col += lightTint * uSurge * 0.014 * column;

  // Depth-of-field style falloff away from the light and toward frame edges.
  float vig = smoothstep(1.35, 0.15, length(p * vec2(0.82, 1.0)));
  col *= 0.28 + 0.72 * vig;

  // Very fine grain keeps the gradients from banding on wide gamut displays.
  float grain = (hash21(uv * uRes + fract(t) * 91.7) - 0.5) * 0.010;
  col += grain;

  fragColor = vec4(max(col, 0.0), 1.0);
}`;

export type WaterUniforms = {
  time: number;
  progress: number;
  surge: number;
  depth: number;
  particles: number;
  caustics: number;
  warmth: number;
  lightX: number;
  lightY: number;
  pointerX: number;
  pointerY: number;
  pointerAmp: number;
  quality: number;
};

export type WaterHandle = {
  render: (u: WaterUniforms) => void;
  resize: (cssWidth: number, cssHeight: number, dpr: number) => void;
  dispose: () => void;
};

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createWater(canvas: HTMLCanvasElement): WaterHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.useProgram(program);

  const loc = (name: string) => gl.getUniformLocation(program, name);
  const uRes = loc("uRes");
  const uTime = loc("uTime");
  const uProgress = loc("uProgress");
  const uSurge = loc("uSurge");
  const uDepth = loc("uDepth");
  const uParticles = loc("uParticles");
  const uCaustics = loc("uCaustics");
  const uWarmth = loc("uWarmth");
  const uLight = loc("uLight");
  const uPointer = loc("uPointer");
  const uPointerAmp = loc("uPointerAmp");
  const uQuality = loc("uQuality");

  let width = 1;
  let height = 1;
  let disposed = false;

  return {
    resize(cssWidth, cssHeight, dpr) {
      if (disposed) return;
      const w = Math.max(1, Math.round(cssWidth * dpr));
      const h = Math.max(1, Math.round(cssHeight * dpr));
      if (w === width && h === height) return;
      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    },
    render(u) {
      if (disposed) return;
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(uRes, width, height);
      gl.uniform1f(uTime, u.time);
      gl.uniform1f(uProgress, u.progress);
      gl.uniform1f(uSurge, u.surge);
      gl.uniform1f(uDepth, u.depth);
      gl.uniform1f(uParticles, u.particles);
      gl.uniform1f(uCaustics, u.caustics);
      gl.uniform1f(uWarmth, u.warmth);
      gl.uniform2f(uLight, u.lightX, u.lightY);
      gl.uniform2f(uPointer, u.pointerX, u.pointerY);
      gl.uniform1f(uPointerAmp, u.pointerAmp);
      gl.uniform1f(uQuality, u.quality);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      disposed = true;
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    },
  };
}
