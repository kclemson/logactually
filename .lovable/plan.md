

## Add read-only Net Carbs field to food detail view

### Problem
The Detail Dialog for food items doesn't show "Net Carbs" at all. Since net carbs is derived (carbs − fiber), it should appear as a **read-only computed field** — no editable input, no sync complexity.

### Changes

**`src/components/DetailDialog.tsx`** — `buildFoodDetailFields` function (line 671)

Add a `net_carbs` field with `readOnly: true`. Place it after `carbs`/`sugar` in the interleaved layout. The field config already supports `readOnly` — it renders as plain text and is skipped during save.

```ts
{ key: 'net_carbs', label: 'Net Carbs', type: 'number', unit: 'g', readOnly: true },
```

The value is already present on food items (computed during query parsing in `useFoodEntries`), so it will display automatically. Since it's `readOnly`, editing carbs or fiber won't cause stale display — the saved value recalculates on next query fetch.

**Field order** (interleaved left/right after normalizeToLayout):
- Left: Calories, Protein, Carbs, Fat, Sat. Fat
- Right: Sodium, Fiber, Sugar, Cholesterol, Net Carbs

One line added, one file changed.

