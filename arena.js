import { BATTLE_ROSTER } from "./battle-engine.mjs";
import { getProgressionStats, normalizeProgression } from "./progression-engine.mjs";
import {
  ARENA_LEVELS,
  arenaDayKey,
  claimArenaVictory,
  createArenaBattle,
  dailyArenaLevel,
  normalizeArenaProgress,
  performArenaAction,
  performArenaEnemyTurn,
  previewArenaEnemyTurn
} from "./arena-engine.mjs";

const STORAGE_KEY = "mudflat-go-compact-state-v1";
const STARTERS = ["spoonbill", "kingfisher", "egret"];
const DEFAULT_LEVELS = { spoonbill: 5, kingfisher: 5, egret: 5, heron: 4 };
const birdCopy = {
  spoonbill: { name: "黑脸琵鹭", role: "守护", image: "assets/images/black-faced-spoonbill.jpg", skill: "琵琶扫食" },
  kingfisher: { name: "普通翠鸟", role: "输出", image: "assets/images/common-kingfisher.jpg", skill: "破水一闪" },
  egret: { name: "白鹭", role: "支援", image: "assets/images/little-egret.jpg", skill: "风过苇荡" },
  heron: { name: "夜鹭", role: "控制", image: "assets/images/night-heron.jpg", skill: "夜幕压制" }
};

const shell = document.getElementById("birdArenaShell");
let battle = null;
let selectedLevelId = 1;
let activePlayerId = "";
let activeEnemyId = "";
let logs = [];
let lastReward = 0;
let enemyTimer;
let returnFocus;
let audioContext;
let arenaAnimating = false;
let arenaAnimationToken = 0;

function readRoot() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function normalizeRoot(input) {
  const source = input.birdSpirits && typeof input.birdSpirits === "object" ? input.birdSpirits : {};
  const levels = source.profiles ? source.levels : { ...DEFAULT_LEVELS, ...(source.levels || {}) };
  const root = normalizeProgression({ ...input, points: input.points == null ? 300000 : input.points, birdSpirits: { ...source, levels } }, Object.keys(birdCopy));
  const saved = Array.isArray(source.team) ? [...new Set(source.team)] : [];
  const team = saved.filter(id => birdCopy[id]).slice(0, 3);
  for (const id of STARTERS) if (team.length < 3 && !team.includes(id)) team.push(id);
  root.birdSpirits = { ...root.birdSpirits, team };
  root.birdArena = normalizeArenaProgress(input.birdArena);
  root.points = Math.max(0, Number(root.points) || 0);
  return root;
}

function saveRoot(root) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  window.dispatchEvent(new CustomEvent("mudflat-state-changed", { detail: { source: "bird-arena", state: root } }));
}

function playerTeam(root) {
  return root.birdSpirits.team.map(id => {
    const base = BATTLE_ROSTER[id];
    const stats = getProgressionStats(root, id, { hp: base.hp, attack: base.attack, defense: base.defense });
    const attack = Math.max(8, Math.round(stats.attack / 10));
    return {
      id,
      ...birdCopy[id],
      level: stats.level,
      maxHp: Math.max(60, Math.round(stats.hp / 10)),
      attack,
      skillDamage: Math.max(attack + 8, Math.round(attack * (2.25 + stats.bonuses.skillPower)))
    };
  });
}

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function refreshIcons() {
  window.lucide?.createIcons?.({ attrs: { "stroke-width": 1.8 } });
}

function sound(frequency, duration = .14, type = "sine", volume = .04) {
  const root = normalizeRoot(readRoot());
  if (!root.birdArena.audioEnabled) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext ||= new Context();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {}
}

