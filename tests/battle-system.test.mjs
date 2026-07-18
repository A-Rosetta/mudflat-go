import test from "node:test";
import assert from "node:assert/strict";
import { AFFINITY_MULTIPLIER, BATTLE_ROSTER, ENCOUNTER_PRESETS, calculateDamage, createBattleDeck, mergeAdjacentCards, statsAtLevel, chooseEnemyIntent, createSeededRandom, createBattleState, playBattleCard, endPlayerTurn } from "../battle-engine.mjs";

test("affinity triangle", () => {
  assert.equal(AFFINITY_MULTIPLIER.tide.wing, 1.3);
  assert.equal(AFFINITY_MULTIPLIER.wing.grove, 1.3);
  assert.equal(AFFINITY_MULTIPLIER.grove.tide, 1.3);
  assert.equal(AFFINITY_MULTIPLIER.tide.grove, 0.85);
});

test("level growth", () => {
  const level1 = statsAtLevel({ hp: 920, attack: 138, defense: 72 }, 1);
  const level20 = statsAtLevel({ hp: 920, attack: 138, defense: 72 }, 20);
  assert.deepEqual(level1, { hp: 920, attack: 138, defense: 72 });
  assert.ok(level20.hp > level1.hp * 2 && level20.hp < level1.hp * 3);
  assert.ok(level20.attack > level1.attack * 2);
});

test("damage formula", () => {
  assert.equal(calculateDamage({ attack: 180, defense: 80, power: 1.2, rank: 1, affinity: 1, variance: 1 }), 186);
  assert.equal(calculateDamage({ attack: 180, defense: 80, power: 1.2, rank: 2, affinity: 1.3, variance: 1 }), 391);
});

test("adjacent cards merge", () => {
  const merged = mergeAdjacentCards([{ owner: "egret", skill: "strike", rank: 1 }, { owner: "egret", skill: "strike", rank: 1 }, { owner: "kingfisher", skill: "strike", rank: 1 }]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].rank, 2);
});

test("adjacent merges cascade into a three-star card", () => {
  const card = { owner: "egret", skill: "strike", rank: 1 };
  assert.deepEqual(mergeAdjacentCards([card, card, card, card]), [{ ...card, rank: 3 }]);
});

test("deck has two skills per bird", () => {
  const deck = createBattleDeck(["egret", "kingfisher", "spoonbill"]);
  assert.equal(deck.length, 18);
  assert.equal(new Set(deck.map(card => `${card.owner}:${card.skill}`)).size, 6);
});

test("enemy intent cadence", () => {
  assert.deepEqual(chooseEnemyIntent(1, 1), { type: "attack", label: "俯冲啄击", power: 1.02 });
  assert.deepEqual(chooseEnemyIntent(3, 1), { type: "burst", label: "暴雨横扫", power: .72 });
  assert.equal(chooseEnemyIntent(2, 0.25).type, "recover");
});

test("seeded random is repeatable and variance stays within four percent", () => {
  const a = createSeededRandom(42), b = createSeededRandom(42);
  assert.deepEqual(Array.from({ length: 8 }, () => a()), Array.from({ length: 8 }, () => b()));
  const random = createSeededRandom(9);
  for (let i = 0; i < 100; i++) assert.ok(random.variance() >= .96 && random.variance() <= 1.04);
});

test("battle state draws a merged hand and starts with three action points", () => {
  const state = createBattleState({ seed: 7 });
  assert.equal(state.enemy.maxHp, ENCOUNTER_PRESETS.normal.maxHp);
  assert.equal(state.enemy.attack, ENCOUNTER_PRESETS.normal.attack);
  assert.equal(state.ap, 3);
  assert.equal(state.team.length, 3);
  assert.ok(state.hand.length >= 4 && state.hand.length <= 6);
  assert.ok(state.hand.every((card, index, hand) => index === 0 || !(card.owner === hand[index - 1].owner && card.skill === hand[index - 1].skill && card.rank === hand[index - 1].rank && card.rank < 3)));
});

