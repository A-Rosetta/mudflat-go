import test from "node:test";
import assert from "node:assert/strict";
import {
  ARENA_LEVELS,
  claimArenaVictory,
  createArenaBattle,
  dailyArenaLevel,
  evaluateArenaMastery,
  normalizeArenaProgress,
  performArenaAction,
  performArenaEnemyTurn,
  previewArenaAction,
  previewArenaEnemyTurn
} from "../arena-engine.mjs";

const team = [
  { id: "spoonbill", name: "黑脸琵鹭", maxHp: 112, attack: 15, skillDamage: 35 },
  { id: "kingfisher", name: "普通翠鸟", maxHp: 82, attack: 18, skillDamage: 39 },
  { id: "egret", name: "白鹭", maxHp: 93, attack: 13, skillDamage: 29 }
];

const levelForVariant = (name, levelId = 1) => {
  for (let day = 1; day <= 31; day++) {
    const level = dailyArenaLevel(levelId, `2026-07-${String(day).padStart(2, "0")}`);
    if (level.dailyVariant === name) return level;
  }
  throw new Error(`Missing arena variant: ${name}`);
};

const chargeSkill = (battle, playerId) => ({
  ...battle,
  players: battle.players.map(unit => unit.id === playerId ? { ...unit, mp: 100 } : unit)
});

function simulateArena(level, lineup) {
  let battle = createArenaBattle(level, lineup);
  while (battle.status === "player" && battle.round <= 20) {
    for (const slot of battle.players.filter(unit => unit.hp > 0 && !battle.acted.includes(unit.id))) {
      const intent = previewArenaEnemyTurn(battle);
      const enemy = battle.enemies.find(unit => unit.id === intent?.attackerId && unit.hp > 0)
        || battle.enemies.filter(unit => unit.hp > 0).sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
      if (!enemy) break;
      const player = battle.players.find(unit => unit.id === slot.id);
      const needsRecovery = battle.players.some(unit => unit.hp > 0 && (unit.hp / unit.maxHp < .78 || unit.debuff));
      const skillReady = player.mp >= 100 && (player.id !== "egret" || needsRecovery) && (player.id !== "heron" || intent.action === "skill");
      const action = skillReady ? "skill" : "attack";
      battle = performArenaAction(battle, { playerId: player.id, enemyId: enemy.id, action });
      if (battle.status !== "player") break;
    }
    if (battle.status === "enemy") battle = performArenaEnemyTurn(battle);
  }
  return battle;
}

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

test("every daily variant changes a battle rule", () => {
  const migration = createArenaBattle(levelForVariant("候鸟活跃"), team);
  assert.ok(migration.players.every(unit => unit.mp === 50));

  const breeze = createArenaBattle(levelForVariant("微风潮沟"), team);
  const breezeAction = performArenaAction(breeze, { playerId: "spoonbill", enemyId: breeze.enemies[0].id, action: "attack" });
  assert.equal(breezeAction.players.find(unit => unit.id === "spoonbill").mp, 35);

  let lowTide = createArenaBattle(levelForVariant("退潮窗口"), team);
  lowTide = performArenaAction(lowTide, { playerId: "spoonbill", enemyId: lowTide.enemies[0].id, action: "attack" });
  assert.equal(lowTide.lastEvent.damage, 19);
  lowTide = performArenaAction(lowTide, { playerId: "kingfisher", enemyId: lowTide.enemies[1].id, action: "attack" });
  assert.equal(lowTide.lastEvent.damage, 18);

  let healedBeforeStrike = chargeSkill(createArenaBattle(levelForVariant("退潮窗口"), team), "egret");
  healedBeforeStrike = performArenaAction(healedBeforeStrike, { playerId: "egret", enemyId: healedBeforeStrike.enemies[0].id, action: "skill" });
  healedBeforeStrike = performArenaAction(healedBeforeStrike, { playerId: "spoonbill", enemyId: healedBeforeStrike.enemies[0].id, action: "attack" });
  assert.equal(healedBeforeStrike.lastEvent.damage, 19);

  const lunar = { ...createArenaBattle(levelForVariant("月相偏移"), team), round: 2 };
  assert.equal(previewArenaEnemyTurn(lunar).action, "skill");

  const salinityLevel = levelForVariant("盐度波动");
  const salinity = createArenaBattle(salinityLevel, team);
  assert.equal(salinity.enemies[0].maxHp, Math.round(salinityLevel.enemies[0].maxHp * 1.05));
});

