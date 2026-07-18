import test from "node:test";
import assert from "node:assert/strict";

const progression = await import("../progression-engine.mjs").catch(() => ({}));

const {
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
} = progression;

const richState = (overrides = {}) => ({
  points: 100000,
  blindBoxFragments: 1000,
  blindBoxCollection: { spoonbill: 1 },
  spiritMaterials: { trainingDew: 1000, insightPlume: 100, skillFeather: 1000, traceSeed: 1000 },
  birdSpirits: { profiles: { spoonbill: {} }, sigilInventory: {} },
  ...overrides
});

test("progression module exposes its pure operation surface", () => {
  for (const name of ["normalizeProgression", "getProgressionStats", "getSpiritTalent", "getSpiritTraceNodes", "levelUpCost", "ascendCost", "skillUpgradeCost", "unlockTrace", "equipSigil", "resonanceFromCollection"]) {
    assert.equal(typeof progression[name], "function", `${name} must be exported`);
  }
});

test("the four spirits expose distinct innate talents and mechanic identities", () => {
  const talents = ["spoonbill", "kingfisher", "egret", "heron"].map(getSpiritTalent);
  assert.equal(new Set(talents.map(item => item.name)).size, 4);
  assert.deepEqual(talents.map(item => item.focus), ["guard", "break", "recovery", "control"]);
  assert.ok(talents.every(item => item.description.length >= 40));
  assert.deepEqual(talents.map(item => item.rules.map(rule => rule.id)), [
    ["tidal_bulwark", "tidal_intercept"],
    ["azure_break", "azure_pursuit"],
    ["reed_rescue", "clearwater_cleanse"],
    ["nightfall_pressure", "nightfall_delay"]
  ]);
  assert.equal(talents[2].rules[0].limit, "once_per_round");
  assert.equal(talents[3].rules[1].limit, "once_per_battle");
  assert.throws(() => getSpiritTalent("missing"), /unknown spirit/i);
});

test("each spirit trace tree contains shared foundations and unique mechanic nodes", () => {
  const spoonbill = getSpiritTraceNodes("spoonbill");
  const kingfisher = getSpiritTraceNodes("kingfisher");
  assert.ok(spoonbill["attack-sprout"]);
  assert.ok(kingfisher["attack-sprout"]);
  assert.ok(spoonbill["spoonbill-bulwark"]);
  assert.ok(spoonbill["spoonbill-estuary-oath"]);
  assert.equal(kingfisher["spoonbill-bulwark"], undefined);
  assert.ok(kingfisher["kingfisher-dive"]);
  assert.equal(Object.keys(spoonbill).length, Object.keys(progression.TRACE_NODES).length + 2);
});

test("exclusive traces enforce ownership and apply non-generic mechanic effects", () => {
  let state = normalizeProgression(richState({
    birdSpirits: { profiles: { spoonbill: { level: 15, ascension: 2, traces: ["survival-sprout"] }, kingfisher: { level: 15, ascension: 2, traces: ["attack-sprout"] } }, sigilInventory: {} }
  }), ["spoonbill", "kingfisher"]);
  assert.throws(() => unlockTrace(state, "kingfisher", "spoonbill-bulwark"), /unknown trace/i);
  state = unlockTrace(state, "spoonbill", "spoonbill-bulwark");
  state = unlockTrace(state, "spoonbill", "spoonbill-estuary-oath");
  const guarded = getProgressionStats(state, "spoonbill", { hp: 1000, attack: 100, defense: 100 });
  const striker = getProgressionStats(state, "kingfisher", { hp: 1000, attack: 100, defense: 100 });
  assert.ok(guarded.bonuses.shieldPower > .2);
  assert.ok(guarded.bonuses.guardReduction > striker.bonuses.guardReduction);
  assert.ok(striker.bonuses.breakPower > guarded.bonuses.breakPower);
});

test("normalization preserves valid exclusive nodes only for their owner", () => {
  const state = normalizeProgression(richState({
    birdSpirits: { profiles: {
      spoonbill: { traces: ["spoonbill-bulwark", "kingfisher-dive"] },
      kingfisher: { traces: ["kingfisher-dive", "spoonbill-bulwark"] }
    }, sigilInventory: {} }
  }), ["spoonbill", "kingfisher"]);
  assert.deepEqual(state.birdSpirits.profiles.spoonbill.traces, ["spoonbill-bulwark"]);
  assert.deepEqual(state.birdSpirits.profiles.kingfisher.traces, ["kingfisher-dive"]);
});

test("normalization migrates incomplete state without inventing currency", () => {
  const state = normalizeProgression({
    points: 80.8,
    blindBoxFragments: -3,
    blindBoxCollection: { spoonbill: 4 },
    spiritMaterials: { trainingDew: 7, fakeGem: 999 },
    birdSpirits: { profiles: { spoonbill: { level: 99, skills: { basic: 9 }, traces: ["bad-node"] } } }
  }, ["spoonbill", "egret"]);

  assert.equal(state.points, 80);
  assert.equal(state.blindBoxFragments, 0);
  assert.deepEqual(state.spiritMaterials, { trainingDew: 7, insightPlume: 0, skillFeather: 0, traceSeed: 0 });
  assert.deepEqual(Object.keys(state.spiritMaterials), ["trainingDew", "insightPlume", "skillFeather", "traceSeed"]);
  assert.equal(state.birdSpirits.profiles.spoonbill.level, 20);
  assert.equal(state.birdSpirits.profiles.spoonbill.skills.basic, 6);
  assert.equal(state.birdSpirits.profiles.spoonbill.resonance, 3);
  assert.deepEqual(state.birdSpirits.profiles.spoonbill.traces, []);
  assert.equal(state.birdSpirits.profiles.egret.level, 1);
});

