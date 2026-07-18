# Battle depth contract

`createBattleState()` keeps the existing `team`, `levels`, `boss`, `enemy`, and `seed` options. Progression can pass final combat stats without double-applying level growth:

```js
createBattleState({
  team: ["spoonbill", "kingfisher", "egret"],
  unitStats: {
    kingfisher: {
      hp: 1400,
      attack: 260,
      defense: 110,
      speed: 116,
      skillPower: .2,
      ultimatePower: .35,
      breakPower: .18,
      executePower: .15,
      skills: { basic: 6, spell: 4, ultimate: 5 }
    }
  }
});
```

`hp`, `attack`, and `defense` are final values. Skill and mechanic bonuses are additive fractions. Skill ranks are clamped to 1-6 and add 5% power per rank after rank 1. Missing `unitStats` fields fall back to the level-based roster values.

## State fields

- `team[].speed`, `team[].buffs`, `team[].debuffs`, `team[].skills`
- `enemy.phase`, `enemy.toughness`, `enemy.maxToughness`, `enemy.broken`, `enemy.actionDelay`
- `actionOrder`: speed-sorted allies in the free three-AP player phase, followed by the previewed enemy phase and its `delayed` flag
- `link`: alternating-owner chain, capped at two stacks and reset each round
- `events`: only the latest card or enemy-turn event batch
- `log`: backward-compatible compact player action history

An affinity-advantaged damage card removes toughness equal to card rank (three for an ultimate). Break delays the previewed enemy intent once. The following player round receives a 20% damage window before toughness resets and the delayed intent resolves.

Each spirit also has a bounded role mechanic: spoonbill barrier interception, kingfisher break pursuit, egret critical rescue and cleansing, or heron debuff control. Exclusive progression traces scale those mechanics without granting off-role healing, defense, and damage at the same time.

## Event batches

`playBattleCard()` emits `card_play`, `link_gain`, `damage`, `heal`, `shield`, `toughness_damage`, `break`, `status_applied`, `ultimate_ready`, `ultimate`, `phase_change`, and `battle_end` as applicable.

`endPlayerTurn()` emits `intent_resolved`, `enemy_damage`, `enemy_shield`, `enemy_heal`, `enemy_delayed`, `toughness_reset`, `status_applied`, `status_expired`, `turn_start`, and `battle_end` as applicable. Invalid calls return an `action_rejected` event and do not mutate the caller's state.
