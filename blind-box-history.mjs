export const BLIND_BOX_HISTORY_LIMIT = 50;

export function normalizeBlindBoxHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(entry => entry && typeof entry === "object" && typeof entry.poolId === "string" && typeof entry.itemId === "string")
    .slice(0, BLIND_BOX_HISTORY_LIMIT);
}

export function resolveBlindBoxPull(state, { pool, item, stateKey, pulledAt = Date.now() }) {
  const history = normalizeBlindBoxHistory(state.blindBoxHistory);
  const pityBefore = Number(state.blindBoxPity[stateKey]) || 0;
  const guaranteeBefore = Boolean(state.blindBoxGuarantee[stateKey]);
  const duplicate = Boolean(state.blindBoxCollection[item.id]);
  const rare = ["SSR", "CHASE"].includes(item.rarity);
  const featured = pool.upIds.includes(item.id);

  state.blindBoxCollection[item.id] = (Number(state.blindBoxCollection[item.id]) || 0) + 1;
  if (duplicate) state.blindBoxFragments += item.fragments;
  state.blindBoxPity[stateKey] = rare ? 0 : pityBefore + 1;
  if (pool.carryOver && rare) state.blindBoxGuarantee[stateKey] = !featured;
  else if (!pool.carryOver && rare) state.blindBoxGuarantee[stateKey] = false;

  const audit = {
    sequence: history.reduce((max, entry) => Math.max(max, Number(entry.sequence) || 0), 0) + 1,
    pulledAt,
    poolId: pool.id,
    poolTitle: pool.title,
    itemId: item.id,
    itemName: item.name,
    rarity: item.rarity,
    duplicate,
    duplicateFragments: duplicate ? item.fragments : 0,
    featured,
    carryOver: Boolean(pool.carryOver),
    pityBefore,
    pityAfter: state.blindBoxPity[stateKey],
    forcedByPity: pityBefore >= 9,
    guaranteeBefore,
    guaranteeUsed: guaranteeBefore && rare && featured,
    guaranteeAfter: Boolean(state.blindBoxGuarantee[stateKey])
  };
  state.blindBoxHistory = [audit, ...history].slice(0, BLIND_BOX_HISTORY_LIMIT);
  return { item, duplicate, duplicateFragments: item.fragments, audit };
}
