import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../script.js", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

test("heavy feature runtimes are loaded only when their feature opens", () => {
  for (const asset of ["model-viewer.min.js", "tf.min.js", "mobilenet.min.js", "onnxruntime-web.min.js", "leaflet.min.js", "game.js", "arena.js"]) {
    assert.doesNotMatch(html, new RegExp(`<script[^>]+src="(?:assets/vendor/)?${asset.replace(".", "\\.")}"`));
  }
  assert.match(script, /fetch\("\/api\/identify"/);
  assert.doesNotMatch(script, /function ensureRecognitionRuntime/);
  assert.match(script, /function initializeShowroom/);
  assert.match(script, /function ensureInteractiveMap/);
  assert.match(script, /function ensureGameRuntime/);
});

test("hidden map and panorama do not start third-party requests", () => {
  assert.match(html, /id="mangrovePanoramaFrame" src="about:blank"/);
  assert.doesNotMatch(script, /tile\.openstreetmap\.org/);
  assert.match(script, /function preparePanorama/);
});

test("returning from blind-box view refreshes the interactive map size", () => {
  assert.match(script, /function refreshInteractiveMapViewport\(\)/);
  assert.match(script, /if \(name === "explore"\) ensureExploreRuntime\(\)\.then\(refreshInteractiveMapViewport\)/);
  assert.match(script, /interactiveMap\.invalidateSize\(\)/);
});

test("interactive map keeps the local fallback visible and lets the focus card coexist", () => {
  assert.match(css, /\.live-map\.leaflet-container \{[^}]*background:transparent !important/);
  assert.doesNotMatch(css, /\.route-map\.is-interactive \.map-tiles/);
  assert.match(css, /\.map-focus-card \{[^}]*pointer-events:none/);
  assert.match(css, /\.map-focus-card button \{[^}]*pointer-events:auto/);
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

test("icon hydration is coalesced instead of rescanning the document after every renderer", () => {
  assert.match(script, /let iconRefreshQueued = false/);
  assert.match(script, /if \(!window\.lucide \|\| iconRefreshQueued\) return/);
  assert.match(script, /queueMicrotask\(\(\) =>/);
});

test("coarse and compact devices avoid persistent glass-compositor work", () => {
  assert.match(css, /@media \(max-width:900px\),\(pointer:coarse\)/);
  assert.match(css, /body \{ background-attachment:scroll; \}/);
  assert.match(css, /backdrop-filter:none !important/);
  assert.match(css, /\.blind-box-entry::before,\.blind-box-entry > svg:last-of-type,\.blind-box-stage-art,\.mystery-box,\.stage-orbit \{ animation:none !important; \}/);
});
