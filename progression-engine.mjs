export const MAX_LEVEL = 20;
export const MAX_SKILL_LEVEL = 6;
export const MATERIAL_KEYS = ["trainingDew", "insightPlume", "skillFeather", "traceSeed"];
export const ASCENSION_LEVELS = [5, 10, 15];
export const SKILL_KEYS = ["basic", "spell", "ultimate"];

export const TRACE_NODES = {
  "attack-sprout": { branch: "attack", level: 3, ascension: 0, attackPercent: .05, points: 120, traceSeed: 2 },
  "attack-current": { branch: "attack", level: 5, ascension: 1, requires: "attack-sprout", attackPercent: .07, points: 220, traceSeed: 4 },
  "attack-crown": { branch: "attack", level: 12, ascension: 2, requires: "attack-current", attackPercent: .1, points: 420, traceSeed: 7 },
  "survival-sprout": { branch: "survival", level: 3, ascension: 0, hpPercent: .05, defensePercent: .04, points: 120, traceSeed: 2 },
  "survival-current": { branch: "survival", level: 5, ascension: 1, requires: "survival-sprout", hpPercent: .07, defensePercent: .06, points: 220, traceSeed: 4 },
  "survival-crown": { branch: "survival", level: 12, ascension: 2, requires: "survival-current", hpPercent: .1, defensePercent: .08, points: 420, traceSeed: 7 },
  "mechanism-tide": { branch: "mechanism", level: 5, ascension: 0, skillPower: .08, points: 180, traceSeed: 3 },
  "mechanism-echo": { branch: "mechanism", level: 15, ascension: 2, requires: "mechanism-tide", ultimatePower: .12, points: 480, traceSeed: 8 }
};

const SPIRIT_TALENTS = {
  spoonbill: {
    id: "tidal_bulwark",
    name: "Tidal Ward",
    focus: "guard",
    description: "While holding a shield, the spoonbill anchors the formation and converts barrier strength into steadier team mitigation.",
    effects: { shieldPower: .1, guardReduction: .04 },
    rules: [
      { id: "tidal_bulwark", trigger: "shield_created", limit: "always", description: "The spoonbill receives a stronger share of every team barrier." },
      { id: "tidal_intercept", trigger: "single_target_intent", limit: "once_per_round", description: "Redirect one lethal single-target intent from the weakest ally." }
    ]
  },
  kingfisher: {
    id: "azure_break",
    name: "Azure Dive",
    focus: "break",
    description: "The kingfisher rewards precise affinity attacks with stronger toughness pressure and increased damage against weakened targets.",
    effects: { breakPower: .12, executePower: .08 },
    rules: [
      { id: "azure_break", trigger: "advantaged_hit", limit: "always", description: "Advantaged attacks remove one additional point of toughness." },
      { id: "azure_pursuit", trigger: "broken_target_hit", limit: "always", description: "Broken and low-health targets take a finite pursuit multiplier." }
    ]
  },
  egret: {
    id: "reed_rescue",
    name: "Reed Benediction",
    focus: "recovery",
    description: "The egret turns every recovery action into sustained team tempo, improving healing and the reliability of status cleansing.",
    effects: { healingPower: .12, cleansePower: .1 },
    rules: [
      { id: "reed_rescue", trigger: "critical_heal", limit: "once_per_round", description: "The first heal on a critically wounded ally each round is amplified." },
      { id: "clearwater_cleanse", trigger: "high_rank_heal", limit: "once_per_action", description: "A high-rank recovery card can cleanse one harmful status." }
    ]
  },
  heron: {
    id: "nightfall_delay",
    name: "Patient Night",
    focus: "control",
    description: "The night heron studies telegraphed intent, amplifying debuffs and extending the tactical window created by control effects.",
    effects: { debuffPower: .12, controlPower: .1 },
    rules: [
      { id: "nightfall_pressure", trigger: "debuff_applied", limit: "always", description: "Weaken effects gain magnitude when an enemy intent is visible." },
      { id: "nightfall_delay", trigger: "first_weaken", limit: "once_per_battle", description: "The first successful weaken delays the next hostile action." }
    ]
  },
  tuantuan: {
    id: "team_aura",
    name: "Team Aura",
    focus: "morale",
    description: "TuanTuan converts high morale into a steadier team buffer, keeping the formation energetic through pressure turns.",
    effects: { healingPower: .08, shieldPower: .08, ultimatePower: .08 },
    rules: [
      { id: "team_aura", trigger: "support_action", limit: "always", description: "Support actions add a small morale buffer to the formation." },
      { id: "lucky_smile", trigger: "ultimate", limit: "once_per_battle", description: "The first ultimate improves the team's recovery and shield tempo." }
    ]
  }
};