function renderLobby() {
  battle = null;
  clearTimeout(enemyTimer);
  const root = normalizeRoot(readRoot());
  const progress = root.birdArena;
  const today = arenaDayKey();
  const claimed = new Set(progress.claims[today] || []);
  const team = playerTeam(root);
  const cleared = progress.clearedThrough;
  shell.dataset.screen = "lobby";
  shell.innerHTML = `<div class="arena-backdrop-art" aria-hidden="true"></div>
    <header class="arena-header">
      <button type="button" data-arena-close aria-label="返回鸟灵档案">${icon("arrow-left")}<span>返回鸟灵</span></button>
      <div><small>${icon("trophy")} WETLAND ARENA</small><h1>湿地竞技</h1><p>三人编队 · 十关潮汐防线 · 每日首胜积分</p></div>
      <span class="arena-progress"><b>${cleared}<small>/10</small></b><em>已通关</em></span>
    </header>
    <section class="arena-lobby-intro">
      <div><small>DAILY STAGES · ${today}</small><h2>选择今日守卫任务</h2><p>完成当前关卡后开放下一关；同一关每天第一次胜利可以领取积分。</p></div>
      <button type="button" data-arena-sound aria-pressed="${progress.audioEnabled}">${icon(progress.audioEnabled ? "volume-2" : "volume-x")}<span>${progress.audioEnabled ? "音效开启" : "音效关闭"}</span></button>
    </section>
    <section class="arena-team-summary">
      <div><small>CURRENT FORMATION</small><h2>当前鸟灵编队</h2><p>阵容与等级来自鸟灵档案。</p></div>
      <div class="arena-team-mini">${team.map((unit, index) => `<article><b>0${index + 1}</b><img src="${unit.image}" alt=""><span><strong>${unit.name}</strong><small>Lv.${unit.level} · ${unit.role}</small></span></article>`).join("")}</div>
    </section>
    <section class="arena-mission-board" aria-labelledby="arenaMissionTitle">
      <header><div><small>MISSION BOARD</small><h2 id="arenaMissionTitle">十段潮汐防线</h2></div><span>${icon("lock-keyhole")} 顺序解锁</span></header>
      <div class="arena-level-grid">${ARENA_LEVELS.map(level => {
        const daily = dailyArenaLevel(level.id, today);
        const locked = level.id > progress.unlockedThrough;
        return `<button type="button" data-arena-level="${level.id}" class="${level.id === progress.unlockedThrough ? "is-next" : ""}" ${locked ? "disabled" : ""} aria-label="${locked ? `第${level.id}关未解锁` : `进入第${level.id}关 ${level.name}`}"><b>${String(level.id).padStart(2, "0")}</b><span><strong>${level.name}</strong><small>${level.zone} · ${level.threat}</small><em>${daily.dailyVariant}</em></span><span><strong>+${daily.dailyReward}</strong><small>${claimed.has(level.id) ? "今日已领" : locked ? "未解锁" : "积分"}</small></span>${locked ? icon("lock-keyhole") : icon("chevron-right")}</button>`;
      }).join("")}</div>
    </section>`;
  refreshIcons();
}

function startArena(levelId = selectedLevelId) {
  const root = normalizeRoot(readRoot());
  if (Number(levelId) > root.birdArena.unlockedThrough) return;
  selectedLevelId = Number(levelId);
  const level = dailyArenaLevel(selectedLevelId);
  battle = createArenaBattle(level, playerTeam(root));
  lastReward = 0;
  activePlayerId = battle.players[0].id;
  activeEnemyId = battle.enemies[0].id;
  const intent = previewArenaEnemyTurn(battle);
  const intentAttacker = battle.enemies.find(unit => unit.id === intent.attackerId);
  const intentTarget = battle.players.find(unit => unit.id === intent.targetId);
  logs = [`【系统】第 ${level.id} 关「${level.name}」已载入。`, `【系统】今日变异：${level.dailyVariant}；首胜奖励 +${level.dailyReward} 积分。`, `【潮讯】${intentAttacker.name}将反击${intentTarget.name}，预计造成 ${intent.damage} 点伤害。`];
  sound(196, .2, "triangle", .05);
  renderBattle();
}

function hpBar(unit) {
  return `<span class="arena-hp"><span><b>HP</b><em>${Math.max(0, unit.hp)} / ${unit.maxHp}</em></span><i><b style="width:${Math.max(0, unit.hp / unit.maxHp * 100)}%"></b></i></span>`;
}

const animationDelay = duration => new Promise(resolve => window.setTimeout(resolve, duration));

function clearArenaEffects() {
  arenaAnimating = false;
  shell.classList.remove("is-animating");
  shell.querySelectorAll(".is-launching,.is-taking-hit").forEach(node => node.classList.remove("is-launching", "is-taking-hit"));
  document.querySelectorAll(".arena-attack-ghost,.arena-impact").forEach(node => node.remove());
}

function cancelArenaEffects() {
  arenaAnimationToken += 1;
  clearArenaEffects();
}

