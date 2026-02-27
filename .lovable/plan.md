

## Plan: Use only the item's own description for searchText in exploded items

### Problem

Line 161 in `src/pages/FoodLog.tsx` sets `searchText` to `[entry.raw_input || '', item.description].join(' ')`. This means every exploded item inherits the parent entry's `raw_input`, so typing "coffee" matches "Bacon" because the original input was something like "coffee and bacon".

### Change

In `src/pages/FoodLog.tsx` line 161, change:

```typescript
searchText: [entry.raw_input || '', item.description].join(' '),
```

to:

```typescript
searchText: item.description,
```

For exploded individual items, the search should only match against that item's own description — not the original multi-item input string. Named groups (line 143) keep the full searchText since they represent intentional groupings.

One line changed.

