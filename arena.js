import { BATTLE_ROSTER } from "./battle-engine.mjs";
import { getProgressionStats, normalizeProgression } from "./progression-engine.mjs";
import {
  ARENA_LEVELS,
  arenaDayKey,
  claimArenaVictory,
  createArenaBattle,
  dailyArenaLevel,
  evaluateArenaMastery,
  normalizeArenaProgress,
  performArenaAction,
  performArenaEnemyTurn,
  previewArenaAction,
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
let lastSettlement = null;
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

function arenaLevelMastery(level, earnedIds = []) {
  const earned = new Set(earnedIds);
  const goals = evaluateArenaMastery(level);
  return `<span class="arena-level-mastery" aria-label="潮印 ${earned.size} / 3">${goals.map(goal => `<i data-lucide="star" class="${earned.has(goal.id) ? "is-earned" : ""}" aria-hidden="true"></i>`).join("")}<small>${earned.size}/3</small></span>`;
}

function arenaMasteryLive(level) {
  const goals = evaluateArenaMastery(level, battle);
  const roundLimit = level.id + 6;
  return `<section class="arena-mastery-live" aria-label="本关潮印目标">${goals.map(goal => {
    const failed = goal.id !== "chain" && !goal.complete;
    const status = goal.id === "survival"
      ? goal.complete ? "全员在阵" : "本局已失守"
      : goal.id === "chain"
        ? goal.complete ? "潮链 III 已达成" : `峰值 ${chainTier(battle.maxChain) || "0"} / III`
        : goal.complete ? `剩余 ${Math.max(0, roundLimit - battle.round)} 回合` : "本局已超时";
    return `<span class="${goal.complete ? "is-met" : failed ? "is-failed" : ""}">${icon(goal.icon)}<b>${goal.name}</b><small>${status}</small></span>`;
  }).join("")}</section>`;
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
  const masteryCount = Object.values(progress.mastery).reduce((total, goals) => total + goals.length, 0);
  shell.dataset.screen = "lobby";
  shell.innerHTML = `<div class="arena-backdrop-art" aria-hidden="true"></div>
    <header class="arena-header">
      <button type="button" data-arena-close aria-label="返回鸟灵档案">${icon("arrow-left")}<span>返回鸟灵</span></button>
      <div><small>${icon("trophy")} WETLAND ARENA</small><h1>湿地竞技</h1><p>三人编队 · 十关潮汐防线 · 每日首胜积分</p></div>
      <span class="arena-progress"><b>${cleared}<small>/10</small></b><em>${masteryCount}/30 潮印</em></span>
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
        return `<button type="button" data-arena-level="${level.id}" class="${level.id === progress.unlockedThrough ? "is-next" : ""}" ${locked ? "disabled" : ""} aria-label="${locked ? `第${level.id}关未解锁` : `进入第${level.id}关 ${level.name}；${daily.dailyVariant}：${daily.dailyEffect}`}"><b>${String(level.id).padStart(2, "0")}</b><span><strong>${level.name}</strong><small>${level.zone} · ${level.threat}</small><em title="${daily.dailyEffect}">${daily.dailyVariant} · ${daily.dailyEffect}</em>${arenaLevelMastery(daily, progress.mastery[level.id])}</span><span><strong>+${daily.dailyReward}</strong><small>${claimed.has(level.id) ? "今日已领" : locked ? "未解锁" : "积分"}</small></span>${locked ? icon("lock-keyhole") : icon("chevron-right")}</button>`;
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
  lastSettlement = null;
  activePlayerId = battle.players[0].id;
  activeEnemyId = battle.enemies[0].id;
  const intent = previewArenaEnemyTurn(battle);
  const intentAttacker = battle.enemies.find(unit => unit.id === intent.attackerId);
  const intentTarget = battle.players.find(unit => unit.id === intent.targetId);
  logs = [`【系统】第 ${level.id} 关「${level.name}」已载入：${level.modifier}。`, `【系统】今日变异：${level.dailyVariant} · ${level.dailyEffect}；首胜 +${level.dailyReward}。`, `【潮印】全员归潮 · 三潮成势 · ${level.id + 6} 回合内完成。`, `【潮讯】${intentAttacker.name}将反击${intentTarget.name}，预计造成 ${intent.damage} 点伤害。`];
  sound(196, .2, "triangle", .05);
  renderBattle();
}

function hpBar(unit) {
  const states = [unit.shield > 0 ? `屏障 ${unit.shield}` : "", unit.debuff || ""].filter(Boolean).join(" · ");
  return `<span class="arena-hp"><span><b>HP</b><em>${Math.max(0, unit.hp)} / ${unit.maxHp}</em></span><i><b style="width:${Math.max(0, unit.hp / unit.maxHp * 100)}%"></b></i>${states ? `<small>${states}</small>` : ""}</span>`;
}

function arenaSkillEffect(unit, preview) {
  if (unit.mp < 100) return `未充能 ${unit.mp}/100`;
  if (!preview) return "无可选目标";
  const chain = arenaChainEffect(preview);
  if (unit.id === "spoonbill") return `${preview.damage} 伤害${chain} · ${preview.barrier} 屏障并拦截单体攻击`;
  if (unit.id === "kingfisher") return `${preview.damage} 伤害${chain} · 削韧；击破或低生命目标增伤`;
  if (unit.id === "egret") return `${preview.healing} 治疗全队并净化侵蚀`;
  if (unit.id === "heron") return `${preview.damage} 伤害${chain} · 延后敌方下一次行动`;
  return `${preview.damage} 伤害${chain}`;
}

const chainTier = count => ["", "I", "II", "III"][Math.max(0, Math.min(3, Number(count) || 0))];
function arenaChainEffect(preview) {
  return preview?.chainMultiplier > 1 ? ` · 潮链 ${chainTier(preview.chainCount)} +${Math.round((preview.chainMultiplier - 1) * 100)}%` : "";
}
function arenaChainCopy() {
  const count = Number(battle?.chainCount) || 0;
  const target = battle?.enemies.find(unit => unit.id === battle.chainTargetId && unit.hp > 0);
  if (!count || !target) return `${icon("waves")} 潮链待命`;
  const bonus = Math.max(0, count - 1) * 12;
  return `${icon("waves")} 潮链 ${chainTier(count)} · ${target.name}${bonus ? ` +${bonus}%` : ""}`;
}

function arenaIntentCopy(intent, attacker, target) {
  if (intent.action === "delayed") return `${icon("pause")} ${attacker.name} · 行动已延后`;
  const protectedUnit = intent.protectedTargetId && battle.players.find(unit => unit.id === intent.protectedTargetId);
  const action = intent.action === "skill" ? "技能" : "攻击";
  const intercept = protectedUnit ? ` · 替${protectedUnit.name}拦截` : "";
  const absorbed = intent.absorbed ? ` · 屏障吸收 ${intent.absorbed}` : "";
  return `${icon("radio")} ${attacker.name} → ${target.name} · ${action} ${intent.damage}${intercept}${absorbed}`;
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

async function animateArenaAttack(attacker, target, { damage, label, skill = false, enemy = false, support = false, chainCount = 0 }) {
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
  ghost.className = `arena-attack-ghost ${enemy ? "is-enemy" : "is-player"} ${skill ? "is-skill" : ""} ${support ? "is-support" : ""} ${chainCount > 1 ? "is-chain" : ""}`;
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
  impact.className = `arena-impact ${skill ? "is-skill" : ""} ${support ? "is-support" : ""} ${chainCount > 1 ? "is-chain" : ""}`;
  impact.setAttribute("aria-hidden", "true");
  impact.style.left = `${targetRect.left + targetRect.width / 2}px`;
  impact.style.top = `${targetRect.top + targetRect.height / 2}px`;
  impact.innerHTML = `<i></i><i></i><i></i><b>${label || `-${damage}`}</b>${chainCount > 1 ? `<small>潮链 ${chainTier(chainCount)}</small>` : ""}`;
  document.body.append(impact);
  await animationDelay(350);
  ghost.remove();
  impact.remove();
  attacker.classList.remove("is-launching");
  target.classList.remove("is-taking-hit");
}

function renderBattle() {
  if (!battle) return;
  const level = dailyArenaLevel(battle.levelId, battle.day);
  const activePlayer = battle.players.find(unit => unit.id === activePlayerId && unit.hp > 0) || battle.players.find(unit => unit.hp > 0);
  const activeEnemy = battle.enemies.find(unit => unit.id === activeEnemyId && unit.hp > 0) || battle.enemies.find(unit => unit.hp > 0);
  activePlayerId = activePlayer?.id || "";
  activeEnemyId = activeEnemy?.id || "";
  const finished = battle.status === "victory" || battle.status === "defeat";
  const intent = finished ? null : previewArenaEnemyTurn(battle);
  const intentAttacker = intent && battle.enemies.find(unit => unit.id === intent.attackerId);
  const intentTarget = intent && battle.players.find(unit => unit.id === intent.targetId);
  const attackPreview = activePlayer && activeEnemy && previewArenaAction(battle, { playerId: activePlayer.id, enemyId: activeEnemy.id, action: "attack" });
  const skillPreview = activePlayer && activeEnemy && previewArenaAction(battle, { playerId: activePlayer.id, enemyId: activeEnemy.id, action: "skill" });
  const energyGain = battle.variant.attackEnergy || 25;
  const lastPulse = !battle.lastEvent ? "READY" : battle.lastEvent.chainCount > 1 ? `CHAIN ${chainTier(battle.lastEvent.chainCount)}` : Object.keys(battle.lastEvent.healingByTarget || {}).length ? `+${battle.lastEvent.healing}` : battle.lastEvent.delayed ? "DELAY" : `-${battle.lastEvent.damage}`;
  shell.dataset.screen = "battle";
  shell.innerHTML = `<div class="arena-backdrop-art" aria-hidden="true"></div>
    <header class="arena-header arena-battle-header">
      <button type="button" data-arena-lobby aria-label="返回竞技关卡">${icon("arrow-left")}<span>关卡大厅</span></button>
      <div><small>${icon("swords")} BATTLE MODE · STAGE ${String(level.id).padStart(2, "0")}</small><h1>${level.name}</h1><p>${level.zone} · ${level.modifier}</p></div>
      <span class="arena-round"><b>ROUND ${String(battle.round).padStart(2, "0")}</b><em>${battle.status === "enemy" ? "敌方回合" : finished ? "战斗结束" : "我方回合"}</em></span>
    </header>
    <section class="arena-status"><span class="arena-turn-state">${icon("clock-3")} ${battle.status === "enemy" ? "敌方正在反击" : finished ? "结算完成" : `已行动 ${battle.acted.length}/${battle.players.filter(unit => unit.hp > 0).length}`}<mark class="arena-chain ${battle.chainCount > 1 ? "is-linked" : ""}">${arenaChainCopy()}</mark></span><strong class="arena-intent">${intent ? arenaIntentCopy(intent, intentAttacker, intentTarget) : "潮线战斗结束"}</strong><em>${level.modifier} · ${level.dailyVariant} · ${level.dailyEffect}</em></section>
    ${arenaMasteryLive(level)}
    <section class="arena-field">
      <div class="arena-side"><header><span>我方鸟灵</span><b>依次行动</b></header><div>${battle.players.map(unit => `<button type="button" data-arena-player="${unit.id}" class="${unit.id === activePlayerId ? "is-active" : ""} ${battle.acted.includes(unit.id) ? "has-acted" : ""} ${unit.defeated ? "is-defeated" : ""} ${intent?.action !== "delayed" && intent?.targetId === unit.id ? "is-threatened" : ""}" ${unit.defeated || battle.acted.includes(unit.id) || battle.status !== "player" ? "disabled" : ""}>${intent?.action !== "delayed" && intent?.targetId === unit.id ? `<mark class="arena-threat-label">${icon("crosshair")} 预计 -${intent.damage}</mark>` : ""}<img src="${unit.image}" alt=""><span><strong>${unit.name}</strong><small>${unit.role} · Lv.${unit.level}</small>${hpBar(unit)}<em>能量 ${unit.mp}/100</em></span></button>`).join("")}</div></div>
      <div class="arena-vs"><b>VS</b><span>${lastPulse}</span></div>
      <div class="arena-side arena-enemies"><header><span>入侵扩散队</span><b>点击选择目标</b></header><div>${battle.enemies.map(unit => `<button type="button" data-arena-enemy="${unit.id}" class="${unit.id === activeEnemyId ? "is-active" : ""} ${unit.defeated ? "is-defeated" : ""} ${intent?.attackerId === unit.id ? "is-intent" : ""} ${battle.chainTargetId === unit.id ? "is-chain-target" : ""}" ${unit.defeated || battle.status !== "player" ? "disabled" : ""}>${intent?.attackerId === unit.id ? `<mark class="arena-intent-label">${icon(intent.action === "delayed" ? "pause" : "radio")} ${intent.action === "delayed" ? "行动延后" : "下一行动"}</mark>` : ""}${battle.chainTargetId === unit.id ? `<mark class="arena-chain-label">${icon("waves")} 潮链 ${chainTier(battle.chainCount)}</mark>` : ""}<img src="${unit.image}" alt=""><span><strong>${unit.name}</strong><small>${unit.skillName} · ATK ${unit.attack}</small>${hpBar(unit)}<em>韧性 ${unit.toughness}/${unit.maxToughness}${unit.broken ? " · 已击破" : ""}</em></span></button>`).join("")}</div></div>
    </section>
    <section class="arena-console">
      <div class="arena-log"><header><span>${icon("shield")} BATTLE LOG</span><small>实时战况</small></header><div>${logs.slice(-8).map(line => `<p>${line}</p>`).join("")}</div></div>
      <div class="arena-actions"><header><span>${icon("zap")} 鸟灵行动</span><small>普通攻击累积 ${energyGain} 能量</small></header>${activePlayer ? `<div><span><img src="${activePlayer.image}" alt=""><b>${activePlayer.name}</b><small>${battle.acted.includes(activePlayer.id) ? "本回合已行动" : "当前行动"}</small></span><button type="button" data-arena-action="attack" ${battle.status !== "player" || battle.acted.includes(activePlayer.id) ? "disabled" : ""}>${icon("swords")}<span>普通攻击<small>${attackPreview?.damage ?? activePlayer.attack} 伤害${arenaChainEffect(attackPreview)} · 能量 +${energyGain}</small></span></button><button type="button" data-arena-action="skill" ${battle.status !== "player" || battle.acted.includes(activePlayer.id) || activePlayer.mp < 100 ? "disabled" : ""}>${icon("sparkles")}<span>${activePlayer.skill}<small>${arenaSkillEffect(activePlayer, skillPreview)}</small></span></button></div>` : ""}</div>
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
  const goals = evaluateArenaMastery(level, battle);
  const newMastery = new Set(lastSettlement?.newMastery || []);
  const rewardCopy = [
    lastSettlement?.dailyReward ? `每日首胜 +${lastSettlement.dailyReward}` : "",
    lastSettlement?.masteryReward ? `新潮印 +${lastSettlement.masteryReward}` : ""
  ].filter(Boolean).join("，") || "今日奖励已领取，潮印记录未刷新";
  const mastery = victory ? `<section class="arena-mastery-result"><header><span>${icon("award")} 潮印评定</span><b>${goals.filter(goal => goal.complete).length}/3</b></header><div>${goals.map(goal => `<span class="${goal.complete ? "is-earned" : ""} ${newMastery.has(goal.id) ? "is-new" : ""}">${icon(goal.icon)}<b>${goal.name}</b><small>${goal.detail}</small><em>${newMastery.has(goal.id) ? "NEW" : goal.complete ? "达成" : "未达成"}</em></span>`).join("")}</div></section>` : "";
  return `<div class="arena-result" role="alertdialog" aria-modal="true"><div><span>${victory ? "BATTLE CLEAR" : "BATTLE OVER"}</span><h2>${victory ? "潮汐防线守住了" : "暂时撤回鸟灵档案"}</h2><p>${victory ? `完成「${level.name}」，${rewardCopy}` : "调整阵容或提升鸟灵等级后再次挑战。"}</p>${mastery}<div><button type="button" data-arena-lobby>${icon("arrow-left")} 关卡大厅</button><button type="button" data-arena-replay>${icon("rotate-cw")} 再战一次</button></div></div></div>`;
}

function arenaPlayerLog(attacker, target, event) {
  if (event.action === "skill" && attacker.id === "egret") return `【${attacker.name}】释放「${attacker.skill}」，治疗全队 ${event.healing} 点并净化侵蚀。`;
  const notes = [
    event.firstStrikeBonus > 1 ? "退潮首击" : "",
    event.armorAbsorbed ? `护甲吸收 ${event.armorAbsorbed}` : "",
    event.barrier ? `生成 ${event.barrier} 屏障` : "",
    event.toughnessDamage ? `削韧 ${event.toughnessDamage}` : "",
    event.execute ? "触发破势追击" : "",
    event.delayed ? "压后敌方行动" : "",
    event.chainMultiplier > 1 ? `潮链 ${chainTier(event.chainCount)} · 伤害 +${Math.round((event.chainMultiplier - 1) * 100)}%` : ""
  ].filter(Boolean);
  return `【${attacker.name}】${event.action === "skill" ? `释放「${attacker.skill}」` : "普通攻击"}，对【${target.name}】造成 ${event.damage} 点伤害${notes.length ? `；${notes.join("，")}` : ""}。`;
}

function arenaEnemyLog(attacker, target, event, players) {
  if (event.action === "delayed") return `【控制】夜幕压住【${attacker.name}】，本次行动延后。`;
  const protectedUnit = event.protectedTargetId && players.find(unit => unit.id === event.protectedTargetId);
  const notes = [
    protectedUnit ? `${target.name}替${protectedUnit.name}拦截` : "",
    event.absorbed ? `屏障吸收 ${event.absorbed}` : "",
    event.appliesDebuff ? `施加${event.appliesDebuff}` : ""
  ].filter(Boolean);
  return `【${attacker.name}】${event.action === "skill" ? "发动技能" : "反击"}【${target.name}】，造成 ${event.damage} 点伤害${notes.length ? `；${notes.join("，")}` : ""}。`;
}

async function act(action) {
  if (!battle || !activePlayerId || !activeEnemyId || arenaAnimating) return;
  const before = battle;
  const attacker = before.players.find(unit => unit.id === activePlayerId);
  const target = before.enemies.find(unit => unit.id === activeEnemyId);
  const nextBattle = performArenaAction(before, { playerId: activePlayerId, enemyId: activeEnemyId, action });
  if (nextBattle === before || nextBattle.lastEvent === before.lastEvent) return;
  const event = nextBattle.lastEvent;
  const supportTarget = event.action === "skill" && event.attackerId === "egret"
    ? before.players.filter(unit => unit.hp > 0).sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0]
    : null;
  const supportHealing = supportTarget ? event.healingByTarget[supportTarget.id] : 0;
  const impactChainCount = supportTarget ? 0 : event.chainCount;
  const token = ++arenaAnimationToken;
  arenaAnimating = true;
  shell.classList.add("is-animating");
  sound((action === "skill" ? 330 : 180) + Math.max(0, impactChainCount - 1) * 72, action === "skill" ? .26 : .14, action === "skill" ? "triangle" : "square", .06);
  await animateArenaAttack(
    shell.querySelector(`[data-arena-player="${activePlayerId}"]`),
    shell.querySelector(supportTarget ? `[data-arena-player="${supportTarget.id}"]` : `[data-arena-enemy="${activeEnemyId}"]`),
    { damage: event.damage, label: supportTarget ? `+${supportHealing}` : undefined, skill: action === "skill", support: Boolean(supportTarget), chainCount: impactChainCount }
  );
  if (token !== arenaAnimationToken || shell.hidden) return;
  battle = nextBattle;
  logs.push(arenaPlayerLog(attacker, target, event));
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
  sound(event.action === "delayed" ? 156 : 82, .2, event.action === "delayed" ? "triangle" : "sawtooth", .07);
  if (event.action === "delayed") await animationDelay(260);
  else await animateArenaAttack(
    shell.querySelector(`[data-arena-enemy="${event.attackerId}"]`),
    shell.querySelector(`[data-arena-player="${event.targetId}"]`),
    { damage: event.damage, label: event.damage ? undefined : "BLOCK", skill: event.action === "skill", enemy: true }
  );
  if (token !== arenaAnimationToken || shell.hidden) return;
  battle = nextBattle;
  logs.push(arenaEnemyLog(attacker, target, event, battle.players));
  activePlayerId = battle.players.find(unit => unit.hp > 0)?.id || "";
  if (battle.status === "player") logs.push("【系统】敌方行动结束，轮到我方三位鸟灵行动。");
  clearArenaEffects();
  renderBattle();
}

function settleVictory() {
  const root = normalizeRoot(readRoot());
  const earnedMastery = evaluateArenaMastery(dailyArenaLevel(battle.levelId, battle.day), battle).filter(goal => goal.complete).map(goal => goal.id);
  const settlement = claimArenaVictory(root.birdArena, battle.levelId, battle.day, earnedMastery);
  root.birdArena = settlement.progress;
  root.points += settlement.reward;
  lastSettlement = settlement;
  saveRoot(root);
  logs.push(settlement.reward ? `【系统】结算奖励：${settlement.reward} 积分${settlement.masteryReward ? `，其中新潮印 +${settlement.masteryReward}` : ""}；下一关已开放。` : "【系统】本关今日奖励已经领取。下一关保持开放。");
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