async function animateArenaAttack(attacker, target, { damage, skill = false, enemy = false }) {
  if (!attacker || !target || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
  const start = attacker.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const flightX = end.left + end.width / 2 - start.left - start.width / 2;
  const flightY = end.top + end.height / 2 - start.top - start.height / 2;
  const ghost = attacker.cloneNode(true);
  ghost.removeAttribute("data-arena-player");
  ghost.removeAttribute("data-arena-enemy");
  ghost.removeAttribute("disabled");
  ghost.removeAttribute("aria-label");
  ghost.setAttribute("aria-hidden", "true");
  ghost.className = `arena-attack-ghost ${enemy ? "is-enemy" : "is-player"} ${skill ? "is-skill" : ""}`;
  Object.assign(ghost.style, {
    top: `${start.top}px`,
    left: `${start.left}px`,
    width: `${start.width}px`,
    height: `${start.height}px`
  });
  ghost.style.setProperty("--arena-flight-x", `${flightX}px`);
  ghost.style.setProperty("--arena-flight-y", `${flightY}px`);
  ghost.style.setProperty("--arena-pull-x", `${flightX * -.055}px`);
  ghost.style.setProperty("--arena-pull-y", `${flightY * -.055}px`);
  attacker.classList.add("is-launching");
  document.body.append(ghost);

  await animationDelay(390);
  if (!ghost.isConnected) return;
  target.classList.add("is-taking-hit");
  const targetRect = target.getBoundingClientRect();
  const impact = document.createElement("span");
  impact.className = `arena-impact ${skill ? "is-skill" : ""}`;
  impact.setAttribute("aria-hidden", "true");
  impact.style.left = `${targetRect.left + targetRect.width / 2}px`;
  impact.style.top = `${targetRect.top + targetRect.height / 2}px`;
  impact.innerHTML = `<i></i><i></i><i></i><b>-${damage}</b>`;
  document.body.append(impact);
  await animationDelay(350);
  ghost.remove();
  impact.remove();
  attacker.classList.remove("is-launching");
  target.classList.remove("is-taking-hit");
}

function renderBattle() {
  if (!battle) return;
  const level = dailyArenaLevel(battle.levelId);
  const activePlayer = battle.players.find(unit => unit.id === activePlayerId && unit.hp > 0) || battle.players.find(unit => unit.hp > 0);
  const activeEnemy = battle.enemies.find(unit => unit.id === activeEnemyId && unit.hp > 0) || battle.enemies.find(unit => unit.hp > 0);
  activePlayerId = activePlayer?.id || "";
  activeEnemyId = activeEnemy?.id || "";
  const finished = battle.status === "victory" || battle.status === "defeat";
  const intent = finished ? null : previewArenaEnemyTurn(battle);
  const intentAttacker = intent && battle.enemies.find(unit => unit.id === intent.attackerId);
  const intentTarget = intent && battle.players.find(unit => unit.id === intent.targetId);
  shell.dataset.screen = "battle";
  shell.innerHTML = `<div class="arena-backdrop-art" aria-hidden="true"></div>
    <header class="arena-header arena-battle-header">
      <button type="button" data-arena-lobby aria-label="返回竞技关卡">${icon("arrow-left")}<span>关卡大厅</span></button>
      <div><small>${icon("swords")} BATTLE MODE · STAGE ${String(level.id).padStart(2, "0")}</small><h1>${level.name}</h1><p>${level.zone} · ${level.modifier}</p></div>
      <span class="arena-round"><b>ROUND ${String(battle.round).padStart(2, "0")}</b><em>${battle.status === "enemy" ? "敌方回合" : finished ? "战斗结束" : "我方回合"}</em></span>
    </header>
    <section class="arena-status"><span>${icon("clock-3")} ${battle.status === "enemy" ? "敌方正在反击" : finished ? "结算完成" : `已行动 ${battle.acted.length}/${battle.players.filter(unit => unit.hp > 0).length}`}</span><strong class="arena-intent">${intent ? `${icon("radio")} ${intentAttacker.name} → ${intentTarget.name} · ${intent.damage}` : "潮线战斗结束"}</strong><em>${level.description}</em></section>
    <section class="arena-field">
      <div class="arena-side"><header><span>我方鸟灵</span><b>依次行动</b></header><div>${battle.players.map(unit => `<button type="button" data-arena-player="${unit.id}" class="${unit.id === activePlayerId ? "is-active" : ""} ${battle.acted.includes(unit.id) ? "has-acted" : ""} ${unit.defeated ? "is-defeated" : ""} ${intent?.targetId === unit.id ? "is-threatened" : ""}" ${unit.defeated || battle.acted.includes(unit.id) || battle.status !== "player" ? "disabled" : ""}>${intent?.targetId === unit.id ? `<mark class="arena-threat-label">${icon("crosshair")} 预计 -${intent.damage}</mark>` : ""}<img src="${unit.image}" alt=""><span><strong>${unit.name}</strong><small>${unit.role} · Lv.${unit.level}</small>${hpBar(unit)}<em>能量 ${unit.mp}/100</em></span></button>`).join("")}</div></div>
      <div class="arena-vs"><b>VS</b><span>${battle.lastEvent ? `-${battle.lastEvent.damage}` : "READY"}</span></div>
      <div class="arena-side arena-enemies"><header><span>入侵扩散队</span><b>点击选择目标</b></header><div>${battle.enemies.map(unit => `<button type="button" data-arena-enemy="${unit.id}" class="${unit.id === activeEnemyId ? "is-active" : ""} ${unit.defeated ? "is-defeated" : ""} ${intent?.attackerId === unit.id ? "is-intent" : ""}" ${unit.defeated || battle.status !== "player" ? "disabled" : ""}>${intent?.attackerId === unit.id ? `<mark class="arena-intent-label">${icon("radio")} 下一行动</mark>` : ""}<img src="${unit.image}" alt=""><span><strong>${unit.name}</strong><small>${unit.skillName} · ATK ${unit.attack}</small>${hpBar(unit)}</span></button>`).join("")}</div></div>
    </section>
    <section class="arena-console">
      <div class="arena-log"><header><span>${icon("shield")} BATTLE LOG</span><small>实时战况</small></header><div>${logs.slice(-8).map(line => `<p>${line}</p>`).join("")}</div></div>
      <div class="arena-actions"><header><span>${icon("zap")} 鸟灵行动</span><small>普通攻击累积 25 能量</small></header>${activePlayer ? `<div><span><img src="${activePlayer.image}" alt=""><b>${activePlayer.name}</b><small>${battle.acted.includes(activePlayer.id) ? "本回合已行动" : "当前行动"}</small></span><button type="button" data-arena-action="attack" ${battle.status !== "player" || battle.acted.includes(activePlayer.id) ? "disabled" : ""}>${icon("swords")}<span>普通攻击<small>${activePlayer.attack} 伤害 · 能量 +25</small></span></button><button type="button" data-arena-action="skill" ${battle.status !== "player" || battle.acted.includes(activePlayer.id) || activePlayer.mp < 100 ? "disabled" : ""}>${icon("sparkles")}<span>${activePlayer.skill}<small>${activePlayer.mp < 100 ? `未充能 ${activePlayer.mp}/100` : `${activePlayer.skillDamage} 伤害`}</small></span></button></div>` : ""}</div>
    </section>
    ${finished ? resultMarkup(level) : ""}`;
  refreshIcons();
  if (battle.status === "enemy") {
    clearTimeout(enemyTimer);
    enemyTimer = window.setTimeout(resolveEnemyTurn, 760);
  }
}

function resultMarkup(level) {
  const victory = battle.status === "victory";
  return `<div class="arena-result" role="alertdialog" aria-modal="true"><div><span>${victory ? "BATTLE CLEAR" : "BATTLE OVER"}</span><h2>${victory ? "潮汐防线守住了" : "暂时撤回鸟灵档案"}</h2><p>${victory ? `完成「${level.name}」，${lastReward ? `获得 ${lastReward} 积分` : "今日奖励已经领取"}` : "调整阵容或提升鸟灵等级后再次挑战。"}</p><div><button type="button" data-arena-lobby>${icon("arrow-left")} 关卡大厅</button><button type="button" data-arena-replay>${icon("rotate-cw")} 再战一次</button></div></div></div>`;
}

async function act(action) {
  if (!battle || !activePlayerId || !activeEnemyId || arenaAnimating) return;
  const before = battle;
  const attacker = before.players.find(unit => unit.id === activePlayerId);
  const target = before.enemies.find(unit => unit.id === activeEnemyId);
  const nextBattle = performArenaAction(before, { playerId: activePlayerId, enemyId: activeEnemyId, action });
  if (nextBattle === before || nextBattle.lastEvent === before.lastEvent) return;
  const token = ++arenaAnimationToken;
  arenaAnimating = true;
  shell.classList.add("is-animating");
  sound(action === "skill" ? 330 : 180, action === "skill" ? .26 : .14, action === "skill" ? "triangle" : "square", .06);
  await animateArenaAttack(
    shell.querySelector(`[data-arena-player="${activePlayerId}"]`),
    shell.querySelector(`[data-arena-enemy="${activeEnemyId}"]`),
    { damage: nextBattle.lastEvent.damage, skill: action === "skill" }
  );
  if (token !== arenaAnimationToken || shell.hidden) return;
  battle = nextBattle;
  logs.push(`【${attacker.name}】${action === "skill" ? `释放「${attacker.skill}」` : "普通攻击"}，对【${target.name}】造成 ${battle.lastEvent.damage} 点伤害。`);
  const targetAfter = battle.enemies.find(unit => unit.id === activeEnemyId);
  if (!targetAfter || targetAfter.defeated) activeEnemyId = battle.enemies.find(unit => unit.hp > 0)?.id || "";
  activePlayerId = battle.players.find(unit => unit.hp > 0 && !battle.acted.includes(unit.id))?.id || activePlayerId;
  if (battle.status === "victory") settleVictory();
  clearArenaEffects();
  renderBattle();
}

async function resolveEnemyTurn() {
  if (!battle || battle.status !== "enemy" || arenaAnimating) return;
  const nextBattle = performArenaEnemyTurn(battle);
  const event = nextBattle.lastEvent;
  const attacker = nextBattle.enemies.find(unit => unit.id === event.attackerId);
  const target = nextBattle.players.find(unit => unit.id === event.targetId);
  const token = ++arenaAnimationToken;
  arenaAnimating = true;
  shell.classList.add("is-animating");
  sound(82, .2, "sawtooth", .07);
  await animateArenaAttack(
    shell.querySelector(`[data-arena-enemy="${event.attackerId}"]`),
    shell.querySelector(`[data-arena-player="${event.targetId}"]`),
    { damage: event.damage, enemy: true }
  );
  if (token !== arenaAnimationToken || shell.hidden) return;
  battle = nextBattle;
  logs.push(`【${attacker.name}】反击【${target.name}】，造成 ${event.damage} 点伤害。`);
  activePlayerId = battle.players.find(unit => unit.hp > 0)?.id || "";
  if (battle.status === "player") logs.push("【系统】敌方行动结束，轮到我方三位鸟灵行动。");
  clearArenaEffects();
  renderBattle();
}

function settleVictory() {
  const root = normalizeRoot(readRoot());
  const settlement = claimArenaVictory(root.birdArena, battle.levelId);
  root.birdArena = settlement.progress;
  root.points += settlement.reward;
  lastReward = settlement.reward;
  saveRoot(root);
  logs.push(settlement.reward ? `【系统】首胜奖励：${settlement.reward} 积分；下一关已开放。` : "【系统】本关今日奖励已经领取。下一关保持开放。");
  sound(523, .45, "triangle", .08);
}

function toggleSound() {
  const root = normalizeRoot(readRoot());
  root.birdArena.audioEnabled = !root.birdArena.audioEnabled;
  saveRoot(root);
  if (root.birdArena.audioEnabled) sound(330, .12, "sine", .04);
  renderLobby();
}

function openArena() {
  returnFocus = document.activeElement;
  shell.hidden = false;
  document.body.classList.add("arena-open");
  renderLobby();
  shell.focus({ preventScroll: true });
}

function closeArena() {
  clearTimeout(enemyTimer);
  cancelArenaEffects();
  battle = null;
  shell.hidden = true;
  document.body.classList.remove("arena-open");
  returnFocus?.focus?.({ preventScroll: true });
}

document.getElementById("openBirdArena").addEventListener("click", openArena);
shell.addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.matches("[data-arena-close]")) closeArena();
  if (target.matches("[data-arena-lobby]")) renderLobby();
  if (target.matches("[data-arena-sound]")) toggleSound();
  if (target.matches("[data-arena-level]")) startArena(target.dataset.arenaLevel);
  if (target.matches("[data-arena-replay]")) startArena();
  if (target.matches("[data-arena-player]")) { activePlayerId = target.dataset.arenaPlayer; renderBattle(); }
  if (target.matches("[data-arena-enemy]")) { activeEnemyId = target.dataset.arenaEnemy; renderBattle(); }
  if (target.matches("[data-arena-action]")) act(target.dataset.arenaAction);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !shell.hidden) {
    event.preventDefault();
    closeArena();
  }
});
window.addEventListener("storage", event => { if (event.key === STORAGE_KEY && !shell.hidden && !battle) renderLobby(); });
