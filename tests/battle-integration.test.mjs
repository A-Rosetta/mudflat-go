import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [game, script] = await Promise.all([
  readFile(new URL("game.js", root), "utf8"),
  readFile(new URL("script.js", root), "utf8")
]);

test("bird spirits share the persisted blind-box economy", () => {
  assert.match(game, /mudflat-go-compact-state-v1/);
  assert.doesNotMatch(game, /mudflat-go-bird-spirit-v1/);
  assert.match(game, /birdSpirits/);
  assert.match(game, /blindBoxFragments/);
  assert.match(game, /mudflat-state-changed/);
});

test("the main app refreshes its in-memory state after spirit economy writes", () => {
  assert.match(script, /addEventListener\("mudflat-state-changed"/);
  assert.match(script, /state = readState\(\)/);
});
