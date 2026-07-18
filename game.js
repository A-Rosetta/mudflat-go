import { AFFINITY_MULTIPLIER, BATTLE_ROSTER, RANK_MULTIPLIER, calculateDamage, createBattleState, endPlayerTurn, playBattleCard } from "./battle-engine.mjs";
import {
  SIGIL_SETS,
  addSpiritExperience,
  ascendCost,
  ascendSpirit,
  equipSigil,
  experienceToNext,
  getProgressionStats,
  getSpiritTalent,
  getSpiritTraceNodes,
  levelUpCost,
  levelUpSpirit,
  normalizeProgression,
  resonanceFromCollection,
  skillUpgradeCost,
  unlockTrace,
  upgradeSkill
} from "./progression-engine.mjs";

const STORAGE_KEY = "mudflat-go-compact-state-v1";
const STARTERS = ["spoonbill", "kingfisher", "egret"];
const DEFAULT_LEVELS = { spoonbill: 5, kingfisher: 5, egret: 5, heron: 4 };
const affinityNames = { tide: "潮", wing: "羽", grove: "林" };
const skillTypeNames = { damage: "单体攻击", pierce: "穿透攻击", shield: "群体护盾", heal: "群体治疗", weaken: "攻击并削弱" };
const skillNames = { basic: "普攻", spell: "战技", ultimate: "终结技" };
const materialNames = { trainingDew: "晨露教材", insightPlume: "洞见翎羽", skillFeather: "技艺羽片", traceSeed: "轨迹种子" };
const traceNames = {
  "attack-sprout": "锐羽萌芽", "attack-current": "逐潮锋线", "attack-crown": "猎空冠羽",
  "survival-sprout": "苇间栖息", "survival-current": "潮涌护巢", "survival-crown": "湿地长守",
  "mechanism-tide": "潮律共振", "mechanism-echo": "回声迭奏"
};
const resonanceEffects = ["初次契约", "攻击 +5%", "生命 +8%", "防御 +8%", "技能威力 +10%", "全属性 +5%", "终结技威力 +20%"];
const talentCopy = {
  tidal_bulwark: { name: "潮汐壁垒", focus: "守护循环", description: "强化全队护盾，并在每回合拦截一次指向濒危队友的致命单体攻击。" },
  azure_break: { name: "苍蓝俯冲", focus: "弱点击破", description: "克制攻击会额外削减韧性，对已击破或低生命目标触发有限追击增伤。" },
  reed_rescue: { name: "苇荡祈祝", focus: "濒危救援", description: "每回合首次治疗濒危队友时提高回复量，高星治疗还能净化一项负面状态。" },
  nightfall_pressure: { name: "夜幕压制", focus: "削弱控制", description: "强化削弱幅度，终结技每场可将一次危险意图延后，制造安全输出窗口。" }
};

function bird(id, details) {
  const unit = BATTLE_ROSTER[id];
  return {
    id,
    ...details,
    affinity: unit.affinity,
    base: { hp: unit.hp, attack: unit.attack, defense: unit.defense },
    strike: { ...unit.strike, name: details.strike },
    tactic: { ...unit.tactic, name: details.tactic },
    ultimate: { ...unit.ultimate, name: details.ultimate }
  };
}

const birds = {
  spoonbill: bird("spoonbill", { name: "黑脸琵鹭", title: "潮汐守望", role: "守护", rarity: "SSR", image: "assets/images/black-faced-spoonbill.jpg", strike: "琵影横扫", tactic: "浅滩守望", ultimate: "万顷白潮", blindBoxId: "spoonbill" }),
  kingfisher: bird("kingfisher", { name: "普通翠鸟", title: "苍蓝瞬羽", role: "输出", rarity: "SR", image: "assets/images/common-kingfisher.jpg", strike: "破水一闪", tactic: "折光俯冲", ultimate: "碧空坠星", blindBoxId: "kingfisher" }),
  egret: bird("egret", { name: "白鹭", title: "芦雪回声", role: "支援", rarity: "SR", image: "assets/images/little-egret.jpg", strike: "雪羽轻击", tactic: "风过苇荡", ultimate: "澄明栖所", blindBoxId: "egret" }),
  heron: bird("heron", { name: "夜鹭", title: "暮色猎手", role: "控制", rarity: "SSR", image: "assets/images/night-heron.jpg", strike: "暮影啄击", tactic: "夜幕压制", ultimate: "月落无声", blindBoxId: "pond-heron" })
};

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = reduceMotionQuery.matches;
let battle = null;
let battleBusy = false;
let battleFinished = false;
let battleSession = 0;
let battleId = "";
let audioEnabled = true;
let audioContext;
let returnFocus;
let selectedSpirit = STARTERS[0];
let selectedTeamSlot = 0;
let activeSpiritTab = "growth";
let selectedEncounter = "normal";

function readRootState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = JSON.parse(raw || "{}");
    if (!raw && saved.points == null) saved.points = 300000;
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

function ownsBird(root, id) {
  const entry = birds[id];
  return Boolean(root.blindBoxCollection?.[entry.blindBoxId] || root.collectedSpecies?.includes(id));
}

function isUnlocked(root, id) {
  return STARTERS.includes(id) || ownsBird(root, id);
}

function normalizeRootState(input) {
  const source = input?.birdSpirits && typeof input.birdSpirits === "object" ? input.birdSpirits : {};
  const legacyLevels = source.levels || (source.profiles ? undefined : DEFAULT_LEVELS);
  const collection = { ...(input?.blindBoxCollection || {}) };
  for (const [id, entry] of Object.entries(birds)) if (entry.blindBoxId !== id && collection[entry.blindBoxId] != null) collection[id] = collection[entry.blindBoxId];
  const root = normalizeProgression({ ...input, blindBoxCollection: collection, birdSpirits: { ...source, levels: legacyLevels } }, Object.keys(birds));
  for (const id of Object.keys(birds)) root.birdSpirits.profiles[id].resonance = resonanceFromCollection(root.blindBoxCollection, birds[id].blindBoxId);
  const savedTeam = Array.isArray(source.team) ? [...new Set(source.team)] : [];
  const team = savedTeam.filter(id => birds[id] && isUnlocked(root, id)).slice(0, 3);
  for (const id of STARTERS) if (team.length < 3 && !team.includes(id)) team.push(id);
  root.birdSpirits = {
    ...root.birdSpirits,
    team,
    wins: Math.max(0, Math.round(Number(source.wins) || 0)),
    battles: Math.max(0, Math.round(Number(source.battles) || 0)),
    audioEnabled: source.audioEnabled !== false,
    lastSettlementId: typeof source.lastSettlementId === "string" ? source.lastSettlementId : ""
  };
  return root;
}

