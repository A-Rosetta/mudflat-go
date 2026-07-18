import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [html, controller, css, script] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("arena.js", root), "utf8"),
  readFile(new URL("styles.css", root), "utf8"),
  readFile(new URL("script.js", root), "utf8")
]);

test("bird sanctuary exposes a separate wetland arena", () => {
  assert.match(html, /id="openBirdArena"/);
  assert.match(html, /id="birdArenaShell"[^>]+aria-label="湿地竞技"/);
  assert.match(html, /<script type="module" src="script\.js"><\/script>/);
  assert.match(script, /import\("\.\/game\.js"\)\.then\(\(\) => import\("\.\/arena\.js"\)\)/);
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

test("arena settles victory rewards against the battle day", () => {
  assert.match(controller, /claimArenaVictory\(root\.birdArena, battle\.levelId, battle\.day\)/);
});

test("arena includes lobby, targets, actions, result, and responsive layouts", () => {
  for (const token of ["arena-level-grid", "arena-team-mini", "arena-enemy", "data-arena-action", "arena-result"]) assert.match(controller, new RegExp(token));
  assert.match(css, /\.arena-shell/);
  assert.match(css, /\.arena-field/);
  assert.match(css, /@media \(max-width:680px\)[\s\S]*?\.arena-side > div \{ display:flex/);
  assert.match(css, /@media \(max-width:390px\)/);
});

test("player attacks and enemy counters fly between cards before battle redraw", () => {
  assert.match(controller, /async function animateArenaAttack/);
  assert.match(controller, /cloneNode\(true\)/);
  assert.equal((controller.match(/await animateArenaAttack\(/g) || []).length, 2);
  assert.match(controller, /arenaAnimationToken/);
  assert.match(css, /@keyframes arenaCardStrike/);
  assert.match(css, /\.arena-impact/);
  assert.match(css, /@keyframes arenaCardHit/);
});

test("arena telegraphs the next enemy attacker, target, and damage", () => {
  assert.match(controller, /previewArenaEnemyTurn/);
  assert.match(controller, /arena-intent/);
  assert.match(css, /\.arena-side button\.is-intent/);
  assert.match(css, /\.arena-side button\.is-threatened/);
});

test("arena exposes mechanical rules and each bird's tactical payoff", () => {
  assert.match(controller, /daily\.dailyEffect/);
  assert.match(controller, /level\.dailyEffect/);
  assert.match(controller, /function arenaSkillEffect/);
  for (const copy of ["屏障并拦截单体攻击", "削韧；击破或低生命目标增伤", "治疗全队并净化侵蚀", "延后敌方下一次行动"]) assert.match(controller, new RegExp(copy));
  for (const state of ["韧性", "屏障", "侵蚀", "吸收"]) assert.match(controller, new RegExp(state));
  assert.match(css, /\.arena-level-grid em \{[^}]*white-space:normal/);
});

test("arena exposes order-sensitive tidal chain feedback", () => {
  assert.match(controller, /function arenaChainCopy\(\)/);
  assert.match(controller, /arena-chain-label/);
  assert.match(controller, /event\.chainMultiplier > 1/);
  assert.match(controller, /const impactChainCount = supportTarget \? 0 : event\.chainCount/);
  assert.match(controller, /chainCount: impactChainCount/);
  assert.match(css, /\.arena-chain/);
  assert.match(css, /\.arena-side button\.is-chain-target/);
  assert.match(css, /\.arena-impact\.is-chain/);
});

test("mobile battle keeps fixed and daily mechanics visible", () => {
  assert.match(controller, /<em>\$\{level\.modifier\} · \$\{level\.dailyVariant\} · \$\{level\.dailyEffect\}<\/em>/);
  assert.match(css, /\.arena-status em \{ display:block; grid-column:1\/-1;/);
});

test("arena shows the uncharged skill state when preview is unavailable", () => {
  assert.match(controller, /if \(unit\.mp < 100\) return `未充能/);
  assert.match(controller, /<small>\$\{arenaSkillEffect\(activePlayer, skillPreview\)\}<\/small>/);
});

test("arena animates the selected ally's applied healing", () => {
  assert.match(controller, /event\.healingByTarget\[supportTarget\.id\]/);
  assert.doesNotMatch(controller, /label: event\.healing \? `\+\$\{event\.healing\}`/);
});