const SPIRIT_TRACE_NODES = {
  spoonbill: {
    "spoonbill-bulwark": { branch: "mechanism", name: "Mudflat Bulwark", description: "Support skills create denser barriers for the entire formation.", level: 5, ascension: 1, requires: "survival-sprout", shieldPower: .12, points: 260, traceSeed: 4 },
    "spoonbill-estuary-oath": { branch: "mechanism", name: "Estuary Oath", description: "A protected formation takes less direct health damage while barriers remain.", level: 15, ascension: 2, requires: "spoonbill-bulwark", hpPercent: .04, guardReduction: .08, points: 520, traceSeed: 8 }
  },
  kingfisher: {
    "kingfisher-dive": { branch: "mechanism", name: "Current-Splitting Dive", description: "Advantaged strikes remove more toughness and accelerate break windows.", level: 5, ascension: 1, requires: "attack-sprout", attackPercent: .04, breakPower: .18, points: 260, traceSeed: 4 },
    "kingfisher-afterimage": { branch: "mechanism", name: "Blue Afterimage", description: "Damage rises against low-health or broken targets without improving survival.", level: 15, ascension: 2, requires: "kingfisher-dive", ultimatePower: .08, executePower: .15, points: 520, traceSeed: 8 }
  },
  egret: {
    "egret-reed-song": { branch: "mechanism", name: "Reedbed Song", description: "Recovery skills restore more health and stabilize prolonged encounters.", level: 5, ascension: 1, requires: "mechanism-tide", hpPercent: .04, healingPower: .15, points: 260, traceSeed: 4 },
    "egret-clear-water": { branch: "mechanism", name: "Clear Water", description: "High-rank recovery skills gain a dependable route to cleanse harmful effects.", level: 15, ascension: 2, requires: "egret-reed-song", skillPower: .06, cleansePower: .9, points: 520, traceSeed: 8 }
  },
  heron: {
    "heron-nightfall": { branch: "mechanism", name: "Nightfall Pressure", description: "Debuffs become stronger when played into a revealed enemy intention.", level: 5, ascension: 1, requires: "mechanism-tide", skillPower: .04, debuffPower: .15, points: 260, traceSeed: 4 },
    "heron-patient-hunt": { branch: "mechanism", name: "Patient Hunt", description: "Control effects delay dangerous actions and reinforce the next ultimate window.", level: 15, ascension: 2, requires: "heron-nightfall", ultimatePower: .08, controlPower: .15, points: 520, traceSeed: 8 }
  },
  tuantuan: {
    "tuantuan-morale": { branch: "mechanism", name: "Morale Halo", description: "Support skills restore more health while keeping the front line confident.", level: 5, ascension: 1, requires: "mechanism-tide", healingPower: .1, hpPercent: .04, points: 260, traceSeed: 4 },
    "tuantuan-lucky-core": { branch: "mechanism", name: "Lucky Core", description: "Ultimate turns create stronger team buffers without replacing dedicated guardians.", level: 15, ascension: 2, requires: "tuantuan-morale", shieldPower: .1, ultimatePower: .08, points: 520, traceSeed: 8 }
  }
};

export function getSpiritTalent(birdId) {
  const talent = SPIRIT_TALENTS[birdId];
  if (!talent) throw new Error(`Unknown spirit: ${birdId}`);
  return clone(talent);
}

export function getSpiritTraceNodes(birdId) {
  if (!SPIRIT_TALENTS[birdId]) throw new Error(`Unknown spirit: ${birdId}`);
  return clone({ ...TRACE_NODES, ...SPIRIT_TRACE_NODES[birdId] });
}

export const SIGIL_SETS = {
  reed: { two: { defensePercent: .08 }, three: { hpPercent: .1 } },
  tide: { two: { attackPercent: .08 }, three: { skillPower: .1 } },
  flight: { two: { hpPercent: .08 }, three: { ultimatePower: .12 } }
};

const MECHANIC_KEYS = ["shieldPower", "guardReduction", "breakPower", "executePower", "healingPower", "cleansePower", "debuffPower", "controlPower"];
const STAT_KEYS = new Set(["hp", "attack", "defense", "hpPercent", "attackPercent", "defensePercent", "skillPower", "ultimatePower", ...MECHANIC_KEYS]);
const clone = value => structuredClone(value);
const integer = (value, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) => Math.max(minimum, Math.min(maximum, Math.floor(Number(value) || 0)));

