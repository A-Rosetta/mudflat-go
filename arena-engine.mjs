const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const alive = unit => !unit.defeated && unit.hp > 0;
export const ARENA_MASTERY_IDS = ["survival", "chain", "tempo"];

const levelMechanics = {
  1: {},
  2: { firstHitReduction: .4 },
  3: { skillDamageBonus: .2 },
  4: { enemyAttackBonus: 2 },
  5: { enemyHpMultiplier: 1.1 },
  6: { enemySkillBonus: 5 },
  7: { woundedAttackBonus: .2 },
  8: { enemyAttackBonus: 4 },
  9: { enemyHpMultiplier: 1.15 },
  10: { enemyHpMultiplier: 1.1, enemyAttackMultiplier: 1.1, enemySkillMultiplier: 1.1 }
};

const rawLevels = [
  [1, "潮痕初探", "福田红树林", "入侵预警", "熟悉目标选择与三位鸟灵的行动节奏。", "潮汐平稳 · 无额外效果", 80, 38, [
    ["spartina-core", "互花米草", 120, 12, "根系蔓延", 18, "assets/images/avicenna-marina.jpg"],
    ["spartina-seedling", "米草幼苗", 92, 10, "潮沟占位", 15, "assets/images/kandelia-obovata.jpg"],
    ["spartina-root", "米草根团", 138, 14, "泥滩固结", 20, "assets/images/mangrove-wetland.jpg"]
  ]],
  [2, "贝壳暗礁", "深圳湾公园", "低潮异动", "滤食者聚集成墙，目标生命开始提升。", "贝壳护甲 · 首次受击减伤", 120, 52, [
    ["reef-barnacle", "藤壶礁群", 136, 14, "闭壳护甲", 20, "assets/images/mangrove-snail.jpg"],
    ["reef-snail", "滩涂螺潮", 118, 13, "藻痕覆盖", 18, "assets/images/mangrove-snail.jpg"],
    ["reef-worm", "沙蚕穴群", 150, 16, "泥穴回响", 22, "assets/images/mudskipper.jpg"]
  ]],
  [3, "根系迷阵", "西湾红树林", "林缘扩散", "根系锁住潮沟，敌方攻击力进一步提高。", "根系反震 · 技能伤害提升", 170, 66, [
    ["maze-root", "外来根须", 158, 17, "根须缠绕", 24, "assets/images/avicenna-marina.jpg"],
    ["maze-thorn", "刺叶屏障", 142, 18, "荆棘封潮", 26, "assets/images/kandelia-obovata.jpg"],
    ["maze-sapling", "盐沼幼株", 176, 19, "盐雾扎根", 28, "assets/images/mangrove-wetland.jpg"]
  ]],
  [4, "夜潮回声", "东涌湿地", "夜间活跃", "夜潮中的敌群更敏捷，生命与伤害同步增加。", "夜潮回声 · 敌方攻击 +2", 230, 80, [
    ["night-anemone", "荧光海葵", 180, 21, "触手回响", 30, "assets/images/mangrove-snail.jpg"],
    ["night-jelly", "月影水母", 164, 22, "月潮漂移", 32, "assets/images/mangrove-wetland.jpg"],
    ["night-star", "暗潮海星", 194, 23, "潮池封锁", 34, "assets/images/mudskipper.jpg"]
  ]],
  [5, "盐沼高地", "海上田园", "盐度失衡", "盐度异常让敌方拥有更高的生命上限。", "盐度失衡 · 敌方最大生命 +10%", 300, 96, [
    ["salt-grass", "盐沼草毯", 214, 24, "盐叶增殖", 34, "assets/images/mangrove-wetland.jpg"],
    ["salt-vine", "海漆蔓枝", 190, 25, "汁液蔓延", 36, "assets/images/avicenna-marina.jpg"],
    ["salt-trunk", "盐风枯桩", 230, 26, "枯桩阻潮", 38, "assets/images/kandelia-obovata.jpg"]
  ]],
  [6, "候鸟断航", "深圳湾公园", "迁徙受阻", "敌方开始拥有更高的单次反击压力。", "断航警报 · 敌方技能伤害 +5", 380, 114, [
    ["route-reed", "断航芦苇带", 244, 28, "航线封锁", 42, "assets/images/mangrove-wetland.jpg"],
    ["route-mat", "漂浮草垫", 220, 29, "漂垫推进", 44, "assets/images/avicenna-marina.jpg"],
    ["route-wall", "潮线草墙", 264, 30, "草墙推进", 46, "assets/images/kandelia-obovata.jpg"]
  ]],
  [7, "古树保卫战", "坝光银叶树", "根际危机", "古树根际受到围攻，三名敌人都十分坚韧。", "古树庇护 · 受伤后攻击提升", 470, 134, [
    ["old-tree-vine", "缠根藤蔓", 282, 32, "根际攀附", 50, "assets/images/avicenna-marina.jpg"],
    ["old-tree-mud", "固结泥丘", 260, 33, "泥丘隆起", 52, "assets/images/mangrove-wetland.jpg"],
    ["old-tree-thorn", "刺冠幼林", 304, 34, "刺冠扩张", 54, "assets/images/kandelia-obovata.jpg"]
  ]],
  [8, "风暴潮前线", "西湾红树林", "风暴潮", "强潮推高敌方攻击，目标顺序决定成败。", "风暴潮 · 敌方攻击 +4", 570, 156, [
    ["storm-surge", "风暴草潮", 326, 38, "风暴推进", 60, "assets/images/mangrove-wetland.jpg"],
    ["storm-rhizome", "漂移根团", 304, 39, "根团冲刷", 62, "assets/images/avicenna-marina.jpg"],
    ["storm-salt", "盐雾草冠", 348, 40, "盐雾压境", 64, "assets/images/kandelia-obovata.jpg"]
  ]],
  [9, "潮沟封锁线", "福田红树林", "生态临界", "敌方生命达到高位，需要更有效地使用专属技能。", "封锁线 · 敌方最大生命 +15%", 690, 182, [
    ["lockline-core", "封潮核心", 330, 40, "潮沟封锁", 60, "assets/images/mangrove-wetland.jpg"],
    ["lockline-spine", "盐脊棘墙", 315, 41, "盐脊隆起", 62, "assets/images/kandelia-obovata.jpg"],
    ["lockline-mass", "沉积根垒", 337, 42, "沉积压境", 64, "assets/images/avicenna-marina.jpg"]
  ]],
  [10, "红树林终局", "深圳湾核心区", "终极入侵", "最后一段潮线，敌方拥有最高的生命与攻击。", "终局警戒 · 全部敌方属性 +10%", 850, 214, [
    ["final-spartina", "互花米草母巢", 340, 37, "无尽蔓延", 54, "assets/images/mangrove-wetland.jpg"],
    ["final-reef", "侵潮礁脉", 325, 38, "礁脉封潮", 56, "assets/images/mangrove-snail.jpg"],
    ["final-root", "终局根城", 364, 40, "根城覆岸", 60, "assets/images/avicenna-marina.jpg"]
  ]]
];

