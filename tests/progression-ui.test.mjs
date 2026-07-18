import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, game] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("game.js", root), "utf8")
]);

test("sanctuary exposes growth, traces, sigils, and resonance", () => {
  assert.match(html, /class="spirit-workbench"/);
  assert.match(html, /id="spiritDetail"/);
  for (const tab of ["growth", "traces", "sigils", "resonance"]) assert.match(html, new RegExp(`data-spirit-tab="${tab}"`));
  assert.match(game, /progression-engine\.mjs/);
  assert.match(game, /data-spirit-tab/);
});

test("battle HUD exposes timeline, weakness, toughness, and combo", () => {
  for (const id of ["battleTimeline", "enemyWeaknesses", "enemyToughness", "comboMeter"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(game, /battle\.timeline/);
  assert.match(game, /battle\.enemy\.toughness/);
  assert.match(game, /battle\.combo/);
  assert.match(game, /intentDamagePreview/);
  assert.match(game, /is-targeted/);
});

test("players can select normal or boss encounters before battle", () => {
  assert.match(html, /data-battle-encounter="normal"/);
  assert.match(html, /data-battle-encounter="boss"/);
  assert.match(html, /id="enemyName"/);
  assert.match(game, /boss:\s*selectedEncounter\s*===\s*"boss"/);
});

test("spirit resonance follows each bird's blind-box collection id", () => {
  assert.match(game, /resonanceFromCollection\(root\.blindBoxCollection,\s*birds\[id\]\.blindBoxId\)/);
  assert.match(game, /blindBoxId:\s*"pond-heron"/);
});

test("progression tabs expose keyboard tab semantics", () => {
  for (const tab of ["growth", "traces", "sigils", "resonance"]) {
    assert.match(html, new RegExp(`id="spirit-tab-${tab}"[^>]+aria-controls="spiritDetailBody"`));
  }
  assert.match(html, /id="spiritDetailBody"[^>]+role="tabpanel"/);
  assert.match(game, /ArrowRight/);
  assert.match(game, /Home/);
});
