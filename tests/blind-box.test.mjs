import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stat } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const historyScript = await readFile(new URL("../blind-box-history.mjs", import.meta.url), "utf8");
const engineScript = await readFile(new URL("../blind-box-engine.mjs", import.meta.url), "utf8").catch(() => "");
const historyModule = await import(new URL("../blind-box-history.mjs", import.meta.url)).catch(() => ({}));
const engineModule = await import(new URL("../blind-box-engine.mjs", import.meta.url)).catch(() => ({}));
const worker = await readFile(new URL("../worker.mjs", import.meta.url), "utf8").catch(() => "");
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
  assert.match(pool[1], /id: "tuantuan"/);
  assert.match(pool[1], /assets\/images\/blind-box\/tuantuan-collab\.jpg/);
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
  assert.match(historyScript, /state\.blindBoxCollection\[item\.id\] = \(Number\(state\.blindBoxCollection\[item\.id\]\) \|\| 0\) \+ 1/);
});

test("Cloudflare deploy points Wrangler at the static asset root", () => {
  assert.match(wrangler, /"compatibility_date": "2026-07-17"/);
  assert.match(wrangler, /"main": "worker\.mjs"/);
  assert.match(wrangler, /"directory": "\."/);
  assert.match(wrangler, /"binding": "ASSETS"/);
  assert.match(wrangler, /"run_worker_first": \["\/api\/\*"\]/);
  assert.match(wrangler, /"binding": "AI"/);
});