export const ARENA_LEVELS = rawLevels.map(([id, name, zone, threat, description, modifier, reward, recommendedPower, enemies]) => ({
  id, name, zone, threat, description, modifier, reward, recommendedPower, mechanic: levelMechanics[id],
  enemies: enemies.map(([enemyId, enemyName, maxHp, attack, skillName, skillDamage, image]) => ({ id: enemyId, name: enemyName, maxHp, attack, skillName, skillDamage, image }))
}));

const variants = [
  { id: "low-tide", name: "退潮窗口", effect: "每轮首击伤害 +25%", firstStrikeMultiplier: 1.25 },
  { id: "breeze", name: "微风潮沟", effect: "普通攻击额外获得 10 能量", attackEnergy: 35 },
  { id: "migration", name: "候鸟活跃", effect: "全队以 50 能量入场", startEnergy: 50 },
  { id: "lunar", name: "月相偏移", effect: "敌方每 2 轮发动技能", enemySkillInterval: 2 },
  { id: "salinity", name: "盐度波动", effect: "敌方最大生命 +5%", enemyHpMultiplier: 1.05 }
];
const dayHash = day => Array.from(day).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 997, 17);

export function arenaDayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

export function dailyArenaLevel(levelId, day = arenaDayKey()) {
  const level = ARENA_LEVELS.find(item => item.id === Number(levelId)) || ARENA_LEVELS[0];
  const seed = dayHash(day);
  const variant = variants[(seed + level.id) % variants.length];
  return {
    ...level,
    day,
    dailyReward: level.reward + ((seed + level.id * 13) % 4) * 10,
    dailyVariant: variant.name,
    dailyEffect: variant.effect,
    variant
  };
}

export function evaluateArenaMastery(level, battle) {
  const roundLimit = Number(level?.id) + 6;
  return [
    { id: "survival", name: "全员归潮", detail: "全员存活完成", icon: "shield-check", complete: Boolean(battle?.players?.every(alive)) },
    { id: "chain", name: "三潮成势", detail: "达成潮链 III", icon: "waves", complete: Number(battle?.maxChain) >= 3 },
    { id: "tempo", name: "抢潮净滩", detail: `${roundLimit} 回合内完成`, icon: "timer", complete: Number(battle?.round) <= roundLimit }
  ];
}

