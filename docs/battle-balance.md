# Battle and Progression Balance

## Spirit identity

Progression exposes character mechanics through `getSpiritTalent(id)`, `getSpiritTraceNodes(id)`, and `getProgressionStats(...).bonuses`. The battle layer consumes these values; the progression layer remains deterministic and side-effect free.

| Spirit | Focus | Innate talent | Exclusive trace payoff |
| --- | --- | --- | --- |
| Spoonbill | Guard | Stronger barriers and 4% guarded mitigation | Additional shield power, health, and guarded mitigation |
| Kingfisher | Break | More toughness pressure and execute damage | Break acceleration and low-health damage, without defensive gains |
| Egret | Recovery | Stronger healing and basic cleanse reliability | Sustained healing and dependable high-rank cleansing |
| Heron | Control | Stronger debuffs and action control | Intent-reactive debuffs and longer tactical windows |

Each tree retains the eight shared attack, survival, and mechanism foundations, then adds two owner-only nodes. Exclusive nodes cannot be loaded or unlocked by another spirit. Existing saves containing only shared trace IDs remain valid.

## Combat integration

- `shieldPower`: multiply barriers created by the unit.
- `guardReduction`: reduce direct health damage only while a barrier is active.
- `breakPower`: multiply toughness damage, not normal health damage.
- `executePower`: multiply damage against broken or low-health enemies.
- `healingPower`: multiply healing output.
- `cleansePower`: improve deterministic cleanse thresholds; cap final battle probability at 100%.
- `debuffPower`: multiply debuff magnitude, subject to battle caps.
- `controlPower`: increase action delay or control duration, subject to boss resistance.

This split prevents one spirit from becoming the best damage dealer, healer, and defender at once. Battle caps remain responsible for preventing permanent shields, guaranteed control loops, or unlimited recovery.