test("cards spend AP, normal skills grant passion, and ultimate requires five", () => {
  let state = createBattleState({ seed: 13 });
  const owner = state.hand[0].owner;
  state = { ...state, hand: [{ owner, skill: "strike", rank: 1 }] };
  state = playBattleCard(state, 0);
  assert.equal(state.ap, 2);
  assert.equal(state.team.find(unit => unit.id === owner).passion, 1);
  state.team.find(unit => unit.id === owner).passion = 5;
  state.hand = [{ owner, skill: "ultimate", rank: 3, ultimate: true }];
  state = playBattleCard(state, 0);
  assert.equal(state.team.find(unit => unit.id === owner).passion, 0);
});

test("enemy phase resolves previewed intent and advances turn", () => {
  let state = createBattleState({ seed: 21 });
  state.intent = { type: "attack", power: .88, label: "Attack" };
  const before = state.team.reduce((sum, unit) => sum + unit.hp, 0);
  state = endPlayerTurn(state);
  assert.equal(state.turn, 2);
  assert.equal(state.ap, 3);
  assert.ok(state.team.reduce((sum, unit) => sum + unit.hp, 0) < before);
});

test("enemy damage uses the previewed power and affinity triangle", () => {
  const state = createBattleState({ seed: 23, enemy: { attack: 200, affinity: "wing" } });
  const target = state.team.find(unit => unit.id === "spoonbill");
  target.hp = Math.round(target.maxHp * .4);
  state.intent = { type: "attack", power: .5, label: "Measured attack" };
  const expected = Math.max(1, Math.round(200 * .5 * AFFINITY_MULTIPLIER.wing.tide - target.defense * .35));
  const next = endPlayerTurn(state);
  assert.equal(target.hp - next.team.find(unit => unit.id === target.id).hp, expected);
});

test("defeated unit cards are purged before the next player turn", () => {
  const state = createBattleState({ seed: 25 });
  const defeated = state.team[0].id;
  state.team[0].hp = 0;
  state.hand = Array.from({ length: 6 }, () => ({ owner: defeated, skill: "strike", rank: 1 }));
  state.intent = { type: "guard", power: .16, label: "Guard" };
  const next = endPlayerTurn(state);
  assert.ok(next.hand.length > 0);
  assert.ok(next.hand.every(card => card.owner !== defeated));
});

test("recovery has cooldown and shields are capped then decay", () => {
  let state = createBattleState({ seed: 31 });
  state.enemy.hp = Math.round(state.enemy.maxHp * .2);
  state.intent = { type: "recover", power: .12 };
  state = endPlayerTurn(state);
  assert.equal(state.enemy.recoveryCooldown, 2);
  assert.notEqual(state.intent.type, "recover");
  const guardian = state.team.find(unit => unit.id === "spoonbill");
  guardian.passion = 5;
  state.hand = [{ owner: guardian.id, skill: "ultimate", rank: 3, ultimate: true }];
  state = playBattleCard(state, 0);
  assert.ok(state.team.every(unit => unit.shield <= Math.round(unit.maxHp * .45)));
  const shield = state.team[0].shield;
  state.intent = { type: "guard", power: .16 };
  state = endPlayerTurn(state);
  assert.ok(state.team[0].shield < shield);
});

test("combat roles remain specialized", () => {
  const units = Object.values(BATTLE_ROSTER);
  const topAttack = units.toSorted((a, b) => b.attack - a.attack)[0];
  const healer = units.find(unit => unit.tactic.type === "heal");
  const guardian = units.find(unit => unit.tactic.type === "shield");
  assert.notEqual(topAttack.id, healer.id);
  assert.notEqual(topAttack.id, guardian.id);
  assert.notEqual(healer.id, guardian.id);
});

test("action preview reflects the real free player phase before the enemy phase", () => {
  const state = createBattleState({ seed: 41 });
  assert.ok(state.team.every(unit => Number.isFinite(unit.speed)));
  assert.equal(state.actionOrder.length, 4);
  assert.ok(state.actionOrder.slice(0, 3).every(entry => entry.side === "ally" && entry.phase === "player" && entry.freeAction));
  assert.deepEqual(state.actionOrder.slice(0, 3).map(entry => entry.id), ["kingfisher", "egret", "spoonbill"]);
  assert.deepEqual(state.actionOrder.at(-1), { id: "enemy", side: "enemy", speed: 98, phase: "enemy", freeAction: false, delayed: false, intent: state.intent.type });
});

