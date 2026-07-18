const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const alive = unit => !unit.defeated && unit.hp > 0;

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
    ["lockline-core", "封潮核心", 386, 44, "潮沟封锁", 70, "assets/images/mangrove-wetland.jpg"],
    ["lockline-spine", "盐脊棘墙", 364, 45, "盐脊隆起", 72, "assets/images/kandelia-obovata.jpg"],
    ["lockline-mass", "沉积根垒", 410, 46, "沉积压境", 74, "assets/images/avicenna-marina.jpg"]
  ]],
  [10, "红树林终局", "深圳湾核心区", "终极入侵", "最后一段潮线，敌方拥有最高的生命与攻击。", "终局警戒 · 全部敌方属性 +10%", 850, 214, [
    ["final-spartina", "互花米草母巢", 468, 52, "无尽蔓延", 84, "assets/images/mangrove-wetland.jpg"],
    ["final-reef", "侵潮礁脉", 442, 53, "礁脉封潮", 86, "assets/images/mangrove-snail.jpg"],
    ["final-root", "终局根城", 496, 55, "根城覆岸", 90, "assets/images/avicenna-marina.jpg"]
  ]]
];

export const ARENA_LEVELS = rawLevels.map(([id, name, zone, threat, description, modifier, reward, recommendedPower, enemies]) => ({
  id, name, zone, threat, description, modifier, reward, recommendedPower,
  enemies: enemies.map(([enemyId, enemyName, maxHp, attack, skillName, skillDamage, image]) => ({ id: enemyId, name: enemyName, maxHp, attack, skillName, skillDamage, image }))
}));

const variants = ["退潮窗口", "微风潮沟", "候鸟活跃", "月相偏移", "盐度波动"];
const dayHash = day => Array.from(day).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 997, 17);

export function arenaDayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

export function dailyArenaLevel(levelId, day = arenaDayKey()) {
  const level = ARENA_LEVELS.find(item => item.id === Number(levelId)) || ARENA_LEVELS[0];
  const seed = dayHash(day);
  return {
    ...level,
    day,
    dailyReward: level.reward + ((seed + level.id * 13) % 4) * 10,
    dailyVariant: variants[(seed + level.id) % variants.length]
  };
}

export function normalizeArenaProgress(value = {}) {
  const claims = value.claims && typeof value.claims === "object" && !Array.isArray(value.claims) ? value.claims : {};
  return {
    unlockedThrough: clamp(Math.round(Number(value.unlockedThrough) || 1), 1, ARENA_LEVELS.length),
    clearedThrough: clamp(Math.round(Number(value.clearedThrough) || 0), 0, ARENA_LEVELS.length),
    claims: Object.fromEntries(Object.entries(claims).map(([day, levels]) => [day, [...new Set((Array.isArray(levels) ? levels : []).map(Number).filter(id => id >= 1 && id <= ARENA_LEVELS.length))]])),
    audioEnabled: value.audioEnabled !== false
  };
}

export function createArenaBattle(level, team) {
  if (!level || !Array.isArray(team) || team.length !== 3) throw new Error("竞技需要三位出战鸟灵");
  const players = team.map(unit => ({ ...unit, hp: unit.maxHp, mp: 0, defeated: false }));
  const enemies = level.enemies.map(unit => ({ ...unit, hp: unit.maxHp, mp: 0, defeated: false }));
  return { levelId: level.id, round: 1, status: "player", players, enemies, acted: [], lastEvent: null };
}

export function performArenaAction(state, { playerId, enemyId, action }) {
  if (state.status !== "player") return state;
  const player = state.players.find(unit => unit.id === playerId);
  const enemy = state.enemies.find(unit => unit.id === enemyId);
  if (!player || !enemy || !alive(player) || !alive(enemy) || state.acted.includes(playerId)) return state;
  if (action === "skill" && player.mp < 100) return state;
  const damage = action === "skill" ? player.skillDamage : player.attack;
  const players = state.players.map(unit => unit.id === playerId ? { ...unit, mp: action === "skill" ? 0 : clamp(unit.mp + 25, 0, 100) } : { ...unit });
  const enemies = state.enemies.map(unit => unit.id === enemyId ? { ...unit, hp: clamp(unit.hp - damage, 0, unit.maxHp), defeated: unit.hp - damage <= 0 } : { ...unit });
  const acted = [...state.acted, playerId];
  const remainingEnemies = enemies.filter(alive);
  const readyPlayers = players.filter(alive).filter(unit => !acted.includes(unit.id));
  return {
    ...state,
    players,
    enemies,
    acted,
    status: remainingEnemies.length ? (readyPlayers.length ? "player" : "enemy") : "victory",
    lastEvent: { side: "player", attackerId: playerId, targetId: enemyId, action, damage }
  };
}

export function performArenaEnemyTurn(state) {
  if (state.status !== "enemy") return state;
  const enemies = state.enemies.filter(alive);
  const players = state.players.filter(alive);
  if (!enemies.length) return { ...state, status: "victory" };
  if (!players.length) return { ...state, status: "defeat" };
  const attacker = enemies[(state.round - 1) % enemies.length];
  const target = players.slice().sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
  const damage = attacker.attack;
  const nextPlayers = state.players.map(unit => unit.id === target.id ? { ...unit, hp: clamp(unit.hp - damage, 0, unit.maxHp), defeated: unit.hp - damage <= 0 } : { ...unit });
  return {
    ...state,
    players: nextPlayers,
    round: state.round + 1,
    acted: [],
    status: nextPlayers.some(alive) ? "player" : "defeat",
    lastEvent: { side: "enemy", attackerId: attacker.id, targetId: target.id, action: "attack", damage }
  };
}

export function claimArenaVictory(progress, levelId, day = arenaDayKey()) {
  const current = normalizeArenaProgress(progress);
  const id = clamp(Math.round(Number(levelId) || 1), 1, ARENA_LEVELS.length);
  const claimedToday = current.claims[day] || [];
  const firstWinToday = !claimedToday.includes(id);
  return {
    progress: {
      ...current,
      unlockedThrough: Math.max(current.unlockedThrough, Math.min(ARENA_LEVELS.length, id + 1)),
      clearedThrough: Math.max(current.clearedThrough, id),
      claims: firstWinToday ? { ...current.claims, [day]: [...claimedToday, id] } : current.claims
    },
    reward: firstWinToday ? dailyArenaLevel(id, day).dailyReward : 0
  };
}