test("stage modifiers alter the values promised by their copy", () => {
  const stage2 = createArenaBattle(ARENA_LEVELS[1], team);
  const armored = performArenaAction(stage2, { playerId: "spoonbill", enemyId: stage2.enemies[0].id, action: "attack" });
  assert.equal(armored.lastEvent.damage, 9);
  const chained = performArenaAction(armored, { playerId: "kingfisher", enemyId: stage2.enemies[0].id, action: "attack" });
  assert.equal(chained.lastEvent.damage, 20);
  assert.equal(chained.lastEvent.chainMultiplier, 1.12);

  let stage3 = chargeSkill(createArenaBattle(ARENA_LEVELS[2], team), "spoonbill");
  stage3 = performArenaAction(stage3, { playerId: "spoonbill", enemyId: stage3.enemies[0].id, action: "skill" });
  assert.equal(stage3.lastEvent.damage, 42);

  assert.equal(createArenaBattle(ARENA_LEVELS[3], team).enemies[0].attack, ARENA_LEVELS[3].enemies[0].attack + 2);
  assert.equal(createArenaBattle(ARENA_LEVELS[4], team).enemies[0].maxHp, Math.round(ARENA_LEVELS[4].enemies[0].maxHp * 1.1));

  const stage6 = { ...createArenaBattle(ARENA_LEVELS[5], team), round: 3 };
  assert.equal(previewArenaEnemyTurn(stage6).damage, ARENA_LEVELS[5].enemies[2].skillDamage + 5);

  let stage7 = createArenaBattle(ARENA_LEVELS[6], team);
  stage7 = performArenaAction(stage7, { playerId: "spoonbill", enemyId: stage7.enemies[0].id, action: "attack" });
  assert.equal(previewArenaEnemyTurn(stage7).damage, Math.round(ARENA_LEVELS[6].enemies[0].attack * 1.2));

  assert.equal(createArenaBattle(ARENA_LEVELS[7], team).enemies[0].attack, ARENA_LEVELS[7].enemies[0].attack + 4);
  assert.equal(createArenaBattle(ARENA_LEVELS[8], team).enemies[0].maxHp, Math.round(ARENA_LEVELS[8].enemies[0].maxHp * 1.15));
  const stage10 = createArenaBattle(ARENA_LEVELS[9], team).enemies[0];
  assert.equal(stage10.maxHp, Math.round(ARENA_LEVELS[9].enemies[0].maxHp * 1.1));
  assert.equal(stage10.attack, Math.round(ARENA_LEVELS[9].enemies[0].attack * 1.1));
  assert.equal(stage10.skillDamage, Math.round(ARENA_LEVELS[9].enemies[0].skillDamage * 1.1));
});

test("player action preview matches armor, execute, and support resolution", () => {
  const armored = createArenaBattle(ARENA_LEVELS[1], team);
  const armoredInput = { playerId: "spoonbill", enemyId: armored.enemies[0].id, action: "attack" };
  const armorPreview = previewArenaAction(armored, armoredInput);
  assert.equal(armorPreview.damage, 9);
  assert.equal(performArenaAction(armored, armoredInput).lastEvent.damage, armorPreview.damage);

  let execute = chargeSkill(createArenaBattle(ARENA_LEVELS[0], team), "kingfisher");
  execute.enemies = execute.enemies.map((unit, index) => index === 0 ? { ...unit, hp: 30, maxHp: 100 } : unit);
  const executePreview = previewArenaAction(execute, { playerId: "kingfisher", enemyId: execute.enemies[0].id, action: "skill" });
  assert.equal(executePreview.execute, true);
  assert.ok(executePreview.damage > team[1].skillDamage);

  const support = chargeSkill(createArenaBattle(ARENA_LEVELS[0], team), "egret");
  const supportPreview = previewArenaAction(support, { playerId: "egret", enemyId: support.enemies[0].id, action: "skill" });
  assert.deepEqual({ damage: supportPreview.damage, healing: supportPreview.healing }, { damage: 0, healing: 0 });
});

