import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, script, game, arena, css] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("script.js", root), "utf8"),
  readFile(new URL("game.js", root), "utf8"),
  readFile(new URL("arena.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8")
]);

test("alarm preview exposes a stop control and clears it with playback", () => {
  assert.match(html, /id="stopPreviewAlarm"[^>]+hidden/);
  assert.match(script, /stopPreviewAlarm"\)\.addEventListener\("click", stopBirdSound\)/);
  assert.match(script, /alarmAudio"\)\.addEventListener\("ended", stopBirdSound\)/);
  assert.match(script, /previewAlarm"\)\.hidden = !ringing/);
  assert.match(script, /stopPreviewAlarm"\)\.hidden = ringing/);
});

test("retrying recognition restores the bottom identify button", () => {
  assert.match(script, /retryCapture"\)\.addEventListener[\s\S]*?identifyButton"\)\.hidden = false;[\s\S]*?captureSource === "camera"/);
});

test("mobile panorama has an in-page reset above the cross-origin iframe", () => {
  assert.match(html, /id="mangrovePanoramaFrame"[^>]+data-src=/);
  assert.match(html, /id="resetPanorama"[^>]+aria-label="关闭全景介绍并返回全景"/);
  assert.match(script, /frame\.src = "about:blank";[\s\S]*?frame\.src = frame\.dataset\.src/);
  assert.match(css, /\.panorama-reset \{[^}]*z-index:3/);
});

test("new and reset sessions consistently start with 3000 points", () => {
  assert.match(script, /points: 3000/);
  assert.match(game, /saved\.points = 3000/);
  assert.match(game, /root\.points \?\? 3000/);
  assert.match(arena, /input\.points == null \? 3000 : input\.points/);
  assert.equal((html.match(/data-points>3,000/g) || []).length, 3);
  assert.match(html, /id="spiritPoints">3,000/);
  assert.doesNotMatch(html, /data-points>1,280|id="spiritPoints">1,280/);
  assert.doesNotMatch(script, /points: 1280/);
  assert.doesNotMatch(game, /saved\.points = 1280|root\.points \?\? 1280/);
  assert.doesNotMatch(arena, /input\.points == null \? 1280/);
});