test("legacy level maps migrate into profiles with reachable ascension state", () => {
  const state = normalizeProgression({
    points: 1,
    birdSpirits: { levels: { spoonbill: 18, egret: 5 } }
  }, ["spoonbill", "egret"]);

  assert.deepEqual(
    Object.fromEntries(Object.entries(state.birdSpirits.profiles).map(([id, profile]) => [id, [profile.level, profile.ascension]])),
    { spoonbill: [18, 3], egret: [5, 0] }
  );
});

test("level training spends the shared economy immutably and stops at ascension caps", () => {
  const initial = normalizeProgression(richState(), ["spoonbill"]);
  const cost = levelUpCost(1);
  const next = levelUpSpirit(initial, "spoonbill");

  assert.equal(initial.birdSpirits.profiles.spoonbill.level, 1);
  assert.equal(next.birdSpirits.profiles.spoonbill.level, 2);
  assert.equal(next.points, initial.points - cost.points);
  assert.equal(next.spiritMaterials.trainingDew, initial.spiritMaterials.trainingDew - cost.spiritMaterials.trainingDew);

  let capped = next;
  while (capped.birdSpirits.profiles.spoonbill.level < 5) capped = levelUpSpirit(capped, "spoonbill");
  assert.throws(() => levelUpSpirit(capped, "spoonbill"), /ascend/i);
  assert.equal(capped.birdSpirits.profiles.spoonbill.level, 5);
});

test("experience levels automatically but banks overflow at the current ascension gate", () => {
  const initial = normalizeProgression(richState(), ["spoonbill"]);
  const gained = addSpiritExperience(initial, "spoonbill", 100000);
  const profile = gained.birdSpirits.profiles.spoonbill;

  assert.equal(profile.level, 5);
  assert.equal(profile.exp, experienceToNext(5) - 1);
  assert.equal(initial.birdSpirits.profiles.spoonbill.level, 1);
  assert.throws(() => addSpiritExperience(initial, "spoonbill", -1), /experience/i);
});

test("ascension is available only at levels 5, 10, and 15 and deducts existing resources", () => {
  let state = normalizeProgression(richState(), ["spoonbill"]);
  assert.throws(() => ascendSpirit(state, "spoonbill"), /level 5/i);
  state.birdSpirits.profiles.spoonbill.level = 5;
  const cost = ascendCost(0);
  const ascended = ascendSpirit(state, "spoonbill");

  assert.equal(ascended.birdSpirits.profiles.spoonbill.ascension, 1);
  assert.equal(ascended.blindBoxFragments, state.blindBoxFragments - cost.blindBoxFragments);
  assert.equal(ascended.spiritMaterials.insightPlume, state.spiritMaterials.insightPlume - cost.spiritMaterials.insightPlume);
  assert.throws(() => ascendSpirit(ascended, "spoonbill"), /level 10/i);
  assert.throws(() => ascendCost(3), /maximum/i);
});

test("failed resource checks leave the input untouched", () => {
  const state = normalizeProgression(richState({ points: 0, blindBoxFragments: 0, spiritMaterials: {} }), ["spoonbill"]);
  const snapshot = structuredClone(state);
  assert.throws(() => levelUpSpirit(state, "spoonbill"), /points/i);
  state.birdSpirits.profiles.spoonbill.level = 5;
  assert.throws(() => ascendSpirit(state, "spoonbill"), /blindBoxFragments/i);
  assert.deepEqual({ ...state, birdSpirits: { ...state.birdSpirits, profiles: { spoonbill: snapshot.birdSpirits.profiles.spoonbill } } }, snapshot);
});

test("basic, spell, and ultimate skills respect level, ascension, and rank six", () => {
  let state = normalizeProgression(richState(), ["spoonbill"]);
  const firstCost = skillUpgradeCost(1);
  state = upgradeSkill(state, "spoonbill", "basic");
  assert.equal(state.birdSpirits.profiles.spoonbill.skills.basic, 2);
  assert.equal(state.points, 100000 - firstCost.points);
  assert.throws(() => upgradeSkill(state, "spoonbill", "basic"), /ascension/i);

  state.birdSpirits.profiles.spoonbill.level = 20;
  state.birdSpirits.profiles.spoonbill.ascension = 3;
  for (const skill of ["basic", "spell", "ultimate"]) {
    while (state.birdSpirits.profiles.spoonbill.skills[skill] < 6) state = upgradeSkill(state, "spoonbill", skill);
    assert.throws(() => upgradeSkill(state, "spoonbill", skill), /maximum/i);
  }
});

