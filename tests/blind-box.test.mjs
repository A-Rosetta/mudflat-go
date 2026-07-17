import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../script.js", import.meta.url), "utf8");

test("atlas exposes the glowing blind-box entry and view", () => {
  assert.match(html, /data-view-target="blind-box"/);
  assert.match(html, /data-view="blind-box"/);
  assert.match(html, /id="blindBoxStage"/);
});

test("blind-box economy includes single and five-pull costs", () => {
  assert.match(html, /data-draw-count="1"[\s\S]*?500/);
  assert.match(html, /data-draw-count="5"[\s\S]*?2,000/);
  assert.match(script, /const BLIND_BOX_COSTS = \{ 1: 500, 5: 2000 \}/);
});

test("blind-box pool contains ten standard figures and one chase", () => {
  const pool = script.match(/const blindBoxPool = \[([\s\S]*?)\n\];/);
  assert.ok(pool, "blindBoxPool is missing");
  assert.equal((pool[1].match(/id:/g) || []).length, 11);
  assert.match(pool[1], /rarity: "CHASE"/);
});

test("blind-box collection persists with the main state", () => {
  assert.match(script, /blindBoxCollection: \{\}/);
  assert.match(script, /function drawBlindBoxes\(count\)/);
  assert.match(script, /saveState\(\)/);
});
