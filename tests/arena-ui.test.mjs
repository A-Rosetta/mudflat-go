import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, controller, css] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("arena.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8")
]);

test("bird sanctuary exposes a separate wetland arena", () => {
  assert.match(html, /id="openBirdArena"/);
  assert.match(html, /id="birdArenaShell"[^>]+aria-label="湿地竞技"/);
  assert.match(html, /type="module" src="arena\.js"/);
  assert.match(controller, /arena-engine\.mjs/);
  assert.match(controller, /mudflat-go-compact-state-v1/);
});

test("arena shares bird-spirit formation and the existing point economy", () => {
  assert.match(controller, /root\.birdSpirits\.team/);
  assert.match(controller, /getProgressionStats/);
  assert.match(controller, /root\.points \+= settlement\.reward/);
  assert.match(controller, /source: "bird-arena"/);
  assert.doesNotMatch(controller, /mudflat-arena-state/);
});

test("arena includes lobby, targets, actions, result, and responsive layouts", () => {
  for (const token of ["arena-level-grid", "arena-team-mini", "arena-enemy", "data-arena-action", "arena-result"]) assert.match(controller, new RegExp(token));
  assert.match(css, /\.arena-shell/);
  assert.match(css, /\.arena-field/);
  assert.match(css, /@media \(max-width:680px\)[\s\S]*?\.arena-side > div \{ display:flex/);
  assert.match(css, /@media \(max-width:390px\)/);
});