test("player action preview rejects unavailable actions", () => {
  const battle = createArenaBattle(ARENA_LEVELS[0], team);
  const input = { playerId: "spoonbill", enemyId: battle.enemies[0].id };
  assert.equal(previewArenaAction(battle, { ...input, action: "skill" }), null);
  assert.equal(previewArenaAction(battle, { ...input, action: "invalid" }), null);
  assert.equal(previewArenaAction({ ...battle, status: "enemy" }, { ...input, action: "attack" }), null);
  assert.equal(previewArenaAction({ ...battle, acted: ["spoonbill"] }, { ...input, action: "attack" }), null);
});

test("same-target attacks build an exact three-step tidal chain", () => {
  let battle = createArenaBattle(ARENA_LEVELS[0], team);
  const enemyId = battle.enemies[0].id;

  let preview = previewArenaAction(battle, { playerId: "spoonbill", enemyId, action: "attack" });
  assert.deepEqual({ damage: preview.damage, chainCount: preview.chainCount, chainMultiplier: preview.chainMultiplier }, { damage: 15, chainCount: 1, chainMultiplier: 1 });
  battle = performArenaAction(battle, { playerId: "spoonbill", enemyId, action: "attack" });

  preview = previewArenaAction(battle, { playerId: "kingfisher", enemyId, action: "attack" });
  assert.deepEqual({ damage: preview.damage, chainCount: preview.chainCount, chainMultiplier: preview.chainMultiplier }, { damage: 20, chainCount: 2, chainMultiplier: 1.12 });
  battle = performArenaAction(battle, { playerId: "kingfisher", enemyId, action: "attack" });

  preview = previewArenaAction(battle, { playerId: "egret", enemyId, action: "attack" });
  assert.deepEqual({ damage: preview.damage, chainCount: preview.chainCount, chainMultiplier: preview.chainMultiplier }, { damage: 16, chainCount: 3, chainMultiplier: 1.24 });
  battle = performArenaAction(battle, { playerId: "egret", enemyId, action: "attack" });
  assert.equal(battle.lastEvent.damage, preview.damage);
  assert.equal(battle.chainTargetId, enemyId);
  assert.equal(battle.chainCount, 3);
  assert.equal(battle.maxChain, 3);

  battle = performArenaEnemyTurn(battle);
  assert.equal(battle.chainTargetId, null);
  assert.equal(battle.chainCount, 0);
  assert.equal(battle.maxChain, 3);
});

test("arena mastery evaluates survival, tidal chain, and clear tempo", () => {
  const level = dailyArenaLevel(3, "2026-07-19");
  assert.deepEqual(evaluateArenaMastery(level).map(goal => goal.complete), [false, false, false]);
  const active = createArenaBattle(level, team);
  assert.deepEqual(evaluateArenaMastery(level, active).map(goal => goal.complete), [true, false, true]);
  const victory = {
    ...createArenaBattle(level, team),
    status: "victory",
    round: level.id + 6,
    maxChain: 3
  };
  assert.deepEqual(evaluateArenaMastery(level, victory).map(goal => [goal.id, goal.complete]), [
    ["survival", true],
    ["chain", true],
    ["tempo", true]
  ]);

  const missed = {
    ...victory,
    round: level.id + 7,
    maxChain: 2,
    players: victory.players.map((unit, index) => index ? unit : { ...unit, hp: 0, defeated: true })
  };
  assert.deepEqual(evaluateArenaMastery(level, missed).map(goal => goal.complete), [false, false, false]);
});

