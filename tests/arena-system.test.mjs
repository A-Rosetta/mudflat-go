import test from "node:test";
import assert from "node:assert/strict";
import {
  ARENA_LEVELS,
  claimArenaVictory,
  createArenaBattle,
  dailyArenaLevel,
  normalizeArenaProgress,
  performArenaAction,
  performArenaEnemyTurn
} from "../arena-engine.mjs";

const team = [
  { id: "spoonbill", name: "黑脸琵鹭", maxHp: 112, attack: 15, skillDamage: 35 },
  { id: "kingfisher", name: "普通翠鸟", maxHp: 82, attack: 18, skillDamage: 39 },
  { id: "egret", name: "白鹭", maxHp: 93, attack: 13, skillDamage: 29 }
];

test("arena preserves ten sequential wetland stages", () => {
  assert.equal(ARENA_LEVELS.length, 10);
  assert.deepEqual(ARENA_LEVELS.map(level => level.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(new Set(ARENA_LEVELS.map(level => level.name)).size, 10);
  assert.ok(ARENA_LEVELS.every(level => level.enemies.length === 3));
  assert.ok(ARENA_LEVELS.at(-1).reward > ARENA_LEVELS[0].reward);
});

test("daily arena modifiers and rewards are deterministic", () => {
  const first = dailyArenaLevel(3, "2026-07-18");
  const repeated = dailyArenaLevel(3, "2026-07-18");
  const nextDay = dailyArenaLevel(3, "2026-07-19");
  assert.deepEqual(first, repeated);
  assert.notEqual(first.dailyVariant, nextDay.dailyVariant);
  assert.ok(first.dailyReward >= first.reward);
});

test("each bird acts once before the enemy response", () => {
  let battle = createArenaBattle(dailyArenaLevel(1, "2026-07-18"), team);
  const enemyId = battle.enemies[0].id;
  for (const unit of team) battle = performArenaAction(battle, { playerId: unit.id, enemyId, action: "attack" });
  assert.equal(battle.status, "enemy");
  assert.deepEqual(battle.acted, team.map(unit => unit.id));
  battle = performArenaEnemyTurn(battle);
  assert.equal(battle.status, "player");
  assert.equal(battle.round, 2);
  assert.deepEqual(battle.acted, []);
  assert.ok(battle.players.some(unit => unit.hp < unit.maxHp));
});

test("normal attacks charge energy and skills require full charge", () => {
  const trainingLevel = {
    ...dailyArenaLevel(1, "2026-07-18"),
    enemies: dailyArenaLevel(1, "2026-07-18").enemies.map(enemy => ({ ...enemy, maxHp: 1000, attack: 1 }))
  };
  let battle = createArenaBattle(trainingLevel, team);
  const enemyId = battle.enemies[0].id;
  const blocked = performArenaAction(battle, { playerId: "spoonbill", enemyId, action: "skill" });
  assert.equal(blocked, battle);
  for (let round = 0; round < 4; round++) {
    battle = performArenaAction(battle, { playerId: "spoonbill", enemyId, action: "attack" });
    for (const id of ["kingfisher", "egret"]) battle = performArenaAction(battle, { playerId: id, enemyId, action: "attack" });
    if (battle.status === "enemy") battle = performArenaEnemyTurn(battle);
  }
  assert.equal(battle.players.find(unit => unit.id === "spoonbill").mp, 100);
  const beforeHp = battle.enemies.find(unit => unit.id === enemyId).hp;
  battle = performArenaAction(battle, { playerId: "spoonbill", enemyId, action: "skill" });
  assert.equal(battle.players.find(unit => unit.id === "spoonbill").mp, 0);
  assert.equal(battle.enemies.find(unit => unit.id === enemyId).hp, Math.max(0, beforeHp - 35));
});

test("victory unlocks the next stage and pays once per day", () => {
  const first = claimArenaVictory({}, 1, "2026-07-18");
  assert.equal(first.progress.unlockedThrough, 2);
  assert.equal(first.progress.clearedThrough, 1);
  assert.ok(first.reward > 0);
  const repeated = claimArenaVictory(first.progress, 1, "2026-07-18");
  assert.equal(repeated.reward, 0);
  const nextDay = claimArenaVictory(repeated.progress, 1, "2026-07-19");
  assert.ok(nextDay.reward > 0);
  const final = claimArenaVictory(nextDay.progress, 10, "2026-07-19");
  assert.equal(final.progress.clearedThrough, 10);
});

test("malformed progress is normalized without unlocking extra stages", () => {
  const progress = normalizeArenaProgress({ unlockedThrough: 99, clearedThrough: -2, claims: { bad: [0, 1, 1, 11, "2"] }, audioEnabled: false });
  assert.equal(progress.unlockedThrough, 10);
  assert.equal(progress.clearedThrough, 0);
  assert.deepEqual(progress.claims.bad, [1, 2]);
  assert.equal(progress.audioEnabled, false);
});