test("advantaged attacks break toughness, delay the enemy, and expose a damage window", () => {
  let state = createBattleState({ seed: 43, enemy: { affinity: "wing", maxHp: 9999, hp: 9999, maxToughness: 2, toughness: 2 } });
  state.hand = [{ owner: "spoonbill", skill: "strike", rank: 2 }];
  state = playBattleCard(state, 0);
  assert.equal(state.enemy.toughness, 0);
  assert.equal(state.enemy.broken, true);
  assert.equal(state.enemy.actionDelay, 1);
  assert.ok(state.events.some(event => event.type === "toughness_damage" && event.value === 2));
  assert.ok(state.events.some(event => event.type === "break"));
  assert.equal(state.actionOrder.at(-1).delayed, true);

  const hpBeforeDelay = state.team.reduce((sum, unit) => sum + unit.hp, 0);
  state = endPlayerTurn(state);
  assert.equal(state.team.reduce((sum, unit) => sum + unit.hp, 0), hpBeforeDelay);
  assert.ok(state.events.some(event => event.type === "enemy_delayed"));

  state.hand = [{ owner: "kingfisher", skill: "strike", rank: 1 }];
  state = playBattleCard(state, 0);
  assert.ok(state.events.some(event => event.type === "damage" && event.breakBonus === 1.35));
});

test("timed buffs and debuffs expire at round boundaries", () => {
  let state = createBattleState({ seed: 47, team: ["spoonbill", "kingfisher", "heron"] });
  state.hand = [{ owner: "heron", skill: "tactic", rank: 1 }];
  state = playBattleCard(state, 0);
  assert.deepEqual(state.enemy.debuffs, [{ id: "weakened", duration: 1, magnitude: .28 }]);
  assert.equal(state.enemy.weakened, 1);
  state.intent = { type: "guard", label: "Reed ward", power: .16 };
  state = endPlayerTurn(state);
  assert.equal(state.enemy.weakened, 0);
  assert.deepEqual(state.enemy.debuffs, []);
  assert.ok(state.events.some(event => event.type === "status_expired" && event.status === "weakened"));
});

test("alternating birds builds a capped link bonus that resets each round", () => {
  let state = createBattleState({ seed: 53, enemy: { maxHp: 9999, hp: 9999 } });
  state.hand = [
    { owner: "spoonbill", skill: "strike", rank: 1 },
    { owner: "kingfisher", skill: "strike", rank: 1 },
    { owner: "egret", skill: "strike", rank: 1 }
  ];
  state = playBattleCard(state, 0);
  state = playBattleCard(state, 0);
  assert.equal(state.link.value, 1);
  assert.ok(state.events.some(event => event.type === "link_gain" && event.value === 1));
  state = playBattleCard(state, 0);
  assert.equal(state.link.value, 2);
  assert.ok(state.events.some(event => event.type === "damage" && event.linkBonus === .04));
  state.intent = { type: "guard", label: "Reed ward", power: .16 };
  state = endPlayerTurn(state);
  assert.deepEqual(state.link, { lastOwner: null, value: 0, max: 2 });
});

test("reaching five passion inserts exactly one ultimate and emits a ready event", () => {
  let state = createBattleState({ seed: 59 });
  const unit = state.team.find(member => member.id === "kingfisher");
  unit.passion = 4;
  state.hand = [{ owner: unit.id, skill: "strike", rank: 1 }];
  state = playBattleCard(state, 0);
  const ultimates = state.hand.filter(card => card.owner === unit.id && card.ultimate);
  assert.equal(ultimates.length, 1);
  assert.ok(state.events.some(event => event.type === "ultimate_ready" && event.owner === unit.id));
});