test("support actions preserve a tidal chain while switching targets resets it", () => {
  let battle = createArenaBattle(ARENA_LEVELS[0], team);
  const [firstEnemy, secondEnemy] = battle.enemies;
  battle = performArenaAction(battle, { playerId: "spoonbill", enemyId: firstEnemy.id, action: "attack" });
  battle = chargeSkill(battle, "egret");
  battle = performArenaAction(battle, { playerId: "egret", enemyId: secondEnemy.id, action: "skill" });
  assert.equal(battle.chainTargetId, firstEnemy.id);
  assert.equal(battle.chainCount, 1);

  const preview = previewArenaAction(battle, { playerId: "kingfisher", enemyId: secondEnemy.id, action: "attack" });
  assert.deepEqual({ damage: preview.damage, chainCount: preview.chainCount, chainMultiplier: preview.chainMultiplier }, { damage: 18, chainCount: 1, chainMultiplier: 1 });
  battle = performArenaAction(battle, { playerId: "kingfisher", enemyId: secondEnemy.id, action: "attack" });
  assert.equal(battle.chainTargetId, secondEnemy.id);
  assert.equal(battle.chainCount, 1);
});

test("egret preview and event report applied healing by target", () => {
  let battle = chargeSkill(createArenaBattle(ARENA_LEVELS[0], team), "egret");
  battle.players = battle.players.map(unit => ({ ...unit, hp: unit.maxHp - 1, debuff: "exposed" }));
  const input = { playerId: "egret", enemyId: battle.enemies[0].id, action: "skill" };
  const preview = previewArenaAction(battle, input);
  const expected = { spoonbill: 1, kingfisher: 1, egret: 1 };
  assert.equal(preview.healing, 3);
  assert.deepEqual(preview.healingByTarget, expected);

  const resolved = performArenaAction(battle, input);
  assert.equal(resolved.lastEvent.healing, 3);
  assert.deepEqual(resolved.lastEvent.healingByTarget, expected);
  assert.deepEqual(Object.fromEntries(resolved.players.map((unit, index) => [unit.id, unit.hp - battle.players[index].hp])), expected);
});

test("spoonbill preview and event report applied barrier by target", () => {
  let battle = chargeSkill(createArenaBattle(ARENA_LEVELS[0], team), "spoonbill");
  battle.players = battle.players.map((unit, index) => ({ ...unit, shield: Math.round(unit.maxHp * .45) - Number(index === 0) }));
  const input = { playerId: "spoonbill", enemyId: battle.enemies[0].id, action: "skill" };
  const preview = previewArenaAction(battle, input);
  const expected = { spoonbill: 1, kingfisher: 0, egret: 0 };
  assert.equal(preview.barrier, 1);
  assert.deepEqual(preview.barrierByTarget, expected);

  const resolved = performArenaAction(battle, input);
  assert.equal(resolved.lastEvent.barrier, 1);
  assert.deepEqual(resolved.lastEvent.barrierByTarget, expected);
  assert.deepEqual(Object.fromEntries(resolved.players.map((unit, index) => [unit.id, unit.shield - battle.players[index].shield])), expected);
});

test("spoonbill skill raises a barrier and intercepts the forecasted hit", () => {
  let battle = chargeSkill(createArenaBattle(ARENA_LEVELS[0], team), "spoonbill");
  battle.players = battle.players.map(unit => unit.id === "egret" ? { ...unit, hp: 10 } : unit);
  battle = performArenaAction(battle, { playerId: "spoonbill", enemyId: battle.enemies[0].id, action: "skill" });
  assert.ok(battle.players.every(unit => unit.shield > 0));
  for (const id of ["kingfisher", "egret"]) battle = performArenaAction(battle, { playerId: id, enemyId: battle.enemies[0].id, action: "attack" });
  const intent = previewArenaEnemyTurn(battle);
  assert.equal(intent.targetId, "spoonbill");
  assert.equal(intent.protectedTargetId, "egret");
  const resolved = performArenaEnemyTurn(battle);
  assert.ok(resolved.lastEvent.absorbed > 0);
});

test("kingfisher skill breaks toughness and executes weak targets", () => {
  let battle = chargeSkill(createArenaBattle(ARENA_LEVELS[0], team), "kingfisher");
  battle.enemies = battle.enemies.map((unit, index) => index === 0 ? { ...unit, hp: 30, maxHp: 100, toughness: 2, maxToughness: 2 } : unit);
  battle = performArenaAction(battle, { playerId: "kingfisher", enemyId: battle.enemies[0].id, action: "skill" });
  assert.equal(battle.enemies[0].toughness, 0);
  assert.equal(battle.enemies[0].broken, true);
  assert.ok(battle.lastEvent.damage > team[1].skillDamage);
});

