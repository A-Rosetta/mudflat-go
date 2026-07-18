export const AFFINITY_MULTIPLIER = {
  tide: { tide: 1, grove: .85, wing: 1.3 },
  grove: { tide: 1.3, grove: 1, wing: .85 },
  wing: { tide: .85, grove: 1.3, wing: 1 }
};

export const RANK_MULTIPLIER = { 1: 1, 2: 1.5, 3: 2.3 };
export const ENCOUNTER_PRESETS = {
  normal: { maxHp: 2320, attack: 875, defense: 88, maxTurns: 7 },
  boss: { maxHp: 4000, attack: 1000, defense: 105, maxTurns: 10 }
};

export function statsAtLevel(base, level) {
  const safeLevel = Math.max(1, Math.min(20, Math.round(level)));
  const progress = (safeLevel - 1) / 19;
  const factor = 1 + progress * 1.05 + progress * progress * .38;
  return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, Math.round(value * factor)]));
}

export function calculateDamage({ attack, defense, power, rank = 1, affinity = 1, variance = 1 }) {
  return Math.max(1, Math.round(attack * power * (RANK_MULTIPLIER[rank] || 1) * affinity * variance - defense * .38));
}

export function mergeAdjacentCards(cards) {
  const result = [];
  for (const card of cards) {
    result.push({ ...card });
    while (result.length >= 2) {
      const current = result[result.length - 1];
      const previous = result[result.length - 2];
      if (previous.owner !== current.owner || previous.skill !== current.skill || previous.rank !== current.rank || current.rank >= 3) break;
      result.splice(-2, 2, { ...previous, rank: previous.rank + 1 });
    }
  }
  return result;
}

export function createBattleDeck(team) {
  return team.flatMap(owner => ["strike", "tactic"].flatMap(skill => Array.from({ length: 3 }, () => ({ owner, skill, rank: 1 }))));
}

export function chooseEnemyIntent(turn, hpRatio, phase = 1) {
  if (hpRatio <= (phase >= 2 ? .25 : .3)) return { type: "recover", label: "湿地回生", power: .12 };
  if (phase >= 3) {
    if (turn % 2 === 0) return { type: "burst", label: "暴雨横扫", power: .86 };
    if (turn % 3 === 0) return { type: "mark", label: "猎食标记", power: .88 };
    return { type: "attack", label: "俯冲啄击", power: 1.18 };
  }
  if (phase === 2) {
    if (turn % 3 === 0) return { type: "burst", label: "暴雨横扫", power: .8 };
    if (turn % 2 === 0) return { type: "mark", label: "猎食标记", power: .82 };
    return { type: "attack", label: "俯冲啄击", power: 1.1 };
  }
  if (turn % 3 === 0) return { type: "burst", label: "暴雨横扫", power: .72 };
  if (turn % 2 === 0) return { type: "guard", label: "芦苇屏障", power: .16 };
  return { type: "attack", label: "俯冲啄击", power: 1.02 };
}