export function normalizeArenaProgress(value = {}) {
  const claims = value.claims && typeof value.claims === "object" && !Array.isArray(value.claims) ? value.claims : {};
  const mastery = value.mastery && typeof value.mastery === "object" && !Array.isArray(value.mastery) ? value.mastery : {};
  return {
    unlockedThrough: clamp(Math.round(Number(value.unlockedThrough) || 1), 1, ARENA_LEVELS.length),
    clearedThrough: clamp(Math.round(Number(value.clearedThrough) || 0), 0, ARENA_LEVELS.length),
    claims: Object.fromEntries(Object.entries(claims).map(([day, levels]) => [day, [...new Set((Array.isArray(levels) ? levels : []).map(Number).filter(id => id >= 1 && id <= ARENA_LEVELS.length))]])),
    mastery: Object.fromEntries(Object.entries(mastery)
      .map(([levelId, goals]) => [Number(levelId), ARENA_MASTERY_IDS.filter(id => Array.isArray(goals) && goals.includes(id))])
      .filter(([levelId, goals]) => levelId >= 1 && levelId <= ARENA_LEVELS.length && goals.length)),
    audioEnabled: value.audioEnabled !== false
  };
}

export function createArenaBattle(level, team) {
  if (!level || !Array.isArray(team) || team.length !== 3) throw new Error("竞技需要三位出战鸟灵");
  const mechanic = level.mechanic || {};
  const variant = level.variant || {};
  const players = team.map(unit => ({ ...unit, hp: unit.maxHp, mp: variant.startEnergy || 0, shield: 0, debuff: null, defeated: false }));
  const enemies = level.enemies.map(unit => {
    const maxHp = Math.round(unit.maxHp * (mechanic.enemyHpMultiplier || 1) * (variant.enemyHpMultiplier || 1));
    return {
      ...unit,
      maxHp,
      hp: maxHp,
      attack: Math.round((unit.attack + (mechanic.enemyAttackBonus || 0)) * (mechanic.enemyAttackMultiplier || 1)),
      skillDamage: Math.round((unit.skillDamage + (mechanic.enemySkillBonus || 0)) * (mechanic.enemySkillMultiplier || 1)),
      toughness: 2,
      maxToughness: 2,
      broken: false,
      armorReady: Boolean(mechanic.firstHitReduction),
      defeated: false
    };
  });
  return { levelId: level.id, day: level.day, round: 1, status: "player", players, enemies, acted: [], roundDamageCount: 0, chainTargetId: null, chainCount: 0, maxChain: 0, enemyDelay: 0, mechanic, variant, lastEvent: null };
}

export function previewArenaAction(state, { playerId, enemyId, action }) {
  if (state.status !== "player" || !["attack", "skill"].includes(action)) return null;
  const player = state.players.find(unit => unit.id === playerId);
  const enemy = state.enemies.find(unit => unit.id === enemyId);
  if (!player || !enemy || !alive(player) || !alive(enemy) || state.acted.includes(playerId)) return null;
  if (action === "skill" && player.mp < 100) return null;
  const mechanic = state.mechanic || {};
  const variant = state.variant || {};
  const isSkill = action === "skill";
  const isEgretSkill = isSkill && playerId === "egret";
  const isTuanTuanSkill = isSkill && playerId === "tuantuan";
  let damage = isEgretSkill || isTuanTuanSkill ? 0 : isSkill ? player.skillDamage * (1 + (mechanic.skillDamageBonus || 0)) : player.attack;
  const firstStrikeBonus = damage > 0 && state.roundDamageCount === 0 ? variant.firstStrikeMultiplier || 1 : 1;
  damage = Math.round(damage * firstStrikeBonus);
  let toughnessDamage = 0;
  let broken = enemy.broken;
  let execute = false;
  if (isSkill && playerId === "kingfisher") {
    toughnessDamage = Math.min(enemy.toughness || 0, 2);
    broken = toughnessDamage > 0 && enemy.toughness - toughnessDamage === 0 || enemy.broken;
    execute = broken || enemy.hp / enemy.maxHp <= .35;
    if (execute) damage = Math.round(damage * 1.5);
  }
  const chainCount = damage > 0 ? (state.chainTargetId === enemyId ? Math.min(3, (Number(state.chainCount) || 0) + 1) : 1) : Number(state.chainCount) || 0;
  const chainMultiplier = damage > 0 ? 1 + (chainCount - 1) * .12 : 1;
  damage = Math.round(damage * chainMultiplier);
  const armorAbsorbed = enemy.armorReady && damage > 0 ? Math.round(damage * (mechanic.firstHitReduction || 0)) : 0;
  damage -= armorAbsorbed;
  const healingPower = isTuanTuanSkill ? Math.round(player.skillDamage * .45) : player.skillDamage;
  const healingByTarget = isEgretSkill || isTuanTuanSkill
    ? Object.fromEntries(state.players.filter(alive).map(unit => [unit.id, Math.min(healingPower, unit.maxHp - unit.hp)]))
    : {};
  const healing = Object.values(healingByTarget).reduce((total, value) => total + value, 0);
  const barrierPower = isSkill && playerId === "spoonbill" ? Math.round(player.skillDamage * .7) : isTuanTuanSkill ? Math.round(player.skillDamage * .45) : 0;
  const barrierByTarget = barrierPower
    ? Object.fromEntries(state.players.filter(alive).map(unit => [unit.id, Math.min(barrierPower, Math.max(0, Math.round(unit.maxHp * .45) - (unit.shield || 0)))]))
    : {};
  const barrier = Object.values(barrierByTarget).reduce((total, value) => total + value, 0);
  return { damage, healing, healingByTarget, barrier, barrierByTarget, armorAbsorbed, toughnessDamage, broken, execute, delayed: isSkill && playerId === "heron", firstStrikeBonus, chainCount, chainMultiplier };
}

