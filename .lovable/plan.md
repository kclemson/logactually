

## Always derive net_carbs from carbs − fiber

### Evidence
- 329 of 2,354 items with stored `net_carbs` have values wildly inconsistent with `carbs - fiber` (e.g., Orange Soda: stored 44g net carbs but only 1g carbs)
- 54% of items have no fiber data — in those cases `net_carbs = carbs`, which is the correct nutritional convention
- Stored values come from external sources (Open Food Facts, AI) and are unreliable

### Change

**`src/hooks/useFoodEntries.ts`** — line 38: change from conditional to always-compute:
```ts
// Before
net_carbs: item.net_carbs != null ? Number(item.net_carbs) : Math.max(0, carbs - fiber),
// After
net_carbs: Math.max(0, carbs - fiber),
```

**`src/hooks/useRecentFoodEntries.ts`** — line 42: same change (duplicate parsing logic):
```ts
net_carbs: Math.max(0, carbs - fiber),
```

Two lines changed, two files. No UI or schema changes needed.

