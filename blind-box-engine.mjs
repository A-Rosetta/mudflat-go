const rarities = ["CHASE", "SSR", "SR", "R", "N"];

const pickByWeight = (items, getWeight, random) => {
  let roll = random() * items.reduce((sum, item) => sum + getWeight(item), 0);
  for (const item of items) {
    roll -= getWeight(item);
    if (roll < 0) return item;
  }
  return items[items.length - 1];
};

export function pickBlindBoxItem({ pool, pity, guaranteedUp, random = Math.random }) {
  const rareItems = pool.items.filter(item => ["SSR", "CHASE"].includes(item.rarity));
  const featuredRareItems = rareItems.filter(item => pool.upIds.includes(item.id));
  if (guaranteedUp && featuredRareItems.length && pity >= 9) return pickByWeight(featuredRareItems, item => item.weight, random);
  if (pity >= 9) return pickByWeight(rareItems, item => item.weight, random);
  const rarityBuckets = rarities.map(rarity => ({
    rarity,
    weight: pool.items.filter(item => item.rarity === rarity).reduce((sum, item) => sum + item.weight, 0)
  }));
  const rarity = pickByWeight(rarityBuckets, item => item.weight, random).rarity;
  if (guaranteedUp && ["SSR", "CHASE"].includes(rarity) && featuredRareItems.length) return pickByWeight(featuredRareItems, item => item.weight, random);
  const candidates = pool.items.filter(item => item.rarity === rarity);
  return pickByWeight(candidates, item => item.weight * (pool.upIds.includes(item.id) ? 3 : 1), random);
}