function normalizeSigil(value, id) {
  if (!value || typeof value !== "object" || value.id !== id || !SIGIL_SETS[value.set]) return null;
  const slot = integer(value.slot, 0, 2);
  if (Number(value.slot) !== slot || !STAT_KEYS.has(value.main?.stat) || !(Number(value.main?.value) > 0)) return null;
  const subs = Array.isArray(value.subs) ? value.subs.filter(item => STAT_KEYS.has(item?.stat) && Number(item.value) > 0).slice(0, 4).map(item => ({ stat: item.stat, value: Number(item.value) })) : [];
  return { id, set: value.set, slot, main: { stat: value.main.stat, value: Number(value.main.value) }, subs };
}

export function resonanceFromCollection(collection, birdId) {
  const entry = collection?.[birdId];
  const count = typeof entry === "object" ? entry?.count : entry;
  return integer(Number(count) - 1, 0, 6);
}

function traceNodesForSpirit(birdId) {
  return { ...TRACE_NODES, ...(SPIRIT_TRACE_NODES[birdId] || {}) };
}

function normalizeProfile(source, resonance, inventory, legacyLevel, birdId) {
  const level = integer(source?.level ?? legacyLevel ?? 1, 1, MAX_LEVEL);
  const impliedAscension = level > 15 ? 3 : level > 10 ? 2 : level > 5 ? 1 : 0;
  const ascension = source?.ascension == null ? impliedAscension : integer(source.ascension, impliedAscension, 3);
  const skills = Object.fromEntries(SKILL_KEYS.map(key => [key, integer(source?.skills?.[key] || 1, 1, MAX_SKILL_LEVEL)]));
  const availableTraces = traceNodesForSpirit(birdId);
  const traces = [...new Set(Array.isArray(source?.traces) ? source.traces : [])].filter(id => availableTraces[id]);
  const equipped = Array.isArray(source?.sigils) ? source.sigils.slice(0, 3) : [];
  const sigils = Array.from({ length: 3 }, (_, slot) => {
    const id = typeof equipped[slot] === "string" ? equipped[slot] : null;
    return id && inventory[id]?.slot === slot ? id : null;
  });
  return { level, exp: level === MAX_LEVEL ? 0 : integer(source?.exp, 0, experienceToNext(level) - 1), ascension, skills, traces, sigils, resonance };
}

export function normalizeProgression(input = {}, spiritIds = []) {
  const root = input && typeof input === "object" && !Array.isArray(input) ? clone(input) : {};
  root.points = integer(root.points);
  root.blindBoxFragments = integer(root.blindBoxFragments);
  root.blindBoxCollection = root.blindBoxCollection && typeof root.blindBoxCollection === "object" && !Array.isArray(root.blindBoxCollection) ? root.blindBoxCollection : {};
  root.spiritMaterials = Object.fromEntries(MATERIAL_KEYS.map(key => [key, integer(root.spiritMaterials?.[key])]));
  const spirits = root.birdSpirits && typeof root.birdSpirits === "object" && !Array.isArray(root.birdSpirits) ? root.birdSpirits : {};
  const sourceInventory = spirits.sigilInventory && typeof spirits.sigilInventory === "object" && !Array.isArray(spirits.sigilInventory) ? spirits.sigilInventory : {};
  const sigilInventory = Object.fromEntries(Object.entries(sourceInventory).flatMap(([id, value]) => {
    const sigil = normalizeSigil(value, id);
    return sigil ? [[id, sigil]] : [];
  }));
  const sourceProfiles = spirits.profiles && typeof spirits.profiles === "object" && !Array.isArray(spirits.profiles) ? spirits.profiles : {};
  const ids = [...new Set([...Object.keys(sourceProfiles), ...spiritIds.filter(id => typeof id === "string" && id)])];
  const profiles = Object.fromEntries(ids.map(id => [id, normalizeProfile(sourceProfiles[id], resonanceFromCollection(root.blindBoxCollection, id), sigilInventory, spirits.levels?.[id], id)]));
  root.birdSpirits = { ...spirits, profiles, sigilInventory };
  return root;
}

export function experienceToNext(level) {
  const value = integer(level, 1, MAX_LEVEL);
  return value >= MAX_LEVEL ? 0 : 80 + value * 24;
}

export function levelUpCost(level) {
  const value = integer(level, 1, MAX_LEVEL);
  if (value >= MAX_LEVEL) throw new Error("Spirit is at maximum level");
  return { points: 70 + value * 22, spiritMaterials: { trainingDew: 4 + Math.ceil(value / 2) } };
}

