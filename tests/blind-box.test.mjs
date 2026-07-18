import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stat } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8").catch(() => "");

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

test("blind-box rarity totals follow the disclosed power-law distribution", () => {
  const entries = [...script.matchAll(/rarity: "(N|R|SR|SSR|CHASE)", weight: ([\d.]+)/g)];
  const totals = entries.reduce((result, [, rarity, weight]) => ({ ...result, [rarity]: (result[rarity] || 0) + Number(weight) }), {});
  assert.deepEqual(totals, { SSR: 0.99, SR: 4, R: 20, N: 75, CHASE: 0.01 });
  assert.match(html, /CHASE[\s\S]*?0\.01%[\s\S]*?SSR[\s\S]*?0\.99%[\s\S]*?SR[\s\S]*?4%[\s\S]*?R[\s\S]*?20%[\s\S]*?N[\s\S]*?75%/);
});

test("blind-box collection persists with the main state", () => {
  assert.match(script, /blindBoxCollection: \{\}/);
  assert.match(script, /function drawBlindBoxes\(count\)/);
  assert.match(script, /saveState\(\)/);
});

test("duplicate pulls retain collection counts for spirit resonance", () => {
  assert.match(script, /state\.blindBoxCollection\[item\.id\] = \(Number\(state\.blindBoxCollection\[item\.id\]\) \|\| 0\) \+ 1/);
});

test("Cloudflare deploy points Wrangler at the static asset root", () => {
  assert.match(wrangler, /"compatibility_date": "2026-07-17"/);
  assert.match(wrangler, /"directory": "\."/);
});

test("four unlocked GLB models are lazy-loaded while the chase model stays locked", async () => {
  const models = ["mystery-wetland-bird", "fork-tailed-sunbird", "red-whiskered-bulbul", "white-rumped-munia"];
  for (const model of models) {
    assert.match(html, new RegExp(`data-model-src="assets/models/blind-box/${model}\\.glb"`));
    const file = await stat(new URL(`../assets/models/blind-box/${model}.glb`, import.meta.url));
    assert.ok(file.size < 25 * 1024 * 1024, `${model}.glb exceeds Cloudflare's 25 MiB asset limit`);
  }
  for (const poster of ["poster-white-rumped-munia.webp"]) {
    const file = await stat(new URL(`../assets/images/blind-box/${poster}`, import.meta.url));
    assert.ok(file.size > 0, `${poster} is missing or empty`);
    assert.match(html, new RegExp(`data-model-poster="assets/images/blind-box/${poster}"`));
  }
  assert.match(html, /id="modelTab5"[^>]+disabled[^>]+aria-label="隐藏款长尾缝叶莺，尚未解锁"/);
  assert.match(html, /class="secret-silhouette"[\s\S]*?poster-common-tailorbird\.webp/);
  assert.doesNotMatch(html, /data-model-src="assets\/models\/blind-box\/common-tailorbird\.glb"/);
  assert.equal((html.match(/<model-viewer\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<model-viewer[^>]+\ssrc=/);
});

test("showroom tabs support roving keyboard navigation", () => {
  assert.match(html, /role="tabpanel"[^>]+id="blindBoxModelPanel"/);
  assert.match(html, /role="tab"[^>]+aria-controls="blindBoxModelPanel"[^>]+tabindex="0"/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /ArrowLeft/);
  assert.match(script, /event\.key === "Home"/);
  assert.match(script, /event\.key === "End"/);
  assert.match(script, /setAttribute\("tabindex"/);
});
