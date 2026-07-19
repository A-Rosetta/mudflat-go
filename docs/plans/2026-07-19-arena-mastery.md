# Wetland Arena Mastery Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persistent three-objective mastery to every Wetland Arena stage so cleared stages remain worth replaying.

**Architecture:** Keep mastery rules and save normalization in `arena-engine.mjs`. Track only the peak chain needed by the rules, evaluate achievements at victory, and merge newly earned IDs into the existing arena progress object. Render the same goal definitions in the lobby, active battle, and result without adding a new currency or service.

**Tech Stack:** Browser ES modules, localStorage, Node test runner, semantic HTML, existing CSS and Lucide icons.

---

### Task 1: Mastery engine contract

**Files:**
- Modify: `arena-engine.mjs`
- Test: `tests/arena-system.test.mjs`

**Step 1: Write failing tests**

Add tests proving:

```js
assert.equal(battle.maxChain, 3);
assert.deepEqual(evaluateArenaMastery(level, victory).map(goal => goal.complete), [true, true, true]);
assert.deepEqual(normalizeArenaProgress(saved).mastery[1], ["survival", "chain", "tempo"]);
```

Also prove the same mastery ID never rewards twice.

**Step 2: Run RED**

Run: `node --test tests/arena-system.test.mjs --test-reporter=dot`

Expected: FAIL because mastery exports and state are missing.

**Step 3: Implement minimal engine support**

- Export the three stable mastery IDs.
- Add `maxChain` to battle state and update it after damaging actions.
- Export `evaluateArenaMastery(level, battle)`.
- Normalize `birdArena.mastery` without accepting unknown stage IDs or goal IDs.
- Extend `claimArenaVictory(..., earnedMastery)` to persist best results and award `levelId * 10` points for each newly earned goal.

**Step 4: Run GREEN**

Run: `node --test tests/arena-system.test.mjs --test-reporter=dot`

Expected: all arena engine tests pass.

### Task 2: Mastery interface

**Files:**
- Modify: `arena.js`
- Modify: `styles.css`
- Test: `tests/arena-ui.test.mjs`

**Step 1: Write failing UI tests**

Require stable markup for:

```js
assert.match(controller, /arena-level-mastery/);
assert.match(controller, /arena-mastery-live/);
assert.match(controller, /arena-mastery-result/);
```

Require visible objective copy for survival, Tidal Chain III, and the per-stage round limit.

**Step 2: Run RED**

Run: `node --test tests/arena-ui.test.mjs --test-reporter=dot`

Expected: FAIL because mastery UI is absent.

**Step 3: Implement minimal UI**

- Show earned seals on every unlocked stage card.
- Show all three targets during battle.
- Show earned/new states in the victory result.
- Keep daily reward copy separate from one-time mastery reward copy.
- Reuse Lucide `star`, `shield-check`, `waves`, and `timer` icons.

**Step 4: Run GREEN**

Run: `node --test tests/arena-ui.test.mjs --test-reporter=dot`

Expected: all arena UI tests pass.

### Task 3: Responsive verification

**Files:**
- Modify: `styles.css`

**Step 1: Run focused suites**

Run: `node --test tests/arena-system.test.mjs tests/arena-ui.test.mjs --test-reporter=dot`

Expected: all focused tests pass.

**Step 2: Verify in a real browser**

Check desktop `1440x900` and mobile `390x844`:

- stage cards keep stable height;
- mastery labels do not cover rewards or lock icons;
- active goals remain legible;
- result content fits without horizontal overflow;
- no console errors.

### Task 4: Final gate

**Files:**
- Verify all touched files.

**Step 1: Run full verification**

```powershell
node --test --test-reporter=dot
node --check arena-engine.mjs
node --check arena.js
git diff --check
```

**Step 2: Review and commit**

Request review for Critical and Important findings, stage only scoped files, then commit and push the existing feature branch.