export function ascendCost(ascension) {
  const stage = integer(ascension, 0, 3);
  if (stage >= 3) throw new Error("Spirit is at maximum ascension");
  return { blindBoxFragments: [10, 20, 35][stage], spiritMaterials: { insightPlume: [2, 4, 7][stage] } };
}

export function skillUpgradeCost(currentLevel) {
  const level = integer(currentLevel, 1, MAX_SKILL_LEVEL);
  if (level >= MAX_SKILL_LEVEL) throw new Error("Skill is at maximum level");
  return { points: [0, 160, 260, 400, 600, 850][level], spiritMaterials: { skillFeather: [0, 3, 5, 8, 12, 18][level] } };
}

function operationState(input, birdId) {
  const state = normalizeProgression(input, [birdId]);
  const profile = state.birdSpirits.profiles[birdId];
  if (!profile) throw new Error(`Unknown spirit: ${birdId}`);
  return { state, profile };
}

function spend(state, cost) {
  for (const key of ["points", "blindBoxFragments"]) {
    const amount = cost[key] || 0;
    if (state[key] < amount) throw new Error(`Not enough ${key}`);
  }
  for (const [key, amount] of Object.entries(cost.spiritMaterials || {})) {
    if (state.spiritMaterials[key] < amount) throw new Error(`Not enough spiritMaterials.${key}`);
  }
  state.points -= cost.points || 0;
  state.blindBoxFragments -= cost.blindBoxFragments || 0;
  for (const [key, amount] of Object.entries(cost.spiritMaterials || {})) state.spiritMaterials[key] -= amount;
}

export function levelUpSpirit(input, birdId) {
  const { state, profile } = operationState(input, birdId);
  if (profile.level >= MAX_LEVEL) throw new Error("Spirit is at maximum level");
  const cap = ASCENSION_LEVELS[profile.ascension] || MAX_LEVEL;
  if (profile.level >= cap) throw new Error(`Spirit must ascend at level ${cap}`);
  spend(state, levelUpCost(profile.level));
  profile.level++;
  profile.exp = 0;
  return state;
}

export function addSpiritExperience(input, birdId, amount) {
  if (!Number.isFinite(Number(amount)) || Number(amount) < 0) throw new Error("Experience must be a non-negative number");
  const { state, profile } = operationState(input, birdId);
  profile.exp += Math.floor(Number(amount));
  const cap = ASCENSION_LEVELS[profile.ascension] || MAX_LEVEL;
  while (profile.level < cap && profile.level < MAX_LEVEL && profile.exp >= experienceToNext(profile.level)) {
    profile.exp -= experienceToNext(profile.level);
    profile.level++;
  }
  if (profile.level >= MAX_LEVEL) profile.exp = 0;
  else if (profile.level >= cap) profile.exp = Math.min(profile.exp, experienceToNext(profile.level) - 1);
  return state;
}

export function ascendSpirit(input, birdId) {
  const { state, profile } = operationState(input, birdId);
  if (profile.ascension >= 3) throw new Error("Spirit is at maximum ascension");
  const requiredLevel = ASCENSION_LEVELS[profile.ascension];
  if (profile.level !== requiredLevel) throw new Error(`Ascension requires level ${requiredLevel}`);
  spend(state, ascendCost(profile.ascension));
  profile.ascension++;
  return state;
}

const SKILL_GATES = {
  2: { level: 1, ascension: 0 },
  3: { level: 5, ascension: 1 },
  4: { level: 10, ascension: 1 },
  5: { level: 15, ascension: 2 },
  6: { level: 20, ascension: 3 }
};

export function upgradeSkill(input, birdId, skill) {
  if (!SKILL_KEYS.includes(skill)) throw new Error(`Unknown skill: ${skill}`);
  const { state, profile } = operationState(input, birdId);
  const current = profile.skills[skill];
  if (current >= MAX_SKILL_LEVEL) throw new Error("Skill is at maximum level");
  const gate = SKILL_GATES[current + 1];
  if (profile.ascension < gate.ascension) throw new Error(`Skill rank ${current + 1} requires ascension ${gate.ascension}`);
  if (profile.level < gate.level) throw new Error(`Skill rank ${current + 1} requires level ${gate.level}`);
  spend(state, skillUpgradeCost(current));
  profile.skills[skill]++;
  return state;
}

