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
  assert.equal((html.match(/data-points>3,000/g) || []).length, 4);
  assert.match(html, /id="spiritPoints">3,000/);
  assert.doesNotMatch(html, /data-points>1,280|id="spiritPoints">1,280/);
  assert.doesNotMatch(script, /points: 1280/);
  assert.doesNotMatch(game, /saved\.points = 1280|root\.points \?\? 1280/);
  assert.doesNotMatch(arena, /input\.points == null \? 1280/);
});

test("primary navigation stays focused while collection exposes secondary features", () => {
  const navigation = html.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";
  assert.equal((navigation.match(/<button\b/g) || []).length, 5);
  assert.doesNotMatch(navigation, /data-view-target="bird-sanctuary"/);
  assert.match(html, /class="collection-entry collection-entry-box"[^>]+data-view-target="blind-box"/);
  assert.match(html, /class="collection-entry collection-entry-spirit"[^>]+data-view-target="bird-sanctuary"/);
  assert.match(html, /湿地藏品系列陈列/);
  assert.match(html, /鸟灵档案与竞技/);
  assert.match(script, /\["blind-box", "bird-sanctuary"\]\.includes\(name\) \? "collection" : name/);
});

test("forest background and refractive top bar remain part of the glass system", () => {
  assert.match(css, /body \{ background: linear-gradient\(145deg,#fbf8df 0%,#eef4d7 24%,#dceee0 58%,#bcded2 100%\)/);
  assert.match(css, /\.topbar \{[^}]*backdrop-filter:blur\(34px\) saturate\(1\.55\) contrast\(1\.06\)/);
  assert.match(css, /\.topbar::before \{[^}]*linear-gradient/);
  assert.match(css, /\.topbar::after \{[^}]*linear-gradient/);
});