test("enemy telegraphs multiple patterns and changes phase at health thresholds", () => {
  const intentTypes = new Set(Array.from({ length: 6 }, (_, index) => chooseEnemyIntent(index + 1, .8, 1).type));
  assert.ok(intentTypes.size >= 3);

  let state = createBattleState({ seed: 61, enemy: { maxHp: 1000, hp: 510, defense: 0, affinity: "wing" } });
  state.hand = [{ owner: "kingfisher", skill: "strike", rank: 1 }];
  state = playBattleCard(state, 0);
  assert.equal(state.enemy.phase, 2);
  assert.ok(state.events.some(event => event.type === "phase_change" && event.phase === 2));
  state.intent = chooseEnemyIntent(state.turn, state.enemy.hp / state.enemy.maxHp, state.enemy.phase);
  const next = endPlayerTurn(state);
  assert.ok(next.events.some(event => event.type === "intent_resolved"));
  assert.ok(next.events.some(event => event.type === "turn_start"));
});

test("progression unit stats and skill ranks affect damage, healing, and shielding", () => {
  const unitStats = {
    kingfisher: { hp: 1400, attack: 260, defense: 110, skillPower: .2, ultimatePower: .35, skills: { basic: 6, spell: 4, ultimate: 5 } },
    egret: { hp: 1500, attack: 220, defense: 120, skillPower: .2, skills: { basic: 3, spell: 6, ultimate: 4 } },
    spoonbill: { hp: 1800, attack: 200, defense: 150, skillPower: .2, skills: { basic: 3, spell: 6, ultimate: 4 } }
  };
  let state = createBattleState({ seed: 67, unitStats, enemy: { maxHp: 9999, hp: 9999, defense: 0, affinity: "wing" } });
  const striker = state.team.find(unit => unit.id === "kingfisher");
  assert.equal(striker.maxHp, 1400);
  assert.equal(striker.attack, 260);
  assert.deepEqual(striker.skills, { basic: 6, spell: 4, ultimate: 5 });

  state.hand = [{ owner: "kingfisher", skill: "strike", rank: 1 }];
  state = playBattleCard(state, 0);
  const progressedDamage = state.events.find(event => event.type === "damage").value;
  let baseline = createBattleState({ seed: 67, enemy: { maxHp: 9999, hp: 9999, defense: 0, affinity: "wing" } });
  baseline.hand = [{ owner: "kingfisher", skill: "strike", rank: 1 }];
  baseline = playBattleCard(baseline, 0);
  assert.ok(progressedDamage > baseline.events.find(event => event.type === "damage").value * 1.5);

  state.hand = [{ owner: "egret", skill: "tactic", rank: 1 }];
  state.team.forEach(unit => { unit.hp = Math.round(unit.maxHp * .5); });
  state = playBattleCard(state, 0);
  assert.ok(state.events.find(event => event.type === "heal").value > 220 * .7);

  state.hand = [{ owner: "spoonbill", skill: "tactic", rank: 1 }];
  state = playBattleCard(state, 0);
  assert.ok(state.events.find(event => event.type === "shield").value > 200 * .72);
});

test("spoonbill specializes its ward and intercepts one telegraphed single-target hit", () => {
  let state = createBattleState({ seed: 71 });
  state.hand = [{ owner: "spoonbill", skill: "tactic", rank: 1 }];
  state = playBattleCard(state, 0);
  const guardian = state.team.find(unit => unit.id === "spoonbill");
  const striker = state.team.find(unit => unit.id === "kingfisher");
  assert.ok(guardian.shield > striker.shield);
  assert.ok(state.events.some(event => event.type === "talent_trigger" && event.owner === "spoonbill" && event.talent === "tidal_bulwark"));

  striker.hp = Math.round(striker.maxHp * .2);
  const strikerHp = striker.hp;
  const guardianTotal = guardian.hp + guardian.shield;
  state.intent = { type: "attack", label: "Dive", power: .5 };
  state = endPlayerTurn(state);
  assert.equal(state.team.find(unit => unit.id === "kingfisher").hp, strikerHp);
  const nextGuardian = state.team.find(unit => unit.id === "spoonbill");
  assert.ok(nextGuardian.hp + nextGuardian.shield < guardianTotal);
  assert.ok(state.events.some(event => event.type === "talent_trigger" && event.talent === "tidal_intercept" && event.protected === "kingfisher"));
});