export function unlockTrace(input, birdId, nodeId) {
  const node = traceNodesForSpirit(birdId)[nodeId];
  if (!node) throw new Error(`Unknown trace: ${nodeId}`);
  const { state, profile } = operationState(input, birdId);
  if (profile.traces.includes(nodeId)) throw new Error(`Trace ${nodeId} is already unlocked`);
  if (node.requires && !profile.traces.includes(node.requires)) throw new Error(`Trace ${nodeId} requires trace ${node.requires}`);
  if (profile.ascension < node.ascension) throw new Error(`Trace ${nodeId} requires ascension ${node.ascension}`);
  if (profile.level < node.level) throw new Error(`Trace ${nodeId} requires level ${node.level}`);
  spend(state, { points: node.points, spiritMaterials: { traceSeed: node.traceSeed } });
  profile.traces.push(nodeId);
  return state;
}

export function equipSigil(input, birdId, slot, sigilId) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 2) throw new Error("Sigil slot must be 0, 1, or 2");
  const { state, profile } = operationState(input, birdId);
  if (sigilId === null) {
    profile.sigils[slot] = null;
    return state;
  }
  const sigil = state.birdSpirits.sigilInventory[sigilId];
  if (!sigil) throw new Error(`Sigil ${sigilId} is not owned`);
  if (sigil.slot !== slot) throw new Error(`Sigil ${sigilId} cannot use slot ${slot}`);
  for (const other of Object.values(state.birdSpirits.profiles)) other.sigils = other.sigils.map(id => id === sigilId ? null : id);
  profile.sigils[slot] = sigilId;
  return state;
}

function addBonus(target, source) {
  for (const key of ["hpPercent", "attackPercent", "defensePercent", "skillPower", "ultimatePower", ...MECHANIC_KEYS]) target[key] += source[key] || 0;
}

export function getProgressionStats(input, birdId, baseStats) {
  const { state, profile } = operationState(input, birdId);
  if (!["hp", "attack", "defense"].every(key => Number(baseStats?.[key]) > 0)) throw new Error("Positive hp, attack, and defense base stats are required");
  const growth = 1 + (profile.level - 1) * .05 + profile.ascension * .04;
  const flat = { hp: 0, attack: 0, defense: 0 };
  const bonus = Object.fromEntries(["hpPercent", "attackPercent", "defensePercent", "skillPower", "ultimatePower", ...MECHANIC_KEYS].map(key => [key, 0]));
  addBonus(bonus, SPIRIT_TALENTS[birdId]?.effects || {});
  const availableTraces = traceNodesForSpirit(birdId);
  for (const id of profile.traces) addBonus(bonus, availableTraces[id]);
  const equipped = profile.sigils.flatMap(id => id ? [state.birdSpirits.sigilInventory[id]] : []);
  for (const sigil of equipped) {
    for (const stat of [sigil.main, ...sigil.subs]) {
      if (stat.stat in flat) flat[stat.stat] += stat.value;
      else if (stat.stat in bonus) bonus[stat.stat] += stat.value;
    }
  }
  const setBonuses = {};
  for (const sigil of equipped) setBonuses[sigil.set] = (setBonuses[sigil.set] || 0) + 1;
  for (const [set, count] of Object.entries(setBonuses)) {
    if (count >= 2) addBonus(bonus, SIGIL_SETS[set].two);
    if (count >= 3) addBonus(bonus, SIGIL_SETS[set].three);
  }
  if (profile.resonance >= 1) bonus.attackPercent += .05;
  if (profile.resonance >= 2) bonus.hpPercent += .08;
  if (profile.resonance >= 3) bonus.defensePercent += .08;
  if (profile.resonance >= 4) bonus.skillPower += .1;
  if (profile.resonance >= 5) {
    bonus.hpPercent += .05;
    bonus.attackPercent += .05;
    bonus.defensePercent += .05;
  }
  if (profile.resonance >= 6) bonus.ultimatePower += .2;
  return {
    hp: Math.round(Number(baseStats.hp) * growth * (1 + bonus.hpPercent) + flat.hp),
    attack: Math.round(Number(baseStats.attack) * growth * (1 + bonus.attackPercent) + flat.attack),
    defense: Math.round(Number(baseStats.defense) * growth * (1 + bonus.defensePercent) + flat.defense),
    bonuses: Object.fromEntries(["skillPower", "ultimatePower", ...MECHANIC_KEYS].map(key => [key, bonus[key]])),
    setBonuses,
    level: profile.level,
    ascension: profile.ascension,
    resonance: profile.resonance
  };
}
