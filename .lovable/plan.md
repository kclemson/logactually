

## Include raw_input in searchText for single-item entries only

### Problem
When the AI strips brand names (e.g. "Chobani" → "Zero Sugar Vanilla Yogurt"), the typeahead can't match the brand. But blindly adding `raw_input` to all individual items would cause cross-matches in multi-item entries (e.g. "bacon eggs coffee" would make typing "coffee" surface the bacon item).

### Solution

**`src/pages/FoodLog.tsx`** (~line 163) — only include `raw_input` when the entry has exactly one food item (so `raw_input` and `item.description` refer to the same food):

```tsx
// Line 163, change:
searchText: item.description,

// To:
searchText: entry.food_items.length === 1
  ? [entry.raw_input, item.description].filter(Boolean).join(' ')
  : item.description,
```

This preserves brand names and colloquial terms for single-item logs (the common case for "chobani yogurt") while avoiding false matches in multi-item entries.

### What about `group_name` / `useRecentFoodEntries`?
No changes needed. Grouped entries (multi-item with `group_name`) already include `raw_input` in their `searchText` (line 143), which is correct because they represent the whole entry as one candidate. And `useRecentFoodEntries` already fetches `raw_input` — the field is available, just not used for individual items currently.