export function performArenaAction(state, { playerId, enemyId, action }) {
  if (state.status !== "player") return state;
  const player = state.players.find(unit => unit.id === playerId);
  const enemy = state.enemies.find(unit => unit.id === enemyId);
  if (!player || !enemy || !alive(player) || !alive(enemy) || state.acted.includes(playerId)) return state;
  if (action === "skill" && player.mp < 100) return state;
  const variant = state.variant || {};
  const isSkill = action === "skill";
  const preview = previewArenaAction(state, { playerId, enemyId, action });
  if (!preview) return state;
  const { damage, healing, healingByTarget, barrier, barrierByTarget, armorAbsorbed, toughnessDamage, broken, execute, delayed, firstStrikeBonus, chainCount, chainMultiplier } = preview;
  const players = state.players.map(unit => {
    const next = { ...unit };
    if (unit.id === playerId) next.mp = isSkill ? 0 : clamp(unit.mp + (variant.attackEnergy || 25), 0, 100);
    const appliedHealing = healingByTarget[unit.id] || 0;
    if (appliedHealing) next.hp = unit.hp + appliedHealing;
    if (isSkill && playerId === "egret" && alive(unit)) next.debuff = null;
    const appliedBarrier = barrierByTarget[unit.id] || 0;
    if (appliedBarrier) next.shield = (unit.shield || 0) + appliedBarrier;
    return next;
  });
  const enemies = state.enemies.map(unit => {
    if (unit.id !== enemyId) return { ...unit };
    const hp = clamp(unit.hp - damage, 0, unit.maxHp);
    return {
      ...unit,
      hp,
      toughness: playerId === "kingfisher" && isSkill ? Math.max(0, unit.toughness - toughnessDamage) : unit.toughness,
      broken: playerId === "kingfisher" && isSkill ? broken : unit.broken,
      armorReady: damage > 0 ? false : unit.armorReady,
      defeated: hp <= 0
    };
  });
  const acted = [...state.acted, playerId];
  const remainingEnemies = enemies.filter(alive);
  const readyPlayers = players.filter(alive).filter(unit => !acted.includes(unit.id));
  return {
    ...state,
    players,
    enemies,
    acted,
    roundDamageCount: state.roundDamageCount + Number(damage > 0),
    chainTargetId: damage > 0 ? enemyId : state.chainTargetId || null,
    chainCount: damage > 0 ? chainCount : Number(state.chainCount) || 0,
    maxChain: Math.max(Number(state.maxChain) || 0, damage > 0 ? chainCount : 0),
    enemyDelay: delayed ? 1 : state.enemyDelay,
    status: remainingEnemies.length ? (readyPlayers.length ? "player" : "enemy") : "victory",
    lastEvent: { side: "player", attackerId: playerId, targetId: enemyId, action, damage, healing, healingByTarget, barrier, barrierByTarget, armorAbsorbed, toughnessDamage, execute, delayed, firstStrikeBonus, chainCount, chainMultiplier }
  };
}