test("egret skill heals the flock and cleanses exposure", () => {
  let battle = chargeSkill(createArenaBattle(ARENA_LEVELS[0], team), "egret");
  battle.players = battle.players.map(unit => ({ ...unit, hp: Math.round(unit.maxHp / 2), debuff: "侵蚀" }));
  const enemyHp = battle.enemies[0].hp;
  battle = performArenaAction(battle, { playerId: "egret", enemyId: battle.enemies[0].id, action: "skill" });
  assert.ok(battle.players.every(unit => unit.hp > unit.maxHp / 2));
  assert.ok(battle.players.every(unit => !unit.debuff));
  assert.equal(battle.enemies[0].hp, enemyHp);
  assert.equal(battle.lastEvent.healing, team.length * team[2].skillDamage);
});

test("TuanTuan collaboration skill heals the team and creates an aura shield", () => {
  const collabTeam = [team[0], team[1], { id: "tuantuan", name: "团团", maxHp: 98, attack: 13, skillDamage: 32 }];
  let battle = createArenaBattle(ARENA_LEVELS[0], collabTeam);
  battle.players = battle.players.map(unit => ({ ...unit, hp: Math.max(1, unit.hp - 20) }));
  battle = chargeSkill(battle, "tuantuan");
  const preview = previewArenaAction(battle, { playerId: "tuantuan", enemyId: battle.enemies[0].id, action: "skill" });
  assert.equal(preview.damage, 0);
  assert.ok(preview.healing > 0);
  assert.ok(preview.barrier > 0);
  battle = performArenaAction(battle, { playerId: "tuantuan", enemyId: battle.enemies[0].id, action: "skill" });
  assert.equal(battle.lastEvent.healing, preview.healing);
  assert.equal(battle.lastEvent.barrier, preview.barrier);
});

test("heron skill delays exactly one forecasted enemy intent", () => {
  const controlTeam = [{ id: "heron", name: "夜鹭", maxHp: 88, attack: 14, skillDamage: 32 }, team[1], team[2]];
  let battle = chargeSkill(createArenaBattle(ARENA_LEVELS[0], controlTeam), "heron");
  battle = performArenaAction(battle, { playerId: "heron", enemyId: battle.enemies[0].id, action: "skill" });
  for (const id of ["kingfisher", "egret"]) battle = performArenaAction(battle, { playerId: id, enemyId: battle.enemies[0].id, action: "attack" });
  assert.deepEqual(previewArenaEnemyTurn(battle).action, "delayed");
  const hpBefore = battle.players.map(unit => unit.hp);
  battle = performArenaEnemyTurn(battle);
  assert.deepEqual(battle.players.map(unit => unit.hp), hpBefore);
  assert.equal(battle.enemyDelay, 0);
  assert.notEqual(previewArenaEnemyTurn(battle).action, "delayed");
});

test("max-level formations can clear every late-stage daily variant", () => {
  const maxBirds = {
    spoonbill: { id: "spoonbill", name: "黑脸琵鹭", maxHp: 232, attack: 24, skillDamage: 54 },
    kingfisher: { id: "kingfisher", name: "普通翠鸟", maxHp: 170, attack: 33, skillDamage: 74 },
    egret: { id: "egret", name: "白鹭", maxHp: 193, attack: 26, skillDamage: 59 },
    heron: { id: "heron", name: "夜鹭", maxHp: 182, attack: 30, skillDamage: 68 }
  };
  const formations = [
    [maxBirds.spoonbill, maxBirds.kingfisher, maxBirds.egret],
    [maxBirds.spoonbill, maxBirds.heron, maxBirds.egret]
  ];
  const variantNames = ["退潮窗口", "微风潮沟", "候鸟活跃", "月相偏移", "盐度波动"];
  for (const levelId of [8, 9, 10]) {
    for (const variant of variantNames) {
      const results = formations.map(team => simulateArena(levelForVariant(variant, levelId), team));
      const victory = results.find(result => result.status === "victory");
      assert.ok(victory, `stage ${levelId} should be clearable under ${variant}`);
      assert.ok(victory.round <= 20);
    }
  }
});