test("trace branches require their parent, level, ascension, and shared materials", () => {
  let state = normalizeProgression(richState(), ["spoonbill"]);
  assert.throws(() => unlockTrace(state, "spoonbill", "attack-current"), /requires trace attack-sprout/i);
  state.birdSpirits.profiles.spoonbill.level = 5;
  const points = state.points;
  const seeds = state.spiritMaterials.traceSeed;
  state = unlockTrace(state, "spoonbill", "attack-sprout");
  assert.deepEqual(state.birdSpirits.profiles.spoonbill.traces, ["attack-sprout"]);
  assert.ok(state.points < points);
  assert.ok(state.spiritMaterials.traceSeed < seeds);
  assert.throws(() => unlockTrace(state, "spoonbill", "attack-sprout"), /already unlocked/i);
  assert.throws(() => unlockTrace(state, "spoonbill", "attack-current"), /ascension/i);
});

test("three sigil slots enforce ownership and slot type", () => {
  const inventory = {
    reedWing: { id: "reedWing", set: "reed", slot: 0, main: { stat: "attackPercent", value: .12 }, subs: [{ stat: "hp", value: 40 }] },
    reedEye: { id: "reedEye", set: "reed", slot: 1, main: { stat: "defensePercent", value: .1 }, subs: [] },
    reedNest: { id: "reedNest", set: "reed", slot: 2, main: { stat: "hpPercent", value: .15 }, subs: [{ stat: "attack", value: 8 }] }
  };
  let state = normalizeProgression(richState({ birdSpirits: { profiles: { spoonbill: {} }, sigilInventory: inventory } }), ["spoonbill"]);
  state = equipSigil(state, "spoonbill", 0, "reedWing");
  assert.equal(state.birdSpirits.profiles.spoonbill.sigils[0], "reedWing");
  assert.throws(() => equipSigil(state, "spoonbill", 1, "reedWing"), /slot/i);
  assert.throws(() => equipSigil(state, "spoonbill", 2, "missing"), /owned/i);
  assert.throws(() => equipSigil(state, "spoonbill", 3, "reedNest"), /slot/i);
});

test("stats combine level growth, traces, main/sub stats, and two/three-piece sets", () => {
  const inventory = {
    a: { id: "a", set: "reed", slot: 0, main: { stat: "attackPercent", value: .1 }, subs: [{ stat: "attack", value: 5 }] },
    b: { id: "b", set: "reed", slot: 1, main: { stat: "defensePercent", value: .1 }, subs: [{ stat: "hp", value: 20 }] },
    c: { id: "c", set: "reed", slot: 2, main: { stat: "hpPercent", value: .1 }, subs: [{ stat: "defense", value: 3 }] }
  };
  let state = normalizeProgression(richState({ blindBoxCollection: { spoonbill: 7 }, birdSpirits: { profiles: { spoonbill: { level: 10, ascension: 1, traces: ["attack-sprout", "survival-sprout", "mechanism-tide"] } }, sigilInventory: inventory } }), ["spoonbill"]);
  state = equipSigil(equipSigil(equipSigil(state, "spoonbill", 0, "a"), "spoonbill", 1, "b"), "spoonbill", 2, "c");
  const stats = getProgressionStats(state, "spoonbill", { hp: 1000, attack: 100, defense: 80 });

  assert.ok(stats.hp > 1200);
  assert.ok(stats.attack > 130);
  assert.ok(stats.defense > 100);
  assert.equal(stats.setBonuses.reed, 3);
  assert.ok(stats.bonuses.skillPower > 0);
  assert.ok(stats.bonuses.ultimatePower > 0);
});

test("duplicate blind boxes map directly to resonance one through six", () => {
  assert.equal(resonanceFromCollection({}, "egret"), 0);
  assert.equal(resonanceFromCollection({ egret: 1 }, "egret"), 0);
  assert.equal(resonanceFromCollection({ egret: 2 }, "egret"), 1);
  assert.equal(resonanceFromCollection({ egret: { count: 5 } }, "egret"), 4);
  assert.equal(resonanceFromCollection({ egret: 999 }, "egret"), 6);
});

test("normalization clamps every progression ceiling and strips malformed sigils", () => {
  const state = normalizeProgression(richState({
    blindBoxCollection: { spoonbill: 999 },
    birdSpirits: {
      profiles: { spoonbill: { level: 30, exp: -8, ascension: 9, skills: { basic: 8, spell: -1, ultimate: 99 }, sigils: ["valid", "wrong", "also-wrong", "extra"] } },
      sigilInventory: { valid: { id: "valid", set: "tide", slot: 0, main: { stat: "attack", value: 10 }, subs: [] } }
    }
  }), ["spoonbill"]);
  const profile = state.birdSpirits.profiles.spoonbill;
  assert.deepEqual({ level: profile.level, exp: profile.exp, ascension: profile.ascension, resonance: profile.resonance }, { level: 20, exp: 0, ascension: 3, resonance: 6 });
  assert.deepEqual(profile.skills, { basic: 6, spell: 1, ultimate: 6 });
  assert.deepEqual(profile.sigils, ["valid", null, null]);
});
