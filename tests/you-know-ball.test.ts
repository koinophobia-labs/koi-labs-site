import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { debatePrompts, scoreTake } from "../lib/youKnowBall";

test("a reasoned sports take earns more than a vague response", () => {
  const prompt = debatePrompts[0];
  const vague = scoreTake("peak", prompt);
  const reasoned = scoreTake(
    "Peak matters because playoff defenses force the best players to reveal every counter in their game.",
    prompt,
  );
  assert.ok(reasoned.points > vague.points);
  assert.ok(reasoned.takeStrength > vague.takeStrength);
});

test("betting requests pause scoring", () => {
  const score = scoreTake(
    "Give me the best parlay and moneyline pick",
    debatePrompts[0],
  );
  assert.equal(score.paused, true);
  assert.equal(score.points, 0);
});

test("the koi-led homepage reveals the internal product constellation before systems and work", async () => {
  const final = await readFile(
    new URL("../components/studio/KoiFinalHomepage.tsx", import.meta.url),
    "utf8",
  );
  const productsScene = final.indexOf('scene="products"');
  const systemsScene = final.indexOf('scene="systems"');
  const workScene = final.indexOf('scene="work"');

  assert.ok(productsScene > 0, "the product constellation must exist");
  assert.ok(
    productsScene < systemsScene,
    "the product constellation should follow the hero before the systems chapter",
  );
  assert.ok(
    systemsScene < workScene,
    "the systems chapter should lead into the work chapter",
  );
  assert.match(final, /scene="products"[\s\S]*duo/);
  assert.match(final, /product\.status\.replace\("Internal Product · ", ""\)/);
  assert.match(final, /featuredProducts/);
});
