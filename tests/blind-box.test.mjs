import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stat } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8").catch(() => "");
const assetsIgnore = await readFile(new URL("../.assetsignore", import.meta.url), "utf8").catch(() => "");

test("atlas exposes the glowing blind-box entry and view", () => {
  assert.match(html, /data-view-target="blind-box"/);
  assert.match(html, /data-view="blind-box"/);
  assert.match(html, /id="blindBoxStage"/);
});

test("blind-box economy includes single and ten-pull costs", () => {
  assert.match(html, /data-draw-count="1"[\s\S]*?500/);
  assert.match(html, /data-draw-count="10"[\s\S]*?4,000/);
  assert.match(script, /const BLIND_BOX_COSTS = \{ 1: 500, 10: 4000 \}/);
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
  assert.match(html, /典藏款[\s\S]*?0\.01%[\s\S]*?SSR[\s\S]*?0\.99%[\s\S]*?SR[\s\S]*?4%[\s\S]*?R[\s\S]*?20%[\s\S]*?N[\s\S]*?75%/);
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

test("Cloudflare asset upload excludes repository and local build metadata", () => {
  assert.match(assetsIgnore, /^\.git\/?$/m);
  assert.match(assetsIgnore, /^\.wrangler\/?$/m);
  assert.match(assetsIgnore, /^output\/?$/m);
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
  assert.match(html, /id="modelTab5"[^>]+disabled[^>]+aria-label="隐藏款长尾缝叶莺，尚未收录"/);
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

test("blind-box supports multiple concurrent UP pools with independent metadata", () => {
  assert.match(html, /id="blindBoxPoolTabs"/);
  assert.match(html, /data-pool-id="standard-atlas"/);
  assert.match(html, /data-pool-id="tide-watch"/);
  assert.match(html, /data-pool-id="mangrove-echo"/);
  assert.match(script, /const blindBoxPools = \[/);
  assert.match(script, /id: "tide-watch"/);
  assert.match(script, /id: "mangrove-echo"/);
  assert.match(script, /activeBlindBoxPool/);
});

test("UP pool draws expose pity, guarantee, carry-over, and duplicate conversion", () => {
  assert.match(script, /blindBoxPity/);
  assert.match(script, /guaranteedUp/);
  assert.match(script, /carryOver/);
  assert.match(script, /duplicateFragments/);
  assert.match(html, /id="blindBoxPity"/);
  assert.match(html, /id="blindBoxRules"/);
  assert.match(script, /pity >= 9/);
  assert.match(script, /BLIND_BOX_CARRY_KEY/);
  assert.match(script, /pool\.carryOver && rare/);
});

test("blind-box reveals cards sequentially and supports skip", () => {
  assert.match(script, /revealBlindBoxCard/);
  assert.match(script, /blindBoxRevealIndex/);
  assert.match(script, /data-reveal-skip/);
  assert.match(html, /data-reveal-skip/);
});

test("blind-box copy uses one polished Chinese product vocabulary", () => {
  const source = `${html}\n${script}`;
  for (const phrase of [
    "LIMITED MIGRATION SIGNAL",
    "FEATURED WETLAND SPIRIT",
    "UP SPECIMEN",
    "COLLECTION CONTINUES",
    "DIGITAL SPECIMEN ROOM",
    "YOUR TIDAL CABINET",
    "FAIR DRAW",
    "TIDAL SIGNAL RECEIVED",
    "DRACO · WEBP · LAZY",
    "等待潮汐揭晓",
  ]) assert.doesNotMatch(source, new RegExp(phrase));
  assert.match(source, /潮间万象/);
  assert.match(source, /潮有信/);
  assert.match(source, /暮栖红林/);
  assert.match(source, /限定典藏 · 概率提升/);
});

test("recording mode starts with enough points for repeated ten-pulls", () => {
  assert.match(script, /points: 300000/);
  assert.match(html, /初始化守护值/);
  assert.match(html, /300,000/);
});

test("rare reveals have dedicated rotating shine animation", () => {
  assert.match(html, /十次内必得 SSR 或典藏款/);
  assert.match(styles, /\.reveal-card\.rarity-ssr\.is-revealed/);
  assert.match(styles, /\.reveal-card\.rarity-chase\.is-revealed/);
  assert.match(styles, /@keyframes rareHaloSpin/);
  assert.match(styles, /@keyframes rareCardOrbit/);
});

test("mobile ten-pulls use a five-by-two result overview", () => {
  assert.match(styles, /@media\(max-width:520px\)\{[\s\S]*?\.reveal-grid\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media\(max-width:520px\)\{[\s\S]*?\.reveal-card p\{display:none\}/);
  assert.match(script, /重复 · \+.*碎片/);
});

test("blind-box workspace switches four full-height panels without page scrolling", () => {
  for (const panel of ["draw", "showroom", "cabinet", "rules"]) {
    assert.match(html, new RegExp(`data-blind-box-panel-target="${panel}"`));
    assert.match(html, new RegExp(`data-blind-box-panel-content="${panel}"`));
  }
  assert.match(script, /function selectBlindBoxPanel\(panelId\)/);
  assert.match(script, /document\.body\.classList\.toggle\("is-blind-box-active", name === "blind-box"\)/);
  assert.match(styles, /body\.is-blind-box-active\{overflow:hidden\}/);
  assert.match(styles, /body\.is-blind-box-active \.bottom-nav\{display:none\}/);
  assert.match(styles, /\.blind-box-view\.is-active\{height:calc\(100dvh - 124px\)/);
});

test("short desktop viewports compact the draw panel without overlapping pool tabs", () => {
  assert.match(styles, /@media\(max-height:680px\) and \(min-width:681px\)/);
  assert.match(styles, /\.blind-box-view\.is-active\{min-height:0\}/);
  assert.match(styles, /\.blind-box-panel \.blind-box-copy>p#blindBoxCopy,\.blind-box-panel \.spirit-gate\{display:none\}/);
});

test("cabinet uses six-card pages instead of shrinking the full collection", () => {
  assert.match(html, /id="blindBoxCabinetPrev"/);
  assert.match(html, /id="blindBoxCabinetNext"/);
  assert.match(html, /id="blindBoxCabinetPage"/);
  assert.match(script, /const BLIND_BOX_CABINET_PAGE_SIZE = 6/);
  assert.match(script, /\.slice\(start, start \+ BLIND_BOX_CABINET_PAGE_SIZE\)/);
});
