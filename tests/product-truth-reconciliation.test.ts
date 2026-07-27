import test from "node:test";
import assert from "node:assert/strict";
import { getProduct } from "../lib/dev/universe";
import { nowActiveWork, nowLastUpdated } from "../lib/now";

test("July 27 product truth reconciliation remains intact", () => {
  assert.equal(nowLastUpdated, "July 27, 2026");

  const trendi = getProduct("trendi");
  assert.ok(trendi);
  assert.equal(trendi!.stage, "external-testers");
  assert.match(trendi!.status, /build 122/i);
  assert.match(trendi!.evidence.map((item) => item.source).join(" "), /content-creator user/i);
  assert.ok(trendi!.notYet.some((line) => /second-Apple-account|isolation/i.test(line)));

  const careerForge = getProduct("career-forge");
  assert.ok(careerForge);
  assert.match(careerForge!.status, /owner-approval boundary/i);
  assert.match(careerForge!.evidence.map((item) => item.source).join(" "), /issue #49/i);
  assert.ok(careerForge!.notYet.some((line) => /current main/i.test(line)));

  const ykb = getProduct("you-know-ball");
  assert.ok(ykb);
  assert.match(ykb!.status, /web demo/i);
  assert.match(ykb!.status, /accepted by Apple/i);
  assert.ok(ykb!.state.some((line) => /build 24/i.test(line)));
  assert.ok(ykb!.notYet.some((line) => /testers remain zero|tester group/i.test(line)));

  const koi = getProduct("koi-cave");
  assert.ok(koi);
  assert.equal(koi!.reach, "internal");
  assert.match(koi!.status, /un-notarized/i);
  assert.ok(koi!.state.some((line) => /draft review package/i.test(line)));

  const nowByName = new Map(nowActiveWork.map((item) => [item.name, item]));
  assert.match(nowByName.get("Trendi")!.stage, /External beta/);
  assert.match(nowByName.get("Career Forge")!.stage, /security rebuild/);
  assert.match(nowByName.get("You Know Ball")!.doingNow, /durable remote/);
});