export function shuffle(items, random = Math.random) {
  const result = items.map(item => ({ ...item }));
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createSeededRandom(seed = 1) {
  let value = (Number(seed) >>> 0) || 1;
  const random = () => {
    value += 0x6d2b79f5;
    let output = value;
    output = Math.imul(output ^ output >>> 15, output | 1);
    output ^= output + Math.imul(output ^ output >>> 7, output | 61);
    return ((output ^ output >>> 14) >>> 0) / 4294967296;
  };
  random.variance = () => .96 + random() * .08;
  random.state = () => value >>> 0;
  return random;
}

export const BATTLE_ROSTER = {
  spoonbill: { id: "spoonbill", affinity: "tide", role: "guardian", hp: 1120, attack: 118, defense: 96, speed: 92, strike: { type: "damage", power: 1.04 }, tactic: { type: "shield", power: .72 }, ultimate: { type: "shield", power: 1.45 } },
  kingfisher: { id: "kingfisher", affinity: "wing", role: "striker", hp: 820, attack: 158, defense: 62, speed: 116, strike: { type: "damage", power: 1.34 }, tactic: { type: "pierce", power: .92 }, ultimate: { type: "damage", power: 2.72 } },
  egret: { id: "egret", affinity: "grove", role: "healer", hp: 930, attack: 126, defense: 74, speed: 103, strike: { type: "damage", power: 1.02 }, tactic: { type: "heal", power: .7 }, ultimate: { type: "heal", power: 1.35 } },
  heron: { id: "heron", affinity: "tide", role: "support", hp: 880, attack: 144, defense: 70, speed: 108, strike: { type: "damage", power: 1.18 }, tactic: { type: "weaken", power: .78 }, ultimate: { type: "weaken", power: 2.18 } }
};

const cloneBattle = value => JSON.parse(JSON.stringify(value));
const isAlive = unit => unit.hp > 0;
const addShield = (unit, value) => Math.min(Math.round(unit.maxHp * .45), unit.shield + value);

function enemyPhase(enemy, boss) {
  const hpRatio = enemy.hp / enemy.maxHp;
  if (boss && hpRatio <= .3) return 3;
  if (hpRatio <= (boss ? .65 : .5)) return 2;
  return 1;
}

function refreshActionOrder(state) {
  state.actionOrder = [
    ...state.team.filter(isAlive).toSorted((left, right) => right.speed - left.speed || left.id.localeCompare(right.id)).map(unit => ({ id: unit.id, side: "ally", speed: unit.speed, phase: "player", freeAction: true, delayed: false })),
    { id: "enemy", side: "enemy", speed: state.enemy.speed, phase: "enemy", freeAction: false, delayed: Boolean(state.enemy.actionDelay), intent: state.intent.type }
  ];
}

function applyTimedStatus(target, bucket, status) {
  const current = target[bucket].find(entry => entry.id === status.id);
  if (current) {
    current.duration = Math.max(current.duration, status.duration);
    current.magnitude = Math.max(current.magnitude || 0, status.magnitude || 0);
  } else target[bucket].push({ ...status });
}

function tickTimedStatuses(target, targetId, events) {
  for (const bucket of ["buffs", "debuffs"]) {
    target[bucket].forEach(status => status.duration--);
    const expired = target[bucket].filter(status => status.duration <= 0);
    target[bucket] = target[bucket].filter(status => status.duration > 0);
    expired.forEach(status => events.push({ type: "status_expired", target: targetId, status: status.id }));
  }
  if ("weakened" in target) target.weakened = target.debuffs.find(status => status.id === "weakened")?.duration || 0;
}

const skillRank = value => Math.max(1, Math.min(6, Math.round(Number(value) || 1)));
const MECHANIC_KEYS = ["shieldPower", "guardReduction", "breakPower", "executePower", "healingPower", "cleansePower", "debuffPower", "controlPower"];

function progressionPower(unit, card) {
  const skillKey = card.ultimate ? "ultimate" : card.skill === "strike" ? "basic" : "spell";
  const rankBonus = (skillRank(unit.skills?.[skillKey]) - 1) * .05;
  return 1 + rankBonus + (card.ultimate ? unit.ultimatePower : unit.skillPower);
}

function nextBattleRandom(state) {
  const random = createSeededRandom(state.rngState);
  const value = random();
  state.rngState = random.state();
  return value;
}

function shuffleForBattle(items, state) {
  const result = items.map(cloneBattle);
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(nextBattleRandom(state) * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function refillBattleHand(state) {
  const aliveOwners = new Set(state.team.filter(isAlive).map(unit => unit.id));
  state.hand = state.hand.filter(card => aliveOwners.has(card.owner));
  state.deck = state.deck.filter(card => aliveOwners.has(card.owner));
  while (state.hand.length < 6) {
    if (!state.deck.length) state.deck = shuffleForBattle(createBattleDeck(state.team.filter(isAlive).map(unit => unit.id)), state);
    if (!state.deck.length) break;
    state.hand.push(state.deck.pop());
  }
  state.hand = mergeAdjacentCards(state.hand);
  for (const unit of state.team.filter(isAlive)) {
    if (unit.passion >= 5 && !state.hand.some(card => card.owner === unit.id && card.ultimate)) state.hand.unshift({ owner: unit.id, skill: "ultimate", rank: 3, ultimate: true });
  }
}

export function createBattleState(options = {}) {
  const ids = options.team || ["spoonbill", "kingfisher", "egret"];
  const levels = options.levels || {};
  const team = ids.map(id => {
    const source = BATTLE_ROSTER[id];
    if (!source) throw new Error(`Unknown battle unit: ${id}`);
    const leveled = statsAtLevel({ hp: source.hp, attack: source.attack, defense: source.defense }, levels[id] || 5);
    const progression = options.unitStats?.[id] || {};
    const stats = Object.fromEntries(["hp", "attack", "defense"].map(key => [key, Number(progression[key]) > 0 ? Math.round(Number(progression[key])) : leveled[key]]));
    const skills = {
      basic: skillRank(progression.skills?.basic ?? progression.skills?.strike),
      spell: skillRank(progression.skills?.spell ?? progression.skills?.tactic),
      ultimate: skillRank(progression.skills?.ultimate)
    };
    return {
      ...cloneBattle(source), ...stats, maxHp: stats.hp,
      speed: Number(progression.speed) > 0 ? Number(progression.speed) : source.speed,
      skillPower: Math.max(0, Number(progression.skillPower) || 0),
      ultimatePower: Math.max(0, Number(progression.ultimatePower) || 0),
      ...Object.fromEntries(MECHANIC_KEYS.map(key => [key, Math.max(0, Math.min(1, Number(progression[key]) || 0))])), skills,
      shield: 0, passion: 0, weakened: 0, buffs: [], debuffs: [],
      talentRoundUsed: false, talentBattleUsed: false
    };
  });
  const boss = Boolean(options.boss);
  const encounter = boss ? ENCOUNTER_PRESETS.boss : ENCOUNTER_PRESETS.normal;
  const enemyMaxHp = options.enemy?.maxHp ?? encounter.maxHp;
  const enemyMaxToughness = options.enemy?.maxToughness ?? (boss ? 10 : 6);
  const enemy = {
    hp: enemyMaxHp, maxHp: enemyMaxHp, attack: encounter.attack, defense: encounter.defense,
    affinity: options.enemy?.affinity || "wing", speed: boss ? 108 : 98, shield: 0,
    weakened: 0, recoveryCooldown: 0, maxToughness: enemyMaxToughness,
    toughness: enemyMaxToughness, broken: false, actionDelay: 0, controlSuppression: 0, buffs: [], debuffs: [],
    ...options.enemy
  };
  enemy.phase = options.enemy?.phase ?? enemyPhase(enemy, boss);
  const state = {
    seed: options.seed || 1, rngState: (Number(options.seed) >>> 0) || 1,
    turn: 1, ap: 3, status: "player", team, enemy, deck: [], hand: [], discard: [],
    intent: chooseEnemyIntent(1, enemy.hp / enemy.maxHp, enemy.phase), boss,
    maxTurns: encounter.maxTurns, log: [], events: [],
    link: { lastOwner: null, value: 0, max: 2 }, actionOrder: []
  };
  state.deck = shuffleForBattle(createBattleDeck(ids), state);
  refillBattleHand(state);
  refreshActionOrder(state);
  return state;
}

function damageTarget(target, damage) {
  const blocked = Math.min(target.shield || 0, damage);
  target.shield = Math.max(0, (target.shield || 0) - blocked);
  const dealt = Math.max(0, damage - blocked);
  target.hp = Math.max(0, target.hp - dealt);
  return dealt;
}

export function playBattleCard(input, cardIndex) {
  const state = cloneBattle(input);
  state.events = [];
  if (state.status !== "player" || state.ap <= 0) {
    state.events.push({ type: "action_rejected", reason: state.status !== "player" ? "not_player_turn" : "no_ap" });
    return state;
  }
  const card = state.hand[cardIndex];
  const unit = card && state.team.find(member => member.id === card.owner);
  if (!card || !unit || !isAlive(unit) || (card.ultimate && unit.passion < 5)) {
    state.events.push({ type: "action_rejected", reason: !card ? "missing_card" : !unit || !isAlive(unit) ? "unit_down" : "ultimate_not_ready" });
    return state;
  }
  const skill = card.ultimate ? unit.ultimate : unit[card.skill];
  state.hand.splice(cardIndex, 1);
  state.ap--;
  state.link ||= { lastOwner: null, value: 0, max: 2 };
  if (state.link.lastOwner && state.link.lastOwner !== unit.id) {
    state.link.value = Math.min(state.link.max, state.link.value + 1);
    state.events.push({ type: "link_gain", owner: unit.id, value: state.link.value, max: state.link.max });
  } else if (state.link.lastOwner === unit.id) state.link.value = 0;
  state.link.lastOwner = unit.id;
  const linkBonus = state.link.value * .02;
  const passionBefore = unit.passion;
  if (card.ultimate) unit.passion = 0;
  else unit.passion = Math.min(5, unit.passion + 1);
  const rank = card.ultimate ? 1 : card.rank;
  const scale = RANK_MULTIPLIER[rank] || 1;
  const growthPower = progressionPower(unit, card);
  state.events.push({ type: "card_play", owner: unit.id, skill: card.skill, rank: card.rank, ultimate: Boolean(card.ultimate), ap: state.ap });
  if (card.ultimate) state.events.push({ type: "ultimate", owner: unit.id });
  if (["damage", "pierce", "weaken"].includes(skill.type)) {
    const defense = skill.type === "pierce" ? state.enemy.defense * .45 : state.enemy.defense;
    const affinity = AFFINITY_MULTIPLIER[unit.affinity][state.enemy.affinity];
    const breakBonus = state.enemy.broken ? unit.id === "kingfisher" ? 1.35 : 1.2 : 1;
    const executeBonus = unit.id === "kingfisher" && (state.enemy.broken || state.enemy.hp / state.enemy.maxHp <= .35) ? Math.min(.3, unit.executePower) : 0;
    const damage = calculateDamage({ attack: unit.attack, defense, power: skill.power * growthPower * (1 + linkBonus) * breakBonus * (1 + executeBonus), rank, affinity, variance: .96 + nextBattleRandom(state) * .08 });
    const dealt = damageTarget(state.enemy, damage);
    state.events.push({ type: "damage", source: unit.id, target: "enemy", value: dealt, affinity, linkBonus, breakBonus, executeBonus });
    if (skill.type === "weaken") {
      const duration = card.ultimate ? 2 : rank;
      const magnitude = unit.id === "heron" ? .28 + Math.min(.2, unit.debuffPower) : .22;
      applyTimedStatus(state.enemy, "debuffs", { id: "weakened", duration, magnitude });
      state.enemy.weakened = Math.max(state.enemy.weakened, duration);
      state.events.push({ type: "status_applied", source: unit.id, target: "enemy", status: "weakened", duration, magnitude });
      if (unit.id === "heron" && card.ultimate && !unit.talentBattleUsed && state.enemy.actionDelay === 0) {
        unit.talentBattleUsed = true;
        state.enemy.actionDelay = 1;
        state.enemy.controlSuppression = Math.min(.3, unit.controlPower);
        state.events.push({ type: "talent_trigger", owner: unit.id, talent: "nightfall_delay", controlSuppression: state.enemy.controlSuppression, limit: "once_per_battle" });
      }
    }
    if (affinity > 1 && !state.enemy.broken && state.enemy.toughness > 0) {
      const talentBonus = unit.id === "kingfisher" ? 1 : 0;
      const progressionBonus = unit.id === "kingfisher" ? Math.min(.5, unit.breakPower) : 0;
      const toughnessDamage = Math.min(state.enemy.toughness, (card.ultimate ? 3 : rank) + talentBonus + progressionBonus);
      state.enemy.toughness -= toughnessDamage;
      state.events.push({ type: "toughness_damage", source: unit.id, value: toughnessDamage, talentBonus, progressionBonus, remaining: state.enemy.toughness });
      if (talentBonus) state.events.push({ type: "talent_trigger", owner: unit.id, talent: "azure_break", toughnessBonus: talentBonus });
      if (state.enemy.toughness === 0) {
        state.enemy.broken = true;
        state.enemy.actionDelay = 1;
        state.events.push({ type: "break", source: unit.id, target: "enemy", damageBonus: 1.2 });
      }
    }
    state.log.push({ type: "damage", owner: unit.id, value: dealt });
  } else if (skill.type === "shield") {
    const shieldBonus = unit.id === "spoonbill" ? Math.min(.5, unit.shieldPower) : 0;
    const value = Math.round(unit.attack * skill.power * scale * growthPower * (1 + linkBonus) * (1 + shieldBonus));
    const values = {};
    state.team.filter(isAlive).forEach(target => {
      const targetValue = unit.id === "spoonbill" && target.id === unit.id ? Math.round(value * 1.25) : value;
      target.shield = addShield(target, targetValue);
      values[target.id] = targetValue;
      applyTimedStatus(target, "buffs", { id: "ward", duration: card.ultimate ? 2 : 1, magnitude: .08 });
    });
    state.events.push({ type: "shield", source: unit.id, value, values, targets: state.team.filter(isAlive).map(target => target.id), linkBonus, shieldBonus });
    if (unit.id === "spoonbill") state.events.push({ type: "talent_trigger", owner: unit.id, talent: "tidal_bulwark", multiplier: 1.25 });
    state.log.push({ type: "shield", owner: unit.id, value });
  } else if (skill.type === "heal") {
    const rescue = unit.id === "egret" && !unit.talentBattleUsed && state.team.some(target => isAlive(target) && target.hp / target.maxHp <= .35);
    const rescueBonus = rescue ? 1.35 : 1;
    const healingBonus = unit.id === "egret" ? Math.min(.5, unit.healingPower) : 0;
    const value = Math.round(unit.attack * skill.power * scale * growthPower * (1 + linkBonus) * rescueBonus * (1 + healingBonus));
    if (rescue) {
      unit.talentBattleUsed = true;
      state.events.push({ type: "talent_trigger", owner: unit.id, talent: "reed_rescue", multiplier: rescueBonus, limit: "once_per_battle" });
    }
    state.team.filter(isAlive).forEach(target => { target.hp = Math.min(target.maxHp, target.hp + value); });
    if (unit.id === "egret" && (card.ultimate || card.rank >= 2) && unit.cleansePower >= 1) {
      const target = state.team.filter(isAlive).toSorted((left, right) => left.hp / left.maxHp - right.hp / right.maxHp).find(member => member.debuffs.length);
      const removed = target?.debuffs.shift();
      if (removed) state.events.push({ type: "talent_trigger", owner: unit.id, talent: "clearwater_cleanse", target: target.id, status: removed.id, limit: "once_per_action" });
    }
    state.events.push({ type: "heal", source: unit.id, value, targets: state.team.filter(isAlive).map(target => target.id), linkBonus, rescueBonus, healingBonus });
    state.log.push({ type: "heal", owner: unit.id, value });
  }
  state.discard.push(card);
  const nextPhase = enemyPhase(state.enemy, state.boss);
  if (nextPhase > state.enemy.phase) {
    state.enemy.phase = nextPhase;
    state.events.push({ type: "phase_change", target: "enemy", phase: nextPhase });
  }
  if (!card.ultimate && passionBefore < 5 && unit.passion === 5) state.events.push({ type: "ultimate_ready", owner: unit.id });
  if (state.enemy.hp <= 0) {
    state.status = "victory";
    state.events.push({ type: "battle_end", result: "victory" });
  } else refillBattleHand(state);
  refreshActionOrder(state);
  return state;
}

export function endPlayerTurn(input) {
  const state = cloneBattle(input);
  state.events = [];
  if (state.status !== "player" || state.enemy.hp <= 0) {
    state.events.push({ type: "action_rejected", reason: state.enemy.hp <= 0 ? "battle_over" : "not_player_turn" });
    return state;
  }
  state.status = "enemy";
  const intent = state.intent;
  let enemyDelayed = false;
  if (state.enemy.actionDelay > 0) {
    state.enemy.actionDelay--;
    enemyDelayed = true;
    state.events.push({ type: "enemy_delayed", target: "enemy", intent: intent.type });
    state.events.push({ type: "intent_resolved", intent: intent.type, delayed: true });
  } else {
    if (state.enemy.broken) {
      state.enemy.broken = false;
      state.enemy.toughness = state.enemy.maxToughness;
      state.events.push({ type: "toughness_reset", target: "enemy", value: state.enemy.toughness });
    }
    state.events.push({ type: "intent_resolved", intent: intent.type, delayed: false });
    if (intent.type === "guard") {
      const value = Math.round(state.enemy.maxHp * intent.power);
      state.enemy.shield = Math.min(Math.round(state.enemy.maxHp * .3), state.enemy.shield + value);
      applyTimedStatus(state.enemy, "buffs", { id: "guard", duration: 1, magnitude: .1 });
      state.events.push({ type: "enemy_shield", value });
    } else if (intent.type === "recover") {
      const before = state.enemy.hp;
      state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + Math.round(state.enemy.maxHp * intent.power));
      state.enemy.recoveryCooldown = 3;
      state.events.push({ type: "enemy_heal", value: state.enemy.hp - before });
    } else {
      const candidates = state.team.filter(isAlive);
      let targets = intent.type === "burst" ? candidates : [candidates.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]];
      const guardian = candidates.find(target => target.id === "spoonbill" && target.shield > 0);
      if (targets.length === 1 && guardian && targets[0]?.id !== guardian.id) {
        const protectedId = targets[0].id;
        targets = [guardian];
        state.events.push({ type: "talent_trigger", owner: guardian.id, talent: "tidal_intercept", protected: protectedId, limit: "once_per_intent" });
      }
      for (const target of targets.filter(Boolean)) {
        const affinity = AFFINITY_MULTIPLIER[state.enemy.affinity]?.[target.affinity] || 1;
        const exposed = target.debuffs.find(status => status.id === "exposed")?.magnitude || 0;
        const guardianReduction = target.id === "spoonbill" && target.shield > 0 ? Math.max(.6, .85 - Math.min(.25, target.guardReduction)) : 1;
        const weakenMagnitude = state.enemy.debuffs.find(status => status.id === "weakened")?.magnitude || (state.enemy.weakened ? .22 : 0);
        const controlMultiplier = 1 - Math.min(.3, state.enemy.controlSuppression || 0);
        const base = state.enemy.attack * intent.power * affinity * (1 - weakenMagnitude) * (1 + exposed) * guardianReduction * controlMultiplier;
        const dealt = damageTarget(target, Math.max(1, Math.round(base - target.defense * .35)));
        state.events.push({ type: "enemy_damage", source: "enemy", target: target.id, value: dealt, affinity, guardianReduction, weakenMagnitude, controlMultiplier });
        if (intent.type === "mark" && isAlive(target)) {
          applyTimedStatus(target, "debuffs", { id: "exposed", duration: 2, magnitude: .1 });
          state.events.push({ type: "status_applied", source: "enemy", target: target.id, status: "exposed", duration: 2 });
        }
      }
    }
    state.enemy.controlSuppression = 0;
  }
  state.team.forEach(unit => tickTimedStatuses(unit, unit.id, state.events));
  tickTimedStatuses(state.enemy, "enemy", state.events);
  if (!state.team.some(isAlive)) {
    state.status = "defeat";
    state.events.push({ type: "battle_end", result: "defeat" });
    refreshActionOrder(state);
    return state;
  }
  state.turn++;
  state.ap = 3;
  state.status = "player";
  state.enemy.recoveryCooldown = Math.max(0, state.enemy.recoveryCooldown - 1);
  state.team.forEach(unit => { unit.shield = Math.round(unit.shield * .65); unit.weakened = Math.max(0, unit.weakened - 1); unit.talentRoundUsed = false; });
  const intentHpRatio = state.enemy.recoveryCooldown ? Math.max(.31, state.enemy.hp / state.enemy.maxHp) : state.enemy.hp / state.enemy.maxHp;
  if (!enemyDelayed) state.intent = chooseEnemyIntent(state.turn, intentHpRatio, state.enemy.phase);
  state.link = { lastOwner: null, value: 0, max: 2 };
  refillBattleHand(state);
  refreshActionOrder(state);
  state.events.push({ type: "turn_start", turn: state.turn, ap: state.ap, intent: state.intent });
  return state;
}

const percentile = (sorted, fraction) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];