test("kingfisher removes extra toughness and gains a finite broken-target bonus", () => {
  let state = createBattleState({ seed: 73, enemy: { affinity: "grove", maxHp: 9999, hp: 9999, maxToughness: 2, toughness: 2 } });
  state.hand = [{ owner: "kingfisher", skill: "strike", rank: 1 }];
  state = playBattleCard(state, 0);
  assert.equal(state.enemy.toughness, 0);
  assert.ok(state.events.some(event => event.type === "toughness_damage" && event.value === 2 && event.talentBonus === 1));
  assert.ok(state.events.some(event => event.type === "talent_trigger" && event.talent === "azure_break"));

  state.hand = [{ owner: "kingfisher", skill: "strike", rank: 1 }];
  state = playBattleCard(state, 0);
  assert.ok(state.events.some(event => event.type === "damage" && event.breakBonus === 1.35));
});

test("egret rescue amplifies only the first critical heal each battle", () => {
  let state = createBattleState({ seed: 79 });
  state.team.find(unit => unit.id === "kingfisher").hp = 100;
  state.hand = [{ owner: "egret", skill: "tactic", rank: 1 }];
  state = playBattleCard(state, 0);
  const rescued = state.events.find(event => event.type === "heal").value;
  assert.ok(state.events.some(event => event.type === "talent_trigger" && event.talent === "reed_rescue"));
  state.intent = { type: "guard", label: "Ward", power: .16 };
  state = endPlayerTurn(state);
  state.team.find(unit => unit.id === "kingfisher").hp = 100;
  state.hand = [{ owner: "egret", skill: "tactic", rank: 1 }];
  state = playBattleCard(state, 0);
  assert.ok(state.events.find(event => event.type === "heal").value < rescued);
  assert.equal(state.events.some(event => event.type === "talent_trigger" && event.talent === "reed_rescue"), false);
});

test("heron strengthens weaken and delays at most once per battle", () => {
  let state = createBattleState({ seed: 83, team: ["spoonbill", "egret", "heron"], enemy: { maxToughness: 99, toughness: 99 } });
  state.hand = [{ owner: "heron", skill: "tactic", rank: 1 }];
  state = playBattleCard(state, 0);
  assert.deepEqual(state.enemy.debuffs.find(status => status.id === "weakened"), { id: "weakened", duration: 1, magnitude: .28 });
  assert.equal(state.enemy.actionDelay, 0);
  const heron = state.team.find(unit => unit.id === "heron");
  heron.passion = 5;
  state.hand = [{ owner: "heron", skill: "ultimate", rank: 3, ultimate: true }];
  state = playBattleCard(state, 0);
  assert.equal(state.enemy.actionDelay, 1);
  assert.ok(state.events.some(event => event.type === "talent_trigger" && event.talent === "nightfall_delay"));
  state.enemy.actionDelay = 0;
  state.team.find(unit => unit.id === "heron").passion = 5;
  state.hand = [{ owner: "heron", skill: "ultimate", rank: 3, ultimate: true }];
  state = playBattleCard(state, 0);
  assert.equal(state.enemy.actionDelay, 0);
  assert.equal(state.events.some(event => event.type === "talent_trigger" && event.talent === "nightfall_delay"), false);
});