test("Cloudflare Worker proxies constrained image recognition", () => {
  assert.match(worker, /url\.pathname === "\/api\/identify"/);
  assert.match(worker, /@cf\/microsoft\/resnet-50/);
  assert.match(worker, /MAX_IMAGE_BYTES = 2 \* 1024 \* 1024/);
  assert.match(worker, /env\.AI\.run/);
  assert.match(worker, /return env\.ASSETS\.fetch\(request\)/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/map-tiles\/"\)/);
  assert.match(worker, /TILE_PROVIDERS/);
});

test("Cloudflare asset upload excludes repository and local build metadata", () => {
  assert.match(assetsIgnore, /^\.git\/?$/m);
  assert.match(assetsIgnore, /^\.wrangler\/?$/m);
  assert.match(assetsIgnore, /^output\/?$/m);
  assert.match(assetsIgnore, /^worker\.mjs$/m);
  assert.match(assetsIgnore, /^assets\/models\/bird-species\/\*\*$/m);
  assert.match(assetsIgnore, /^assets\/models\/mobilenet\/\*\*$/m);
  assert.doesNotMatch(assetsIgnore, /^assets\/vendor\/tf\.min\.js$/m);
  assert.doesNotMatch(assetsIgnore, /^assets\/vendor\/mobilenet\.min\.js$/m);
  assert.doesNotMatch(assetsIgnore, /^assets\/vendor\/onnxruntime-web\.min\.js$/m);
  assert.doesNotMatch(assetsIgnore, /^assets\/vendor\/ort-wasm-simd-threaded\.wasm$/m);
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

test("showroom uses a cinematic collectible deck instead of a utility list", () => {
  assert.match(html, /class="showroom-curator"/);
  assert.match(html, /id="showroomLore"/);
  assert.equal((html.match(/data-model-lore=/g) || []).length, 4);
  assert.match(script, /showroomLore/);
  assert.match(styles, /.showroom-layout{position:relative/);
  assert.match(styles, /\.showroom-selector\{position:absolute/);
  assert.match(styles, /grid-template-columns:repeat\(5/);
  assert.match(styles, /.showroom-stage::before/);
  assert.doesNotMatch(styles, /showroom-stage model-viewer\{[^}]*filter:/);
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

test("third blind-box pool is a TuanTuan collaboration screenshot shift", () => {
  assert.match(html, /data-pool-id="mangrove-echo"[\s\S]*?<strong>团团联动<\/strong>[\s\S]*?<em>联动<\/em>/);
  assert.match(script, /id: "mangrove-echo", title: "团团联动"/);
  assert.match(script, /heroBadge: "特别联动 · 团团"/);
  assert.match(script, /heroSpecies: "亲和力 · 元气值 · 战斗力 · 幸运值"/);
  assert.match(script, /必杀技「团魂光环」/);
  assert.match(styles, /character-tuantuan/);
});

test("blind-box picker preserves rarity odds and resolves pity guarantees deterministically", () => {
  const pick = engineModule.pickBlindBoxItem;
  assert.equal(typeof pick, "function");
  const pool = {
    upIds: ["featured-ssr"],
    items: [
      { id: "common", rarity: "N", weight: 99 },
      { id: "off-ssr", rarity: "SSR", weight: .5 },
      { id: "featured-ssr", rarity: "SSR", weight: .5 }
    ]
  };
  const randomFrom = values => {
    let index = 0;
    return () => values[index++];
  };

  assert.equal(pick({ pool, pity: 0, guaranteedUp: false, random: randomFrom([.02, .99]) }).id, "common");
  assert.equal(pick({ pool, pity: 0, guaranteedUp: false, random: randomFrom([.005, .3]) }).id, "featured-ssr");
  assert.equal(pick({ pool, pity: 9, guaranteedUp: false, random: () => 0 }).rarity, "SSR");
  assert.equal(pick({ pool, pity: 9, guaranteedUp: true, random: () => .99 }).id, "featured-ssr");
});

test("draw results expose immediate pity and featured provenance", () => {
  assert.match(script, /import \{ pickBlindBoxItem \} from "\.\/blind-box-engine\.mjs"/);
  assert.match(script, /pickBlindBoxItem\(\{ pool, pity, guaranteedUp \}\)/);
  assert.match(script, /function blindBoxPullProof\(audit\)/);
  for (const phrase of ["主推保障", "十次保底", "命中主推"]) assert.match(script, new RegExp(phrase));
  assert.match(script, /blindBoxPullProof\(audit\)/);
  assert.match(script, /document\.getElementById\("blindBoxReveal"\)\.style\.setProperty\("--pool-accent", pool\.accent \|\| "#dff47b"\)/);
  assert.match(script, /document\.querySelectorAll\('\[data-draw-count\],\[data-pool-id\]'\)\.forEach\(button => button\.disabled = true\)/);
  assert.match(script, /document\.querySelectorAll\('\[data-draw-count\],\[data-pool-id\]'\)\.forEach\(button => button\.disabled = false\)/);
  assert.match(styles, /\.reveal-proof\{[^}]*right:8px;top:8px;/);
  assert.match(styles, /@media\(max-width:520px\)\{\.reveal-proof\{right:auto;bottom:3px;left:3px;top:auto;[^}]*font-size:8px/);
  assert.match(styles, /\.blind-box-reveal \{[^}]*overflow-x: hidden;[^}]*overflow-y: auto;/);
});

test("blind-box history migration rejects malformed data and caps newest records", () => {
  const normalize = historyModule.normalizeBlindBoxHistory || (() => null);
  const entries = Array.from({ length: 55 }, (_, index) => ({ sequence: 55 - index, poolId: "tide-watch", itemId: `item-${index}` }));
  assert.deepEqual(normalize("invalid"), []);
  assert.deepEqual(normalize(entries).map(entry => entry.sequence), Array.from({ length: 50 }, (_, index) => 55 - index));
});

test("blind-box pull resolution records exact pity and guarantee provenance", () => {
  assert.equal(typeof historyModule.resolveBlindBoxPull, "function");
  const state = {
    blindBoxCollection: { spoonbill: 1 },
    blindBoxFragments: 10,
    blindBoxPity: { "shared-up": 9 },
    blindBoxGuarantee: { "shared-up": true },
    blindBoxHistory: []
  };
  const pool = { id: "tide-watch", title: "潮有信", carryOver: true, upIds: ["spoonbill"] };
  const item = { id: "spoonbill", name: "琵小鹭", rarity: "SSR", fragments: 60 };

  const result = historyModule.resolveBlindBoxPull(state, { pool, item, stateKey: "shared-up", pulledAt: 1721376000000 });

  assert.equal(result.duplicate, true);
  assert.equal(state.blindBoxCollection.spoonbill, 2);
  assert.equal(state.blindBoxFragments, 70);
  assert.equal(state.blindBoxPity["shared-up"], 0);
  assert.equal(state.blindBoxGuarantee["shared-up"], false);
  assert.deepEqual(state.blindBoxHistory[0], {
    sequence: 1,
    pulledAt: 1721376000000,
    poolId: "tide-watch",
    poolTitle: "潮有信",
    itemId: "spoonbill",
    itemName: "琵小鹭",
    rarity: "SSR",
    duplicate: true,
    duplicateFragments: 60,
    featured: true,
    carryOver: true,
    pityBefore: 9,
    pityAfter: 0,
    forcedByPity: true,
    guaranteeBefore: true,
    guaranteeUsed: true,
    guaranteeAfter: false
  });
});

test("rules panel exposes persisted guarantee status and recent pull audit", () => {
  assert.match(html, /id="blindBoxAuditPity"/);
  assert.match(html, /id="blindBoxAuditGuarantee"/);
  assert.match(html, /id="blindBoxHistoryCount"/);
  assert.match(html, /id="blindBoxHistory"/);
  assert.match(script, /import \{ normalizeBlindBoxHistory, resolveBlindBoxPull \}/);
  assert.match(script, /blindBoxHistory: \[\]/);
  assert.match(script, /migrated\.blindBoxHistory = normalizeBlindBoxHistory\(migrated\.blindBoxHistory\)/);
  assert.match(script, /resolveBlindBoxPull\(state, \{ pool, item, stateKey: getBlindBoxStateKey\(pool\) \}\)/);
  assert.match(script, /function renderBlindBoxAudit\(\)/);
  assert.match(styles, /\.blind-box-audit/);
  assert.match(styles, /\.blind-box-history/);
});

test("UP pool draws expose pity, guarantee, carry-over, and duplicate conversion", () => {
  const source = `${script}\n${historyScript}`;
  assert.match(source, /blindBoxPity/);
  assert.match(source, /guaranteedUp/);
  assert.match(source, /carryOver/);
  assert.match(source, /duplicateFragments/);
  assert.match(html, /id="blindBoxPity"/);
  assert.match(html, /id="blindBoxRules"/);
  assert.match(engineScript, /pity >= 9/);
  assert.match(script, /BLIND_BOX_CARRY_KEY/);
  assert.match(source, /pool\.carryOver && rare/);
});

test("blind-box reveals cards sequentially and supports skip", () => {
  assert.match(script, /revealBlindBoxCard/);
  assert.match(script, /blindBoxRevealIndex/);
  assert.match(script, /let blindBoxRevealTimer;/);
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
  assert.match(source, /团团联动/);
  assert.match(source, /限定典藏 · 概率提升/);
});

test("recording mode starts with enough points for repeated ten-pulls", () => {
  assert.match(script, /points: INITIAL_POINTS/);
  assert.match(html, /初始化守护值/);
  assert.match(html, /88,888,888/);
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

test("mobile pull audit keeps verification text readable", () => {
  assert.match(styles, /\.blind-box-audit-status small\{font-size:9px!important\}/);
  assert.match(styles, /\.blind-box-panel\.blind-box-probability \.blind-box-audit \.probability-bars b\{font-size:9px\}/);
  assert.match(styles, /\.blind-box-history \.history-sequence\{font-size:9px\}/);
  assert.match(styles, /\.blind-box-history b\{font-size:10px\}/);
  assert.match(styles, /\.blind-box-history small,\.blind-box-history \.history-proof b\{font-size:9px\}/);
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