function playableCardIndexes(state) {
  const alive = new Set(state.team.filter(isAlive).map(unit => unit.id));
  return state.hand.flatMap((card, index) => {
    const unit = state.team.find(member => member.id === card.owner);
    return alive.has(card.owner) && (!card.ultimate || unit.passion >= 5) ? [index] : [];
  });
}

function chooseSimulationCard(state, mode, supportUsed) {
  const indexes = playableCardIndexes(state);
  if (!indexes.length) return -1;
  const lowestHpRatio = Math.min(...state.team.filter(isAlive).map(unit => unit.hp / unit.maxHp));
  const score = index => {
    const card = state.hand[index];
    const unit = state.team.find(member => member.id === card.owner);
    const skill = card.ultimate ? unit.ultimate : unit[card.skill];
    const rank = card.ultimate ? 1 : card.rank;
    if (card.ultimate) return 10000 + unit.attack * skill.power;
    if (skill.type === "heal") return !supportUsed && lowestHpRatio < .68 ? 8000 + rank * 100 : 100;
    if (skill.type === "shield") return !supportUsed && ["attack", "burst"].includes(state.intent.type) ? 7000 + rank * 100 : 200;
    if (skill.type === "weaken") return !supportUsed && state.intent.type === "burst" ? 6500 + rank * 100 : 500;
    return 1000 + unit.attack * skill.power * RANK_MULTIPLIER[rank] * AFFINITY_MULTIPLIER[unit.affinity][state.enemy.affinity];
  };
  const ranked = indexes.toSorted((left, right) => score(right) - score(left));
  if (mode === "strategy" || nextBattleRandom(state) < .95) return ranked[0];
  return indexes[Math.floor(nextBattleRandom(state) * indexes.length)];
}