function mutateRoot(mutator) {
  const root = normalizeRootState(readRootState());
  const spirits = root.birdSpirits;
  if (!mutator(root, spirits)) return { root, spirits, changed: false };
  saveRoot(root);
  return { root, spirits, changed: true };
}

function currentState() {
  const root = normalizeRootState(readRootState());
  return { root, spirits: root.birdSpirits };
}

function saveRoot(root) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  window.dispatchEvent(new CustomEvent("mudflat-state-changed", { detail: { source: "bird-spirits", state: root } }));
}

function applyProgression(operation) {
  try {
    const next = operation(normalizeRootState(readRootState()));
    saveRoot(next);
    return { root: next, changed: true };
  } catch (error) {
    return { root: normalizeRootState(readRootState()), changed: false, error };
  }
}

function formatNumber(value) {
  return Math.max(0, Number(value) || 0).toLocaleString("zh-CN");
}

function affinityClass(affinity) {
  return `affinity-${affinity}`;
}

function refreshIcons() {
  window.lucide?.createIcons?.({ attrs: { "stroke-width": 1.8 } });
}

function notify(text) {
  const sanctuary = document.getElementById("spiritNotice");
  const battleMessage = document.getElementById("battleMessage");
  if (sanctuary) sanctuary.textContent = text;
  if (battle && battleMessage) {
    battleMessage.textContent = text;
    battleMessage.classList.remove("is-pulsing");
    if (!reducedMotion) void battleMessage.offsetWidth;
    battleMessage.classList.add("is-pulsing");
  }
}

