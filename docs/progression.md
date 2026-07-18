# Bird Spirit Progression

`progression-engine.mjs` is a pure state engine. Every operation returns a new root state and throws before mutation when a gate or resource check fails.

## State contract

```js
{
  points,
  blindBoxFragments,
  blindBoxCollection: { [birdId]: acquisitionCount },
  spiritMaterials: { trainingDew, insightPlume, skillFeather, traceSeed },
  birdSpirits: {
    profiles: {
      [birdId]: { level, exp, ascension, skills, traces, sigils, resonance }
    },
    sigilInventory: { [sigilId]: { id, set, slot, main, subs } }
  }
}
```

No separate progression currency exists. `points` and `blindBoxFragments` remain the blind-box economy; `spiritMaterials` contains only battle drops. Existing `birdSpirits.levels` saves migrate into profiles.

## Gates

- Level cap: 20. Ascend at levels 5, 10, and 15.
- Skill cap: 6 for `basic`, `spell`, and `ultimate`.
- Trace branches: attack, survival, and mechanism. Nodes enforce level, ascension, and parent requirements.
- Sigils: three typed slots. `reed`, `tide`, and `flight` activate at two and three pieces. Main and up to four substats contribute to final stats.
- Resonance: the first blind-box copy unlocks a spirit; copies two through seven produce resonance 1 through 6.

Call `normalizeProgression(root, birdIds)` after reading storage. Persist the returned root after any successful operation. Blind-box draws must increment `blindBoxCollection[id]`, rather than storing it as a boolean, for resonance to advance.