export function simulateBattles({ count = 1000, seed = 1, mode = "default", boss = false, enemy } = {}) {
  if (count < 1) throw new Error("Simulation count must be positive");
  const random = createSeededRandom(seed);
  const strategic = mode === "strategy";
  const team = strategic ? ["spoonbill", "heron", "egret"] : ["spoonbill", "kingfisher", "egret"];
  const level = boss ? 10 : strategic ? 6 : 5;
  const levels = Object.fromEntries(team.map(id => [id, level]));
  const turns = [];
  let wins = 0;
  let playerCards = 0;
  let enemyTurns = 0;
  let resolvedBattles = 0;
  let damageDealt = 0;
  let supportCards = 0;
  let breaks = 0;
  let enemyDelays = 0;
  for (let index = 0; index < count; index++) {
    let state = createBattleState({ team, levels, boss, enemy, seed: Math.floor(random() * 0xffffffff) || index + 1 });
    const maxTurns = state.maxTurns;
    while (state.status === "player" && state.turn <= maxTurns) {
      let supportUsed = false;
      while (state.status === "player" && state.ap > 0) {
        const cardIndex = chooseSimulationCard(state, mode, supportUsed);
        if (cardIndex < 0) break;
        const card = state.hand[cardIndex];
        const unit = state.team.find(member => member.id === card.owner);
        const skill = card.ultimate ? unit.ultimate : unit[card.skill];
        const enemyHp = state.enemy.hp;
        state = playBattleCard(state, cardIndex);
        breaks += state.events.filter(event => event.type === "break").length;
        supportUsed ||= ["heal", "shield", "weaken"].includes(skill.type);
        if (supportUsed && !["damage", "pierce"].includes(skill.type)) supportCards++;
        damageDealt += Math.max(0, enemyHp - state.enemy.hp);
        playerCards++;
      }
      if (state.status === "victory") break;
      state = endPlayerTurn(state);
      enemyDelays += state.events.filter(event => event.type === "enemy_delayed").length;
      enemyTurns++;
    }
    if (state.status === "player") state.status = "defeat";
    resolvedBattles++;
    if (state.status === "victory") wins++;
    turns.push(Math.min(state.turn, maxTurns));
  }
  turns.sort((a, b) => a - b);
  return { count, resolvedBattles, wins, winRate: wins / count, actions: { playerCards, supportCards, enemyTurns, damageDealt, breaks, enemyDelays }, turns: { p10: percentile(turns, .1), p50: percentile(turns, .5), p90: percentile(turns, .9) } };
}