test("progression mechanics affect talent behavior without changing base stats", () => {
  const mechanics = {
    spoonbill: { shieldPower: .3, guardReduction: .12 },
    kingfisher: { breakPower: .4, executePower: .2 },
    egret: { healingPower: .3, cleansePower: 1 },
    heron: { debuffPower: .15, controlPower: .25 }
  };
  const enhanced = createBattleState({ seed: 89, unitStats: mechanics, enemy: { maxHp: 9999, hp: 9999 } });
  assert.deepEqual(
    Object.fromEntries(Object.keys(mechanics.spoonbill).map(key => [key, enhanced.team.find(unit => unit.id === "spoonbill")[key]])),
    mechanics.spoonbill
  );

  let baseGuard = createBattleState({ seed: 89, enemy: { maxHp: 9999, hp: 9999 } });
  let grownGuard = createBattleState({ seed: 89, unitStats: mechanics, enemy: { maxHp: 9999, hp: 9999 } });
  baseGuard.hand = grownGuard.hand = [{ owner: "spoonbill", skill: "tactic", rank: 1 }];
  baseGuard = playBattleCard(baseGuard, 0);
  grownGuard = playBattleCard(grownGuard, 0);
  assert.ok(grownGuard.team.find(unit => unit.id === "egret").shield > baseGuard.team.find(unit => unit.id === "egret").shield);
  for (const state of [baseGuard, grownGuard]) {
    state.team.find(unit => unit.id === "kingfisher").hp = 100;
    state.team.find(unit => unit.id === "spoonbill").shield = 20;
    state.intent = { type: "attack", label: "Dive", power: .5 };
  }
  baseGuard = endPlayerTurn(baseGuard);
  grownGuard = endPlayerTurn(grownGuard);
  assert.ok(grownGuard.events.find(event => event.type === "enemy_damage").guardianReduction < baseGuard.events.find(event => event.type === "enemy_damage").guardianReduction);

  let baseStrike = createBattleState({ seed: 97, enemy: { affinity: "grove", maxHp: 10000, hp: 3000, maxToughness: 10, toughness: 10 } });
  let grownStrike = createBattleState({ seed: 97, unitStats: mechanics, enemy: { affinity: "grove", maxHp: 10000, hp: 3000, maxToughness: 10, toughness: 10 } });
  baseStrike.hand = grownStrike.hand = [{ owner: "kingfisher", skill: "strike", rank: 1 }];
  baseStrike = playBattleCard(baseStrike, 0);
  grownStrike = playBattleCard(grownStrike, 0);
  assert.ok(grownStrike.events.find(event => event.type === "toughness_damage").value > baseStrike.events.find(event => event.type === "toughness_damage").value);
  assert.ok(grownStrike.events.find(event => event.type === "damage").value > baseStrike.events.find(event => event.type === "damage").value);

  let baseHeal = createBattleState({ seed: 101 });
  let grownHeal = createBattleState({ seed: 101, unitStats: mechanics });
  for (const state of [baseHeal, grownHeal]) {
    state.team.forEach(unit => { unit.hp = Math.round(unit.maxHp * .5); });
    state.team.find(unit => unit.id === "kingfisher").debuffs.push({ id: "exposed", duration: 2, magnitude: .1 });
    state.hand = [{ owner: "egret", skill: "tactic", rank: 2 }];
  }
  baseHeal = playBattleCard(baseHeal, 0);
  grownHeal = playBattleCard(grownHeal, 0);
  assert.ok(grownHeal.events.find(event => event.type === "heal").value > baseHeal.events.find(event => event.type === "heal").value);
  assert.equal(baseHeal.team.find(unit => unit.id === "kingfisher").debuffs.length, 1);
  assert.equal(grownHeal.team.find(unit => unit.id === "kingfisher").debuffs.length, 0);
  assert.ok(grownHeal.events.some(event => event.type === "talent_trigger" && event.talent === "clearwater_cleanse"));

  let baseControl = createBattleState({ seed: 103, team: ["kingfisher", "egret", "heron"], enemy: { maxHp: 9999, hp: 9999, maxToughness: 99, toughness: 99 } });
  let grownControl = createBattleState({ seed: 103, team: ["kingfisher", "egret", "heron"], unitStats: mechanics, enemy: { maxHp: 9999, hp: 9999, maxToughness: 99, toughness: 99 } });
  for (const state of [baseControl, grownControl]) {
    state.team.find(unit => unit.id === "heron").passion = 5;
    state.hand = [{ owner: "heron", skill: "ultimate", rank: 3, ultimate: true }];
  }
  baseControl = playBattleCard(baseControl, 0);
  grownControl = playBattleCard(grownControl, 0);
  assert.ok(grownControl.enemy.debuffs.find(status => status.id === "weakened").magnitude > baseControl.enemy.debuffs.find(status => status.id === "weakened").magnitude);
  baseControl = endPlayerTurn(baseControl);
  grownControl = endPlayerTurn(grownControl);
  baseControl = endPlayerTurn(baseControl);
  grownControl = endPlayerTurn(grownControl);
  assert.ok(grownControl.events.find(event => event.type === "enemy_damage").value < baseControl.events.find(event => event.type === "enemy_damage").value);
});