export function previewArenaEnemyTurn(state) {
  const enemies = state.enemies.filter(alive);
  const players = state.players.filter(alive);
  if (!enemies.length || !players.length) return null;
  const round = Math.max(1, Math.round(Number(state.round) || 1));
  const attacker = enemies[(round - 1) % enemies.length];
  const threatened = players.slice().sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp || state.players.indexOf(left) - state.players.indexOf(right))[0];
  const guardian = players.find(unit => unit.id === "spoonbill" && unit.shield > 0);
  const target = guardian && threatened.id !== guardian.id ? guardian : threatened;
  if (state.enemyDelay > 0) return { attackerId: attacker.id, targetId: target.id, protectedTargetId: target.id === threatened.id ? undefined : threatened.id, action: "delayed", damage: 0, absorbed: 0 };
  const skillInterval = state.variant?.enemySkillInterval || 3;
  const action = round % skillInterval === 0 ? "skill" : "attack";
  const woundedBonus = state.mechanic?.woundedAttackBonus && attacker.hp < attacker.maxHp ? 1 + state.mechanic.woundedAttackBonus : 1;
  const exposedBonus = target.debuff ? 1.15 : 1;
  const incomingDamage = Math.round((action === "skill" ? attacker.skillDamage : attacker.attack) * woundedBonus * exposedBonus);
  const absorbed = Math.min(target.shield || 0, incomingDamage);
  return {
    attackerId: attacker.id,
    targetId: target.id,
    protectedTargetId: target.id === threatened.id ? undefined : threatened.id,
    action,
    damage: incomingDamage - absorbed,
    absorbed,
    appliesDebuff: action === "skill" ? "侵蚀" : undefined
  };
}

export function performArenaEnemyTurn(state) {
  if (state.status !== "enemy") return state;
  const enemies = state.enemies.filter(alive);
  const players = state.players.filter(alive);
  if (!enemies.length) return { ...state, status: "victory" };
  if (!players.length) return { ...state, status: "defeat" };
  const intent = previewArenaEnemyTurn(state);
  if (intent.action === "delayed") {
    return { ...state, round: state.round + 1, acted: [], roundDamageCount: 0, chainTargetId: null, chainCount: 0, enemyDelay: Math.max(0, state.enemyDelay - 1), status: "player", lastEvent: { side: "enemy", ...intent } };
  }
  const target = players.find(unit => unit.id === intent.targetId);
  const nextPlayers = state.players.map(unit => {
    if (unit.id !== target.id) return { ...unit };
    const hp = clamp(unit.hp - intent.damage, 0, unit.maxHp);
    return { ...unit, hp, shield: Math.max(0, (unit.shield || 0) - intent.absorbed), debuff: intent.appliesDebuff && hp > 0 ? intent.appliesDebuff : unit.debuff, defeated: hp <= 0 };
  });
  const nextEnemies = state.enemies.map(unit => unit.id === intent.attackerId && unit.broken ? { ...unit, broken: false, toughness: unit.maxToughness } : { ...unit });
  return {
    ...state,
    players: nextPlayers,
    enemies: nextEnemies,
    round: state.round + 1,
    acted: [],
    roundDamageCount: 0,
    chainTargetId: null,
    chainCount: 0,
    status: nextPlayers.some(alive) ? "player" : "defeat",
    lastEvent: { side: "enemy", ...intent }
  };
}

export function claimArenaVictory(progress, levelId, day = arenaDayKey(), earnedMastery = []) {
  const current = normalizeArenaProgress(progress);
  const id = clamp(Math.round(Number(levelId) || 1), 1, ARENA_LEVELS.length);
  const claimedToday = current.claims[day] || [];
  const firstWinToday = !claimedToday.includes(id);
  const previousMastery = current.mastery[id] || [];
  const validMastery = ARENA_MASTERY_IDS.filter(goalId => earnedMastery.includes(goalId));
  const newMastery = validMastery.filter(goalId => !previousMastery.includes(goalId));
  const mastery = ARENA_MASTERY_IDS.filter(goalId => previousMastery.includes(goalId) || validMastery.includes(goalId));
  const dailyReward = firstWinToday ? dailyArenaLevel(id, day).dailyReward : 0;
  const masteryReward = newMastery.length * id * 10;
  return {
    progress: {
      ...current,
      unlockedThrough: Math.max(current.unlockedThrough, Math.min(ARENA_LEVELS.length, id + 1)),
      clearedThrough: Math.max(current.clearedThrough, id),
      claims: firstWinToday ? { ...current.claims, [day]: [...claimedToday, id] } : current.claims,
      mastery: mastery.length ? { ...current.mastery, [id]: mastery } : current.mastery
    },
    reward: dailyReward + masteryReward,
    dailyReward,
    masteryReward,
    newMastery
  };
}