function renderSanctuary() {
  const { root, spirits } = currentState();
  if (!birds[selectedSpirit] || !isUnlocked(root, selectedSpirit)) selectedSpirit = spirits.team[0];
  audioEnabled = spirits.audioEnabled;
  document.getElementById("spiritPoints").textContent = formatNumber(root.points ?? 300000);
  document.getElementById("spiritFragments").textContent = formatNumber(root.blindBoxFragments);
  document.querySelectorAll("[data-battle-encounter]").forEach(button => {
    const active = button.dataset.battleEncounter === selectedEncounter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.getElementById("spiritTeamPreview").innerHTML = spirits.team.map((id, index) => {
    const entry = birds[id];
    const profile = spirits.profiles[id];
    return `<article class="${selectedTeamSlot === index ? "is-active" : ""}" style="--slot:${index}"><button type="button" data-team-slot="${index}" aria-pressed="${selectedTeamSlot === index}" aria-label="选择第 ${index + 1} 出战位"><img src="${entry.image}" alt="${entry.name}"><span><small>0${index + 1} · ${entry.role}</small><b>${entry.name}</b><em>Lv.${profile.level} · 共鸣 ${profile.resonance}</em></span></button></article>`;
  }).join("");
  document.getElementById("spiritRoster").innerHTML = Object.values(birds).map(entry => {
    const unlocked = isUnlocked(root, entry.id);
    const selected = spirits.team.includes(entry.id);
    const profile = spirits.profiles[entry.id];
    const active = selectedSpirit === entry.id;
    return `<article class="spirit-card spirit-roster-card ${affinityClass(entry.affinity)} ${selected ? "is-selected" : ""} ${active ? "is-active" : ""} ${unlocked ? "" : "is-locked"}"><button type="button" data-select-bird="${entry.id}" ${unlocked ? "" : "disabled"}><img src="${entry.image}" alt=""><span><small>${entry.rarity} · ${affinityNames[entry.affinity]} · ${entry.role}</small><b>${entry.name}</b><em>Lv.${profile.level} · 共鸣 ${profile.resonance}</em></span></button><button type="button" data-team-bird="${entry.id}" aria-pressed="${selected}" ${!unlocked || selected ? "disabled" : ""}>${!unlocked ? "尚未唤醒" : selected ? "出战中" : `编入第 ${selectedTeamSlot + 1} 席`}</button></article>`;
  }).join("");
  renderSpiritDetail(root, spirits);
  syncSoundButton();
  refreshIcons();
}

function renderSpiritDetail(root, spirits) {
  const entry = birds[selectedSpirit];
  const profile = spirits.profiles[selectedSpirit];
  const stats = getProgressionStats(root, selectedSpirit, entry.base);
  const talent = getSpiritTalent(selectedSpirit);
  const copy = talentCopy[talent.id];
  document.getElementById("spiritProfile").innerHTML = `<header><img src="${entry.image}" alt="${entry.name}"><div><small>${entry.rarity} · ${entry.title} · ${affinityNames[entry.affinity]}属性</small><h2>${entry.name}</h2><p>${entry.role}定位 · 晋阶 ${profile.ascension}/3 · 共鸣 ${profile.resonance}/6</p></div></header><div class="spirit-stats"><span><b>${stats.hp}</b><small>生命</small></span><span><b>${stats.attack}</b><small>攻击</small></span><span><b>${stats.defense}</b><small>防御</small></span></div><article class="spirit-talent"><i data-lucide="sparkles"></i><span><small>专属天赋 · ${copy.focus}</small><b>${copy.name}</b><p>${copy.description}</p></span></article><p><b>${entry.strike.name}</b> / ${entry.tactic.name} / ${entry.ultimate.name}</p>`;
  document.querySelectorAll("[data-spirit-tab]").forEach(button => {
    const active = button.dataset.spiritTab === activeSpiritTab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  const body = document.getElementById("spiritDetailBody");
  body.dataset.tab = activeSpiritTab;
  body.setAttribute("aria-labelledby", `spirit-tab-${activeSpiritTab}`);
  if (activeSpiritTab === "growth") body.innerHTML = renderGrowthTab(root, profile, entry, stats);
  if (activeSpiritTab === "traces") body.innerHTML = renderTraceTab(root, profile);
  if (activeSpiritTab === "sigils") body.innerHTML = renderSigilTab(root, profile);
  if (activeSpiritTab === "resonance") body.innerHTML = renderResonanceTab(root, profile);
}

function materialStrip(root) {
  return `<div class="material-cost">${Object.entries(materialNames).map(([key, label]) => `<span><i data-lucide="${key === "trainingDew" ? "droplets" : key === "insightPlume" ? "feather" : key === "skillFeather" ? "sparkles" : "sprout"}"></i><small>${label}</small><b>${formatNumber(root.spiritMaterials[key])}</b></span>`).join("")}</div>`;
}

function costStrip(cost) {
  const values = [];
  if (cost.points) values.push(`${cost.points} 积分`);
  if (cost.blindBoxFragments) values.push(`${cost.blindBoxFragments} 碎片`);
  for (const [key, value] of Object.entries(cost.spiritMaterials || {})) values.push(`${value} ${materialNames[key]}`);
  return values.join(" · ");
}

function renderGrowthTab(root, profile, entry, stats) {
  const atCap = [5, 10, 15][profile.ascension] === profile.level;
  const nextLevel = profile.level < 20 && !atCap ? levelUpCost(profile.level) : null;
  const ascension = atCap && profile.ascension < 3 ? ascendCost(profile.ascension) : null;
  const expMax = experienceToNext(profile.level);
  const progress = expMax ? Math.round(profile.exp / expMax * 100) : 100;
  return `<header><div><small>GROWTH MATRIX</small><h3>等级与技能</h3></div><b>Lv.${profile.level} / 20</b></header>${materialStrip(root)}<div class="growth-track"><span><b>经验 ${profile.exp} / ${expMax || "MAX"}</b><small>晋阶 ${profile.ascension}/3</small></span><i style="--progress:${progress}%"></i></div><div class="growth-actions"><button type="button" data-growth-action="${ascension ? "ascend" : "level"}" ${profile.level >= 20 ? "disabled" : ""}><i data-lucide="${ascension ? "chevrons-up" : "arrow-up"}"></i><span>${profile.level >= 20 ? "等级已满" : ascension ? `晋阶至 ${profile.ascension + 1}` : `强化至 Lv.${profile.level + 1}`}<small>${profile.level >= 20 ? "所有等级节点已解锁" : costStrip(ascension || nextLevel)}</small></span></button></div><div class="skill-ranks">${Object.entries({ basic: entry.strike, spell: entry.tactic, ultimate: entry.ultimate }).map(([key, skill]) => { const rank = profile.skills[key]; const cost = rank < 6 ? skillUpgradeCost(rank) : null; return `<article><span><small>${skillNames[key]}</small><b>${skill.name}</b><em>Rank ${rank}/6 · ${skillTypeNames[skill.type]}</em></span><button type="button" data-skill-upgrade="${key}" ${rank >= 6 ? "disabled" : ""}>${rank >= 6 ? "已满" : "升级"}<small>${cost ? costStrip(cost) : ""}</small></button></article>`; }).join("")}</div><p>实战修正：技能 +${Math.round(stats.bonuses.skillPower * 100)}% · 终结技 +${Math.round(stats.bonuses.ultimatePower * 100)}%</p>`;
}

function renderTraceTab(root, profile) {
  const nodes = getSpiritTraceNodes(selectedSpirit);
  const statLabels = { attackPercent: "攻击", hpPercent: "生命", defensePercent: "防御", skillPower: "技能", ultimatePower: "终结技", shieldPower: "护盾", guardReduction: "减伤", breakPower: "破韧", executePower: "追击", healingPower: "治疗", cleansePower: "净化", debuffPower: "削弱", controlPower: "延迟" };
  return `<header><div><small>TRACE CONSTELLATION</small><h3>生态轨迹</h3></div><b>${profile.traces.length} / ${Object.keys(nodes).length}</b></header>${materialStrip(root)}<p>共享基础节点之外，每只鸟灵拥有两枚改变其定位机制的专属轨迹。</p><div class="trace-tree">${Object.entries(nodes).map(([id, node]) => { const unlocked = profile.traces.includes(id); const parentReady = !node.requires || profile.traces.includes(node.requires); const ready = !unlocked && parentReady && profile.level >= node.level && profile.ascension >= node.ascension; const effects = Object.entries(statLabels).flatMap(([key, label]) => node[key] ? [`${label} +${Math.round(node[key] * 100)}%`] : []); return `<button type="button" class="trace-node ${unlocked ? "is-unlocked" : ready ? "is-active" : "is-locked"}" data-trace-node="${id}" ${unlocked ? "disabled" : ""}><i data-lucide="${node.branch === "attack" ? "swords" : node.branch === "survival" ? "shield" : "waves"}"></i><b>${traceNames[id] || node.name}</b><small>${node.description || effects.join(" · ")}</small><small>${effects.join(" · ")} · Lv.${node.level} · 阶${node.ascension}</small></button>`; }).join("")}</div>`;
}

function sigilLabel(sigil) {
  const setNames = { reed: "苇盾", tide: "潮锋", flight: "翔羽" };
  const statNames = { hp: "生命", attack: "攻击", defense: "防御", hpPercent: "生命%", attackPercent: "攻击%", defensePercent: "防御%", skillPower: "技能威力", ultimatePower: "终结技" };
  return `${setNames[sigil.set]} · ${statNames[sigil.main.stat]} +${sigil.main.value < 1 ? Math.round(sigil.main.value * 100) + "%" : sigil.main.value}`;
}

function renderSigilTab(root, profile) {
  const inventory = root.birdSpirits.sigilInventory;
  const equippedSets = profile.sigils.flatMap(id => id ? [inventory[id].set] : []).reduce((counts, set) => ({ ...counts, [set]: (counts[set] || 0) + 1 }), {});
  const bonusText = bonus => Object.entries(bonus).map(([key, value]) => `${{ defensePercent: "防御", hpPercent: "生命", attackPercent: "攻击", skillPower: "技能", ultimatePower: "终结技" }[key]} +${Math.round(value * 100)}%`).join(" · ");
  return `<header><div><small>SIGIL LOADOUT</small><h3>羽印装配</h3></div><b>${Object.keys(inventory).length} 枚</b></header><p>同套两件与三件会激活额外效果；羽印从潮线演练结算中获得。</p><div class="sigil-grid">${profile.sigils.map((id, slot) => { const sigil = id ? inventory[id] : null; return `<button type="button" class="sigil-slot ${sigil ? "" : "is-empty"}" data-unequip-sigil="${slot}" ${sigil ? "" : "disabled"}><i data-lucide="${slot === 0 ? "feather" : slot === 1 ? "eye" : "shell"}"></i><span><b>${sigil ? sigilLabel(sigil) : `羽印槽 ${slot + 1}`}</b><small>${sigil ? "点击卸下" : "尚未装配"}</small></span></button>`; }).join("")}</div><div class="sigil-inventory">${Object.values(inventory).map(sigil => { const equipped = Object.values(root.birdSpirits.profiles).some(other => other.sigils.includes(sigil.id)); return `<button type="button" data-equip-sigil="${sigil.id}" data-sigil-slot="${sigil.slot}" ${profile.sigils[sigil.slot] === sigil.id ? "disabled" : ""}><i data-lucide="shield-check"></i><span><b>${sigilLabel(sigil)}</b><small>${equipped ? "将从其他鸟灵转移" : `装配至槽 ${sigil.slot + 1}`}</small></span></button>`; }).join("") || "<p>完成一次胜利即可获得首枚羽印。</p>"}</div><div class="set-bonuses">${Object.entries(SIGIL_SETS).map(([set, bonus]) => `<span class="${(equippedSets[set] || 0) >= 2 ? "is-active" : ""}"><b>${{ reed: "苇盾", tide: "潮锋", flight: "翔羽" }[set]} ${equippedSets[set] || 0}/3</b><small>2件 ${bonusText(bonus.two)}<br>3件 ${bonusText(bonus.three)}</small></span>`).join("")}</div>`;
}

function renderResonanceTab(root, profile) {
  const copies = root.blindBoxCollection?.[selectedSpirit];
  const count = Math.max(STARTERS.includes(selectedSpirit) ? 1 : 0, Number(typeof copies === "object" ? copies.count : copies) || 0);
  return `<header><div><small>RESONANCE PATH</small><h3>收藏共鸣</h3></div><b>${profile.resonance} / 6</b></header><div class="resonance-rank"><b>R${profile.resonance}</b><span><small>累计契约</small><b>${count} 次</b></span></div><p>盲盒重复品同时转化为生态碎片与角色共鸣。共鸣直接作用于养成数值，不建立第二套虚拟资源。</p><div class="resonance-list">${resonanceEffects.slice(1).map((effect, index) => `<article class="${profile.resonance > index ? "is-unlocked" : ""}"><b>R${index + 1}</b><span><strong>${effect}</strong><small>${profile.resonance > index ? "已激活" : `还需 ${Math.max(1, index + 2 - count)} 次契约`}</small></span></article>`).join("")}</div>`;
}

function replaceTeamMember(id) {
  const result = mutateRoot((root, spirits) => {
    if (!isUnlocked(root, id) || spirits.team.includes(id)) return false;
    spirits.team[selectedTeamSlot] = id;
    return true;
  });
  if (!result.changed) return;
  renderSanctuary();
  notify(`${birds[id].name} 已编入第 ${selectedTeamSlot + 1} 出战位`);
}

function progressionAction(operation, successMessage) {
  const result = applyProgression(operation);
  renderSanctuary();
  notify(result.changed ? successMessage : progressionError(result.error));
  if (result.changed) playTone(523, .22, "triangle", .05);
}

function progressionError(error) {
  const text = String(error?.message || "条件尚未满足");
  if (text.includes("points")) return "探索积分不足";
  if (text.includes("blindBoxFragments")) return "生态碎片不足，请从盲盒重复品获取";
  if (text.includes("trainingDew")) return "晨露教材不足，请完成潮线演练";
  if (text.includes("insightPlume")) return "洞见翎羽不足，请完成潮线演练";
  if (text.includes("skillFeather")) return "技艺羽片不足，请完成潮线演练";
  if (text.includes("traceSeed")) return "轨迹种子不足，请完成潮线演练";
  if (text.includes("ascension")) return "需要先完成对应晋阶";
  if (text.includes("level")) return "鸟灵等级未达到要求";
  if (text.includes("requires trace")) return "需要先解锁前置轨迹";
  return "当前养成条件尚未满足";
}

function battleIsCurrent(session) {
  return Boolean(battle && session === battleSession && !document.getElementById("battleShell").hidden);
}

function pause(milliseconds) {
  const delay = reducedMotion ? Math.min(40, Math.max(0, Math.round(milliseconds * .08))) : milliseconds;
  return new Promise(resolve => window.setTimeout(resolve, delay));
}

function createBattleId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function startBattle() {
  const shell = document.getElementById("battleShell");
  if (battle && !battleFinished && !shell.hidden) return;
  const { root, spirits } = currentState();
  if (spirits.team.length !== 3) { notify("请先编入三位鸟灵"); return; }
  if (shell.hidden) returnFocus = document.activeElement;
  battleSession++;
  battleId = createBattleId();
  battleBusy = false;
  battleFinished = false;
  const unitStats = Object.fromEntries(spirits.team.map(id => {
    const profile = spirits.profiles[id];
    const stats = getProgressionStats(root, id, birds[id].base);
    return [id, { ...stats, ...stats.bonuses, skills: profile.skills }];
  }));
  battle = createBattleState({
    seed: Date.now() & 0xffffffff,
    team: spirits.team,
    levels: Object.fromEntries(spirits.team.map(id => [id, spirits.profiles[id].level])),
    unitStats,
    boss: selectedEncounter === "boss"
  });
  shell.querySelectorAll(".ultimate-cut").forEach(node => node.remove());
  shell.classList.remove("is-ultimate", "hit-stop");
  shell.hidden = false;
  document.getElementById("battleResult").hidden = true;
  document.body.classList.add("battle-open");
  document.querySelector(".battle-hud span").textContent = battle.boss ? "赤潮首领 · 深圳湾" : "潮线演练 · 深圳湾";
  renderBattle();
  notify(battle.boss ? "首领拥有三阶段意图 · 优先击破弱点" : "选择咒羽，规划本回合三点行动");
  playTone(110, .12, "sine", .06);
  const session = battleSession;
  window.setTimeout(() => { if (battleIsCurrent(session)) playTone(220, .18, "triangle", .08); }, reducedMotion ? 30 : 100);
  document.getElementById("leaveBattle").focus({ preventScroll: true });
}

function renderBattle() {
  if (!battle) return;
  const { spirits } = currentState();
  document.getElementById("battleTurn").textContent = `TURN ${String(battle.turn).padStart(2, "0")}`;
  const intent = document.getElementById("enemyIntent");
  intent.className = `enemy-intent intent-${battle.intent.type}`;
  intent.querySelector("small").textContent = battle.enemy.weakened ? `敌方意图 · 削弱 ${battle.enemy.weakened}` : "敌方意图";
  intent.querySelector("b").textContent = `${battle.intent.label} · ${intentDamagePreview(battle)}`;
  const targeted = new Set(intentTargetIds(battle));
  document.getElementById("battleTeam").innerHTML = battle.team.map((unit, index) => {
    const entry = birds[unit.id];
    const hp = Math.max(0, unit.hp);
    const hpPercent = Math.max(0, Math.min(100, hp / unit.maxHp * 100));
    return `<article class="combatant ${affinityClass(unit.affinity)} ${hp <= 0 ? "is-down" : ""} ${targeted.has(unit.id) ? "is-targeted" : ""}" data-unit="${unit.id}" style="--position:${index}" aria-label="${entry.name}，生命 ${hp}/${unit.maxHp}，激情 ${unit.passion}/5${targeted.has(unit.id) ? "，敌方目标" : ""}"><div class="combatant-portrait"><img src="${entry.image}" alt="${entry.name}"><i></i></div><div class="combatant-meta"><span><small>${entry.role} · Lv.${spirits.profiles[unit.id].level}</small><b>${entry.name}</b></span><div class="combat-bar"><i style="width:${hpPercent}%"></i><b>${hp} / ${unit.maxHp}</b></div><div class="passion" aria-label="激情 ${unit.passion}/5">${Array.from({ length: 5 }, (_, position) => `<i class="${position < unit.passion ? "is-full" : ""}"></i>`).join("")}</div>${unit.shield ? `<em class="unit-shield"><i data-lucide="shield"></i>${unit.shield}</em>` : ""}${unit.buffs?.length ? `<small class="status-line">${unit.buffs.map(status => `${status.id} ${status.duration}`).join(" · ")}</small>` : ""}</div></article>`;
  }).join("");
  const enemyHp = Math.max(0, battle.enemy.hp);
  document.getElementById("enemyLevel").textContent = battle.boss ? "BOSS · LV.10" : "NORMAL · LV.7";
  document.getElementById("enemyName").textContent = battle.boss ? "赤潮霸螯" : "污潮巨螯";
  document.getElementById("enemyHpBar").style.width = `${Math.max(0, Math.min(100, enemyHp / battle.enemy.maxHp * 100))}%`;
  document.getElementById("enemyHpText").textContent = `${enemyHp} / ${battle.enemy.maxHp}`;
  const shield = document.getElementById("enemyShield");
  shield.hidden = !battle.enemy.shield;
  shield.querySelector("span").textContent = battle.enemy.shield;
  const timeline = battle.timeline || battle.actionOrder || [];
  document.getElementById("battleTimeline").innerHTML = timeline.map((item, index) => {
    const enemy = item.side === "enemy" || item.id === "enemy";
    const entry = enemy ? null : birds[item.id];
    return `<span class="timeline-unit ${enemy ? "is-enemy" : ""} ${index === 0 ? "is-current" : ""} ${item.down ? "is-down" : ""}" title="${enemy ? "污潮巨螯" : entry?.name || item.id}${item.delayed ? " · 行动延后" : ""}"><img src="${enemy ? "assets/images/fiddler-crab.jpg" : entry?.image}" alt="${enemy ? "敌方" : entry?.name || "鸟灵"}"></span>`;
  }).join("");
  const weaknesses = battle.enemy.weaknesses || Object.keys(affinityNames).filter(affinity => AFFINITY_MULTIPLIER[affinity][battle.enemy.affinity] > 1);
  document.getElementById("enemyWeaknesses").innerHTML = weaknesses.map(affinity => `<span class="${affinity}">${affinityNames[affinity]}弱点</span>`).join("");
  const toughness = document.getElementById("enemyToughness");
  const maxToughness = battle.enemy.maxToughness || 1;
  const toughnessValue = Math.max(0, battle.enemy.toughness || 0);
  toughness.classList.toggle("is-broken", Boolean(battle.enemy.broken));
  toughness.style.setProperty("--toughness", `${toughnessValue / maxToughness * 100}%`);
  toughness.innerHTML = `<span><small>${battle.enemy.broken ? "弱点击破 · 受伤提高" : "弱韧性"}</small><b>${toughnessValue} / ${maxToughness}</b></span><i></i>`;
  const combo = battle.combo || battle.link || { value: 0, max: 2 };
  const comboMeter = document.getElementById("comboMeter");
  comboMeter.classList.toggle("is-active", combo.value > 0);
  comboMeter.querySelector("b").textContent = combo.value;
  comboMeter.querySelector("small").textContent = combo.value >= combo.max ? "连携满溢" : "交替出牌增伤";
  document.getElementById("actionPoints").innerHTML = Array.from({ length: 3 }, (_, index) => `<i class="${index < battle.ap ? "is-full" : ""}"></i>`).join("");
  const endTurn = document.getElementById("endTurn");
  endTurn.disabled = battleBusy || battleFinished || battle.status !== "player";
  renderHand();
  refreshIcons();
}

function intentTargetIds(state) {
  const alive = state.team.filter(unit => unit.hp > 0);
  if (state.enemy.actionDelay > 0 || !["attack", "burst", "mark"].includes(state.intent.type)) return [];
  if (state.intent.type === "burst") return alive.map(unit => unit.id);
  const target = [...alive].sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
  return target ? [target.id] : [];
}

function intentDamagePreview(state) {
  const { intent, enemy } = state;
  if (enemy.actionDelay > 0) return "行动延后";
  if (intent.type === "guard") return `护盾 ${Math.round(enemy.maxHp * intent.power)}`;
  if (intent.type === "recover") return `恢复 ${Math.round(enemy.maxHp * intent.power)}`;
  const targets = intentTargetIds(state).map(id => state.team.find(unit => unit.id === id)).filter(Boolean);
  if (!targets.length) return `${Math.round((intent.power || 0) * 100)}%`;
  const values = targets.map(target => {
    const affinity = AFFINITY_MULTIPLIER[enemy.affinity]?.[target.affinity] || 1;
    const exposed = target.debuffs?.find(status => status.id === "exposed")?.magnitude || 0;
    const base = enemy.attack * intent.power * affinity * (enemy.weakened ? .78 : 1) * (1 + exposed);
    return Math.max(1, Math.round(base - target.defense * .35));
  });
  if (intent.type !== "burst") return `目标 ${birds[targets[0].id].name} · 约 ${values[0]}`;
  return `全体约 ${Math.min(...values)}-${Math.max(...values)}`;
}

function renderHand() {
  const hand = document.getElementById("battleHand");
  hand.innerHTML = battle.hand.map((card, index) => {
    const entry = birds[card.owner];
    const unit = battle.team.find(member => member.id === card.owner);
    const skill = card.ultimate ? entry.ultimate : entry[card.skill];
    const unavailable = battleBusy || battleFinished || battle.status !== "player" || battle.ap <= 0 || !unit || unit.hp <= 0 || (card.ultimate && unit.passion < 5);
    const prediction = predictCardValue(unit, skill, card);
    const detail = card.ultimate ? `终结技 · ${prediction} · 5 激情` : `${skillTypeNames[skill.type]} · ${prediction}`;
    return `<button class="skill-card ${affinityClass(entry.affinity)} ${card.ultimate ? "is-ultimate" : ""}" type="button" data-card-index="${index}" ${unavailable ? "disabled" : ""} style="--card:${index}" aria-label="${entry.name} ${skill.name}，${detail}"><img src="${entry.image}" alt=""><span class="skill-rank">${"★".repeat(card.rank)}</span><span class="skill-owner">${entry.name}</span><b>${skill.name}</b><small>${detail}</small></button>`;
  }).join("");
}

function predictCardValue(unit, skill, card) {
  const rank = card.ultimate ? 1 : card.rank;
  const scale = RANK_MULTIPLIER[rank] || 1;
  const link = (battle.combo || battle.link)?.value || 0;
  const skillKey = card.ultimate ? "ultimate" : card.skill === "strike" ? "basic" : "spell";
  const growthPower = 1 + ((unit.skills?.[skillKey] || 1) - 1) * .05 + (card.ultimate ? unit.ultimatePower || 0 : unit.skillPower || 0);
  const linkPower = 1 + link * .02;
  const power = skill.power * growthPower * linkPower * (battle.enemy.broken ? 1.2 : 1);
  if (["damage", "pierce", "weaken"].includes(skill.type)) {
    const defense = skill.type === "pierce" ? battle.enemy.defense * .45 : battle.enemy.defense;
    const affinity = AFFINITY_MULTIPLIER[unit.affinity][battle.enemy.affinity];
    const low = calculateDamage({ attack: unit.attack, defense, power, rank, affinity, variance: .96 });
    const high = calculateDamage({ attack: unit.attack, defense, power, rank, affinity, variance: 1.04 });
    return `${low}-${high} 伤害`;
  }
  return `${Math.round(unit.attack * power * scale)} ${skill.type === "heal" ? "治疗" : "护盾"}`;
}

async function playCard(index) {
  if (!battle || battleBusy || battleFinished || battle.status !== "player" || battle.ap <= 0) return;
  const card = battle.hand[index];
  const unit = card && battle.team.find(member => member.id === card.owner);
  if (!card || !unit || unit.hp <= 0 || (card.ultimate && unit.passion < 5)) return;
  const session = battleSession;
  const entry = birds[unit.id];
  const skill = card.ultimate ? entry.ultimate : entry[card.skill];
  battleBusy = true;
  renderBattle();
  notify(`${entry.name} · ${skill.name}`);
  let ultimateBanner;
  if (card.ultimate) ultimateBanner = await beginUltimate(entry, session);
  else {
    document.querySelector(`[data-unit="${unit.id}"]`)?.classList.add("is-attacking");
    playWhoosh(card.rank);
    await pause(220);
  }
  if (!battleIsCurrent(session)) return;
  const previous = battle;
  const next = playBattleCard(previous, index);
  if (next.ap === previous.ap) {
    battleBusy = false;
    ultimateBanner?.remove();
    renderBattle();
    return;
  }
  battle = next;
  renderBattle();
  applyPlayerEffect(previous, next, card, unit, ultimateBanner);
  await pause(card.ultimate ? 520 : 360);
  ultimateBanner?.remove();
  document.getElementById("battleShell").classList.remove("is-ultimate");
  if (!battleIsCurrent(session)) return;
  if (battle.status === "victory") { finishBattle(true, session); return; }
  battleBusy = false;
  renderBattle();
  if (battle.ap <= 0) await enemyPhase(session);
}

async function beginUltimate(entry, session) {
  const shell = document.getElementById("battleShell");
  const banner = document.createElement("div");
  banner.className = `ultimate-cut ${affinityClass(entry.affinity)}`;
  banner.innerHTML = `<img src="${entry.image}" alt=""><span><small>ULTIMATE INCANTATION</small><b>${entry.ultimate.name}</b><em>${entry.name}</em></span>`;
  shell.appendChild(banner);
  shell.classList.add("is-ultimate");
  playUltimateSound(session);
  await pause(760);
  if (!battleIsCurrent(session)) { banner.remove(); return null; }
  banner.classList.add("is-releasing");
  await pause(220);
  return banner;
}

function applyPlayerEffect(previous, next, card, unit, ultimateBanner) {
  const log = next.log.at(-1);
  if (!log) return;
  if (log.type === "damage") {
    const advantage = AFFINITY_MULTIPLIER[unit.affinity][next.enemy.affinity] > 1;
    impact(document.getElementById("battleEnemy"), log.value, advantage, card.ultimate);
    const status = next.enemy.weakened > previous.enemy.weakened ? ` · 敌方削弱 ${next.enemy.weakened}` : "";
    if (advantage || status) notify(`${birds[unit.id].name}${advantage ? " 触发属性克制 ×1.30" : ""}${status}`);
  } else {
    teamEffect(log.type, log.value);
  }
  const broken = next.events?.find(event => event.type === "break");
  const link = next.events?.find(event => event.type === "link_gain");
  const ultimateReady = next.events?.find(event => event.type === "ultimate_ready");
  if (broken) triggerBattleEvent("弱点击破 · 敌方行动延后", "break");
  else if (link) triggerBattleEvent(`连携 ${link.value} · 技能增幅`, "combo");
  if (ultimateReady) notify(`${birds[ultimateReady.owner].name} 激情已满 · 终结技入手`);
  if (ultimateBanner) ultimateBanner.classList.add("is-releasing");
}

function triggerBattleEvent(label, type) {
  const shell = document.getElementById("battleShell");
  const tag = document.createElement("div");
  tag.className = `battle-event-tag is-${type} is-triggered`;
  tag.textContent = label;
  shell.appendChild(tag);
  window.setTimeout(() => tag.remove(), reducedMotion ? 180 : 950);
}

async function enemyPhase(requestSession = battleSession) {
  if (!battleIsCurrent(requestSession) || battleBusy || battleFinished || battle.status !== "player" || battle.enemy.hp <= 0) return;
  const session = requestSession;
  const intent = battle.intent;
  const previous = battle;
  battleBusy = true;
  renderBattle();
  notify(`敌方行动 · ${intent.label}`);
  await pause(520);
  if (!battleIsCurrent(session)) return;
  if (["attack", "burst", "mark"].includes(intent.type) && previous.enemy.actionDelay <= 0) {
    const enemy = document.getElementById("battleEnemy");
    enemy.classList.remove("is-attacking");
    if (!reducedMotion) void enemy.offsetWidth;
    enemy.classList.add("is-attacking");
    playWhoosh(intent.type === "burst" ? 3 : 1);
    await pause(260);
  }
  if (!battleIsCurrent(session)) return;
  battle = endPlayerTurn(previous);
  renderBattle();
  applyEnemyEffect(previous, battle, intent);
  await pause(intent.type === "burst" ? 520 : 360);
  document.getElementById("battleEnemy").classList.remove("is-attacking");
  if (!battleIsCurrent(session)) return;
  if (battle.status === "defeat") { finishBattle(false, session); return; }
  battleBusy = false;
  renderBattle();
  notify("潮线重构 · 选择本回合咒羽");
}

function applyEnemyEffect(previous, next, intent) {
  if (next.events?.some(event => event.type === "enemy_delayed")) {
    triggerBattleEvent("击破延迟 · 敌方行动取消", "break");
    playTone(180, .3, "sine", .05);
    return;
  }
  if (intent.type === "guard") {
    floatingNumber(document.getElementById("battleEnemy"), `◇${Math.max(0, next.enemy.shield - previous.enemy.shield)}`, "shield");
    playTone(310, .25, "sine", .07);
    return;
  }
  if (intent.type === "recover") {
    floatingNumber(document.getElementById("battleEnemy"), `+${Math.max(0, next.enemy.hp - previous.enemy.hp)}`, "heal");
    playTone(520, .25, "sine", .07);
    return;
  }
  for (const before of previous.team) {
    const after = next.team.find(unit => unit.id === before.id);
    const hpLoss = Math.max(0, before.hp - after.hp);
    const shieldLoss = Math.max(0, before.shield - after.shield);
    if (!hpLoss && !shieldLoss) continue;
    impact(document.querySelector(`[data-unit="${before.id}"]`), hpLoss || shieldLoss, false, intent.type === "burst");
  }
}

function teamEffect(type, value) {
  document.querySelectorAll(".combatant:not(.is-down)").forEach(node => {
    node.classList.add(`effect-${type}`);
    floatingNumber(node, `${type === "heal" ? "+" : "◇"}${value}`, type);
    const session = battleSession;
    window.setTimeout(() => { if (battleIsCurrent(session)) node.classList.remove(`effect-${type}`); }, reducedMotion ? 40 : 650);
  });
  playTone(type === "heal" ? 520 : 310, .25, "sine", .07);
}

function impact(target, damage, advantage, ultimate) {
  if (!target) return;
  target.classList.remove("is-hit");
  if (!reducedMotion) void target.offsetWidth;
  target.classList.add("is-hit");
  const shell = document.getElementById("battleShell");
  const field = document.getElementById("battlefield");
  if (!reducedMotion) {
    field.classList.toggle("heavy-impact", ultimate);
    shell.classList.add("hit-stop");
  }
  floatingNumber(target, damage, advantage ? "advantage" : "damage");
  spawnParticles(target, ultimate ? 28 : 12, advantage);
  playImpact(ultimate);
  const session = battleSession;
  window.setTimeout(() => {
    if (!battleIsCurrent(session)) return;
    target.classList.remove("is-hit");
    shell.classList.remove("hit-stop");
    field.classList.remove("heavy-impact");
  }, reducedMotion ? 40 : ultimate ? 520 : 420);
}

function floatingNumber(target, value, type) {
  if (!target) return;
  const number = document.createElement("strong");
  number.className = `floating-number ${type}`;
  number.textContent = value;
  target.appendChild(number);
  window.setTimeout(() => number.remove(), reducedMotion ? 80 : 1000);
}

function spawnParticles(target, count, advantage) {
  if (reducedMotion) return;
  const layer = document.getElementById("battleParticles");
  if (!layer || !target) return;
  const targetRect = target.getBoundingClientRect();
  const shellRect = layer.getBoundingClientRect();
  for (let index = 0; index < count; index++) {
    const particle = document.createElement("i");
    particle.style.cssText = `--x:${targetRect.left - shellRect.left + targetRect.width * .45}px;--y:${targetRect.top - shellRect.top + targetRect.height * .42}px;--dx:${(Math.random() - .5) * 260}px;--dy:${(Math.random() - .5) * 220}px;--delay:${Math.random() * 80}ms;--color:${advantage ? "#f5e875" : "#b6f4e5"}`;
    layer.appendChild(particle);
    window.setTimeout(() => particle.remove(), 900);
  }
}

function finishBattle(victory, session = battleSession) {
  if (!battleIsCurrent(session) || battleFinished) return;
  battleFinished = true;
  battleBusy = true;
  let rewardText = "";
  let dropName = "";
  const settled = mutateRoot((root, spirits) => {
    if (spirits.lastSettlementId === battleId) return false;
    spirits.lastSettlementId = battleId;
    spirits.battles++;
    if (victory) {
      spirits.wins++;
      const multiplier = battle.boss ? 2 : 1;
      root.spiritMaterials.trainingDew += 8 * multiplier;
      root.points = Number(root.points ?? 300000) + 160 * multiplier;
      root.spiritMaterials.insightPlume += multiplier;
      root.spiritMaterials.skillFeather += 3 * multiplier;
      root.spiritMaterials.traceSeed += 2 * multiplier;
      if (spirits.wins <= 9) dropName = grantBattleSigil(spirits, spirits.wins);
      rewardText = `${160 * multiplier} 积分、${8 * multiplier} 晨露教材、${multiplier} 洞见翎羽、${3 * multiplier} 技艺羽片、${2 * multiplier} 轨迹种子${dropName ? `，并获得${dropName}` : ""}`;
    } else {
      root.spiritMaterials.trainingDew += 2;
      rewardText = "2 晨露教材";
    }
    return true;
  });
  if (settled.changed) {
    let next = settled.root;
    for (const id of next.birdSpirits.team) next = addSpiritExperience(next, id, victory ? 72 : 24);
    saveRoot(next);
  }
  const result = document.getElementById("battleResult");
  document.getElementById("battleResultKicker").textContent = victory ? "TIDAL LINE SECURED" : "TACTICAL RETREAT";
  document.getElementById("battleResultTitle").textContent = victory ? "潮线已净化" : "回响暂时沉寂";
  document.getElementById("battleResultCopy").textContent = victory
    ? `历经 ${battle.turn} 回合，${settled.changed ? `获得 ${rewardText}` : "本场奖励已结算"}。重复盲盒继续提供晋阶碎片与共鸣。`
    : `${settled.changed ? `获得 ${rewardText} 与队伍经验。` : "本场奖励已结算。"}观察意图、击破弱点后再次尝试。`;
  result.hidden = false;
  playTone(victory ? 392 : 146, .5, victory ? "triangle" : "sine", .09);
  if (victory) window.setTimeout(() => { if (battleIsCurrent(session)) playTone(523, .7, "triangle", .08); }, reducedMotion ? 40 : 240);
  document.getElementById("battleAgain").focus({ preventScroll: true });
}

function grantBattleSigil(spirits, win) {
  const sets = ["tide", "reed", "flight"];
  const set = sets[Math.floor((win - 1) / 3) % sets.length];
  const slot = (win - 1) % 3;
  const id = `tide-line-${win}`;
  const mains = [
    { stat: "attackPercent", value: .08 + Math.floor((win - 1) / 3) * .02 },
    { stat: "defensePercent", value: .08 + Math.floor((win - 1) / 3) * .02 },
    { stat: "hpPercent", value: .1 + Math.floor((win - 1) / 3) * .02 }
  ];
  spirits.sigilInventory[id] = { id, set, slot, main: mains[slot], subs: [{ stat: slot === 0 ? "hp" : "attack", value: 8 + win * 2 }] };
  return `${{ tide: "潮锋", reed: "苇盾", flight: "翔羽" }[set]}羽印`;
}

function closeBattle() {
  const shell = document.getElementById("battleShell");
  if (shell.hidden) return;
  battleSession++;
  battle = null;
  battleBusy = false;
  battleFinished = false;
  battleId = "";
  shell.hidden = true;
  shell.classList.remove("is-ultimate", "hit-stop");
  shell.querySelectorAll(".ultimate-cut,.floating-number,.battle-event-tag").forEach(node => node.remove());
  document.getElementById("battleParticles").replaceChildren();
  document.getElementById("battleEnemy").classList.remove("is-attacking", "is-hit");
  document.getElementById("battlefield").classList.remove("heavy-impact");
  document.body.classList.remove("battle-open");
  renderSanctuary();
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
}

function syncSoundButton() {
  const button = document.getElementById("battleSound");
  if (!button) return;
  button.classList.toggle("is-muted", !audioEnabled);
  button.setAttribute("aria-pressed", String(audioEnabled));
  button.setAttribute("aria-label", audioEnabled ? "关闭战斗音效" : "开启战斗音效");
  button.innerHTML = `<i data-lucide="${audioEnabled ? "volume-2" : "volume-x"}"></i>`;
}

function toggleSound() {
  const next = !audioEnabled;
  const result = mutateRoot((_root, spirits) => { spirits.audioEnabled = next; return true; });
  audioEnabled = result.spirits.audioEnabled;
  if (audioEnabled) playTone(330, .12, "sine", .04);
  syncSoundButton();
  refreshIcons();
}

function playTone(frequency, duration, type, volume) {
  if (!audioEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
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

function playWhoosh(rank) {
  playTone(140 + rank * 35, .18, "sawtooth", .035);
}

function playImpact(heavy) {
  playTone(heavy ? 62 : 88, heavy ? .34 : .18, "square", heavy ? .08 : .045);
}

function playUltimateSound(session) {
  [110, 165, 220, 330].forEach((tone, index) => window.setTimeout(() => {
    if (battleIsCurrent(session)) playTone(tone, .7, "sine", .055);
  }, reducedMotion ? index * 25 : index * 150));
}

document.getElementById("spiritRoster").addEventListener("click", event => {
  const selectButton = event.target.closest("[data-select-bird]");
  const teamButton = event.target.closest("[data-team-bird]");
  if (selectButton) { selectedSpirit = selectButton.dataset.selectBird; renderSanctuary(); }
  if (teamButton) replaceTeamMember(teamButton.dataset.teamBird);
});
document.getElementById("spiritTeamPreview").addEventListener("click", event => {
  const slot = event.target.closest("[data-team-slot]");
  if (!slot) return;
  selectedTeamSlot = Number(slot.dataset.teamSlot);
  selectedSpirit = currentState().spirits.team[selectedTeamSlot];
  renderSanctuary();
});
document.getElementById("spiritDetail").addEventListener("click", event => {
  const tab = event.target.closest("[data-spirit-tab]");
  if (!tab) return;
  activeSpiritTab = tab.dataset.spiritTab;
  renderSanctuary();
});
document.getElementById("spiritDetail").addEventListener("keydown", event => {
  const tab = event.target.closest("[data-spirit-tab]");
  if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...document.querySelectorAll("[data-spirit-tab]")];
  const current = tabs.indexOf(tab);
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  activeSpiritTab = tabs[next].dataset.spiritTab;
  renderSanctuary();
  tabs[next].focus();
});
document.getElementById("spiritDetailBody").addEventListener("click", event => {
  const growth = event.target.closest("[data-growth-action]");
  const skill = event.target.closest("[data-skill-upgrade]");
  const trace = event.target.closest("[data-trace-node]");
  const equip = event.target.closest("[data-equip-sigil]");
  const unequip = event.target.closest("[data-unequip-sigil]");
  if (growth?.dataset.growthAction === "level") progressionAction(state => levelUpSpirit(state, selectedSpirit), `${birds[selectedSpirit].name} 等级提升`);
  if (growth?.dataset.growthAction === "ascend") progressionAction(state => ascendSpirit(state, selectedSpirit), `${birds[selectedSpirit].name} 完成晋阶`);
  if (skill) progressionAction(state => upgradeSkill(state, selectedSpirit, skill.dataset.skillUpgrade), `${skillNames[skill.dataset.skillUpgrade]}等级提升`);
  if (trace) {
    const nodeId = trace.dataset.traceNode;
    progressionAction(state => unlockTrace(state, selectedSpirit, nodeId), `${traceNames[nodeId] || getSpiritTraceNodes(selectedSpirit)[nodeId].name}已解锁`);
  }
  if (equip) progressionAction(state => equipSigil(state, selectedSpirit, Number(equip.dataset.sigilSlot), equip.dataset.equipSigil), "羽印装配完成");
  if (unequip) progressionAction(state => equipSigil(state, selectedSpirit, Number(unequip.dataset.unequipSigil), null), "羽印已卸下");
});
document.getElementById("battleHand").addEventListener("click", event => {
  const card = event.target.closest("[data-card-index]");
  if (card) playCard(Number(card.dataset.cardIndex));
});
document.querySelectorAll("[data-battle-encounter]").forEach(button => button.addEventListener("click", () => {
  selectedEncounter = button.dataset.battleEncounter;
  renderSanctuary();
  notify(selectedEncounter === "boss" ? "已选择赤潮首领 · 预计 7-10 回合" : "已选择净滩演练 · 预计 4-7 回合");
}));
document.getElementById("startSpiritBattle").addEventListener("click", startBattle);
document.getElementById("leaveBattle").addEventListener("click", closeBattle);
document.getElementById("endTurn").addEventListener("click", () => enemyPhase());
document.getElementById("battleAgain").addEventListener("click", startBattle);
document.getElementById("battleReturn").addEventListener("click", closeBattle);
document.getElementById("battleSound").addEventListener("click", toggleSound);
document.querySelectorAll('[data-view-target="bird-sanctuary"]').forEach(button => button.addEventListener("click", () => window.setTimeout(renderSanctuary)));
document.addEventListener("keydown", event => {
  const shell = document.getElementById("battleShell");
  if (event.key === "Tab" && !shell.hidden) {
    const scope = document.getElementById("battleResult").hidden ? shell : document.getElementById("battleResult");
    const focusable = [...scope.querySelectorAll("button:not([disabled])")].filter(node => node.getClientRects().length);
    if (!focusable.length) { event.preventDefault(); shell.focus({ preventScroll: true }); return; }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !shell.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }
  if (event.key === "Escape" && !document.getElementById("battleShell").hidden) {
    event.preventDefault();
    closeBattle();
  }
});
window.addEventListener("storage", event => { if (event.key === STORAGE_KEY && !battle) renderSanctuary(); });
window.addEventListener("mudflat-state-changed", event => { if (event.detail?.source !== "bird-spirits" && !battle) renderSanctuary(); });
reduceMotionQuery.addEventListener?.("change", event => { reducedMotion = event.matches; });

renderSanctuary();
