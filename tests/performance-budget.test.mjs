import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../script.js", import.meta.url), "utf8");

test("heavy feature runtimes are loaded only when their feature opens", () => {
  for (const asset of ["model-viewer.min.js", "tf.min.js", "mobilenet.min.js", "onnxruntime-web.min.js", "leaflet.min.js", "game.js", "arena.js"]) {
    assert.doesNotMatch(html, new RegExp(`<script[^>]+src="(?:assets/vendor/)?${asset.replace(".", "\\.")}"`));
  }
  assert.match(script, /function ensureRecognitionRuntime/);
  assert.match(script, /function initializeShowroom/);
  assert.match(script, /function ensureInteractiveMap/);
  assert.match(script, /function ensureGameRuntime/);
});

test("hidden map and panorama do not start third-party requests", () => {
  assert.match(html, /id="mangrovePanoramaFrame" src="about:blank"/);
  assert.doesNotMatch(script, /tile\.openstreetmap\.org/);
  assert.match(script, /function preparePanorama/);
});

test("offscreen media is lazy and camera snapshots avoid synchronous base64", () => {
  assert.match(html, /class="map-tiles"[\s\S]*?loading="lazy"/);
  assert.match(html, /class="blind-box-stage-art"[^>]+loading="lazy"/);
  assert.match(script, /canvas\.toBlob/);
  assert.doesNotMatch(script, /canvas\.toDataURL\("image\/jpeg"/);
});

test("drawing updates the collection economy without rerendering the entire app", () => {
  const draw = script.match(/function drawBlindBoxes\(count\) \{([\s\S]*?)\n\}/)?.[1] || "";
  assert.doesNotMatch(draw, /updateUI\(\)/);
  assert.match(draw, /updateBlindBoxEconomyUI\(\)/);
});
