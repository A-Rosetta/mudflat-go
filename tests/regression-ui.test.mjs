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

test("new sessions start with 88888888 points and legacy balances migrate once", () => {
  assert.match(script, /const INITIAL_POINTS = 88888888/);
  assert.match(script, /saved\.demoPointsVersion !== DEMO_POINTS_VERSION/);
  assert.match(script, /migrated\.points = Math\.max\(Number\(migrated\.points\) \|\| 0, INITIAL_POINTS\)/);
  assert.match(script, /migrated\.demoPointsVersion = DEMO_POINTS_VERSION/);
  assert.doesNotMatch(script, /Math\.max\(Number\(migrated\.points\) \|\| 0, INITIAL_POINTS\)[\s\S]*?return migrated;[\s\S]*?Math\.max\(Number\(migrated\.points\) \|\| 0, INITIAL_POINTS\)/);
  assert.match(game, /saved\.points = INITIAL_POINTS/);
  assert.match(game, /root\.points \?\? INITIAL_POINTS/);
  assert.match(arena, /input\.points == null \? INITIAL_POINTS : input\.points/);
  assert.equal((html.match(/data-points>88,888,888/g) || []).length, 4);
  assert.match(html, /id="spiritPoints">88,888,888/);
  assert.doesNotMatch(script, /points: 3000/);
  assert.doesNotMatch(game, /saved\.points = 3000|root\.points \?\? 3000/);
  assert.doesNotMatch(arena, /input\.points == null \? 3000/);
});

test("recognition models warm in the background only after capture opens", () => {
  assert.match(script, /function openCapture\(\)[\s\S]*?startCamera\(\);[\s\S]*?Promise\.allSettled\(\[loadRecognitionModel\(\), loadBirdRecognitionModel\(\)\]\)/);
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
  assert.match(css, /\.site-view \{[^}]*background: linear-gradient\(145deg,#fbf8df 0%,#eef4d7 24%,#dceee0 58%,#bcded2 100%\)/);
  assert.match(css, /\.site-view-head \{[^}]*background: rgba\(238,244,215,\.78\)/);
  assert.match(css, /\.topbar \{[^}]*backdrop-filter:blur\(34px\) saturate\(1\.55\) contrast\(1\.06\)/);
  assert.match(css, /\.topbar::before \{[^}]*linear-gradient/);
  assert.match(css, /\.topbar::after \{[^}]*linear-gradient/);
});

test("collection cabinet exposes a display-only AI glasses preview", () => {
  assert.match(html, /class="ai-glasses-preview"[^>]+aria-disabled="true"[^>]+title="展览预览，暂未开放"/);
  assert.match(html, /data-lucide="glasses"/);
  assert.match(html, />AI眼镜预览</);
  assert.doesNotMatch(script, /ai-glasses-preview/);
});

test("display headings use ZCOOL XiaoWei and the explore message matches the campaign", () => {
  assert.match(html, /family=ZCOOL\+XiaoWei/);
  assert.match(css, /h1, h2 \{ font-family: "ZCOOL XiaoWei", "Noto Serif SC", serif !important; \}/);
  assert.match(html, /id="exploreTitle">让每一次<br>湿地相遇，<br>成为一张<br><em>生命卡片。<\/em>/);
});
