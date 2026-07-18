import test from "node:test";
import assert from "node:assert/strict";
import { simulateBattles } from "../battle-engine.mjs";

test("fixed-seed normal battle balance stays in target bands", () => {
  const result = simulateBattles({ count: 1200, seed: 20260717, mode: "default" });
  assert.equal(result.resolvedBattles, 1200);
  assert.ok(result.actions.playerCards > 1200, JSON.stringify(result));
  assert.ok(result.actions.enemyTurns > 1200, JSON.stringify(result));
  assert.ok(result.actions.breaks > 0, JSON.stringify(result));
  assert.ok(result.actions.enemyDelays > 0 && result.actions.enemyDelays <= result.actions.breaks, JSON.stringify(result));
  assert.ok(result.winRate >= .55 && result.winRate <= .65, JSON.stringify(result));
  assert.ok(result.turns.p50 >= 4 && result.turns.p50 <= 7, JSON.stringify(result));
});

test("informed upgraded strategy is strong without becoming certain", () => {
  const result = simulateBattles({ count: 1200, seed: 20260717, mode: "strategy" });
  assert.ok(result.winRate >= .8 && result.winRate <= .9, JSON.stringify(result));
  assert.ok(result.winRate < 1);
});

test("boss battles resolve in the intended turn window", () => {
  const result = simulateBattles({ count: 1000, seed: 1999, mode: "strategy", boss: true });
  assert.ok(result.winRate >= .45 && result.winRate <= .75, JSON.stringify(result));
  assert.ok(result.turns.p50 >= 7 && result.turns.p50 <= 10, JSON.stringify(result));
});