test("level-10 formations are defeated by at least one stage 10 daily variant", () => {
  const levelTenBirds = {
    spoonbill: { id: "spoonbill", name: "Spoonbill", maxHp: 167, attack: 18, skillDamage: 41 },
    kingfisher: { id: "kingfisher", name: "Kingfisher", maxHp: 122, attack: 24, skillDamage: 54 },
    egret: { id: "egret", name: "Egret", maxHp: 139, attack: 19, skillDamage: 43 },
    heron: { id: "heron", name: "Heron", maxHp: 131, attack: 22, skillDamage: 50 }
  };
  const formations = [
    [levelTenBirds.spoonbill, levelTenBirds.kingfisher, levelTenBirds.egret],
    [levelTenBirds.spoonbill, levelTenBirds.heron, levelTenBirds.egret]
  ];
  const variantNames = ["退潮窗口", "微风潮沟", "候鸟活跃", "月相偏移", "盐度波动"];
  const hasUnclearableVariant = variantNames.some(variant => formations.every(lineup => simulateArena(levelForVariant(variant, 10), lineup).status === "defeat"));
  assert.equal(hasUnclearableVariant, true);
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

test("enemy intent previews the exact counter and shifts when its attacker falls", () => {
  const burstTeam = team.map((unit, index) => ({ ...unit, attack: index === 0 ? 999 : unit.attack }));
  let battle = createArenaBattle(dailyArenaLevel(1, "2026-07-18"), burstTeam);
  const firstIntent = previewArenaEnemyTurn(battle);
  battle = performArenaAction(battle, { playerId: burstTeam[0].id, enemyId: firstIntent.attackerId, action: "attack" });
  const shiftedIntent = previewArenaEnemyTurn(battle);
  assert.notEqual(shiftedIntent.attackerId, firstIntent.attackerId);
  for (const unit of burstTeam.slice(1)) battle = performArenaAction(battle, { playerId: unit.id, enemyId: shiftedIntent.attackerId, action: "attack" });
  const committedIntent = previewArenaEnemyTurn(battle);
  const resolved = performArenaEnemyTurn(battle);
  assert.deepEqual(resolved.lastEvent, { side: "enemy", ...committedIntent });
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

test("victory persists best mastery and rewards only newly earned seals", () => {
  const first = claimArenaVictory({}, 2, "2026-07-18", ["survival", "chain", "invalid"]);
  assert.deepEqual(first.progress.mastery[2], ["survival", "chain"]);
  assert.equal(first.masteryReward, 40);
  assert.equal(first.newMastery.length, 2);

  const repeated = claimArenaVictory(first.progress, 2, "2026-07-18", ["survival", "chain"]);
  assert.equal(repeated.reward, 0);
  assert.equal(repeated.masteryReward, 0);
  assert.deepEqual(repeated.newMastery, []);

  const improved = claimArenaVictory(repeated.progress, 2, "2026-07-18", ["survival", "tempo"]);
  assert.deepEqual(improved.progress.mastery[2], ["survival", "chain", "tempo"]);
  assert.equal(improved.reward, 20);
  assert.equal(improved.masteryReward, 20);
  assert.deepEqual(improved.newMastery, ["tempo"]);
});

test("malformed progress is normalized without unlocking extra stages", () => {
  const progress = normalizeArenaProgress({ unlockedThrough: 99, clearedThrough: -2, claims: { bad: [0, 1, 1, 11, "2"] }, mastery: { 0: ["chain"], 1: ["chain", "chain", "invalid"], 11: ["tempo"] }, audioEnabled: false });
  assert.equal(progress.unlockedThrough, 10);
  assert.equal(progress.clearedThrough, 0);
  assert.deepEqual(progress.claims.bad, [1, 2]);
  assert.deepEqual(progress.mastery, { 1: ["chain"] });
  assert.equal(progress.audioEnabled, false);
});
