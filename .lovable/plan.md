

# Add "Copy to today" action to food and exercise entries

## Overview
When browsing a past day's log, each entry's expanded panel (chevron expando) will show a "Copy to today" link that duplicates the entry onto today's date with one tap. Hidden when already viewing today or in read-only/demo mode.

## UI placement

Inside `EntryExpandedPanel`, the right-side actions area gets a flex container with `gap-4` and both buttons get `py-1` for mobile-friendly hit targets:

```text
Logged as: leftover chicken rice
[Save as meal]                        [Copy to today]  [Details]
```

## Changes

### 1. `src/components/EntryExpandedPanel.tsx`
- Add optional `onCopyToToday?: () => void` prop.
- Wrap "Copy to today" and "Details" in a `flex items-center gap-4` container on the right side.
- Add `py-1` to both buttons for ~44px tap targets.
- Render "Copy to today" only when the prop is provided.

### 2. `src/components/FoodItemsTable.tsx`
- Add optional `onCopyEntryToToday?: (entryId: string) => void` prop.
- Pass it to `EntryExpandedPanel` as `onCopyToToday`, binding the current entry ID.

### 3. `src/pages/FoodLog.tsx`
- Create inline `handleCopyEntryToToday` callback:
  - Finds the entry by ID from current `entries`.
  - Calls the existing `createEntryFromItems` helper targeting today's date. Since `createEntryFromItems` currently always uses `dateStr` (the viewed day), we need to either: (a) add an optional `targetDate` parameter to it, or (b) call `createEntry.mutateAsync` directly. Option (a) is cleaner since it reuses all the totals calculation and UID generation logic.
  - Omits `source_meal_id` (standalone copy, no meal stats inflation).
  - Carries over `group_name`.
  - Invalidates today's food-entries cache afterward.
- Only pass the callback to `FoodItemsTable` when `!isTodaySelected && !isReadOnly`.

### 4. `src/components/WeightItemsTable.tsx`
- Add optional `onCopyEntryToToday?: (entryId: string) => void` prop.
- Pass it to `EntryExpandedPanel` as `onCopyToToday`, binding the current entry ID.

### 5. `src/pages/WeightLog.tsx`
- Create inline `handleCopyEntryToToday` callback:
  - Finds all weight sets for the entry by `entryId` from current `weightSets`.
  - Calls `createEntry.mutateAsync` with today's date, a fresh `entry_id`, and the same exercise data. Omits `source_routine_id`.
  - Carries over `group_name`.
  - Invalidates today's weight-sets cache afterward.
- Only pass the callback to `WeightItemsTable` when `!isTodaySelected && !isReadOnly`.

## Technical detail: `createEntryFromItems` refactor

The existing `createEntryFromItems` in `FoodLog.tsx` hardcodes `dateStr` (the currently viewed date). To reuse it for "copy to today", add an optional `targetDate` parameter that defaults to `dateStr`:

```typescript
const createEntryFromItems = useCallback(async (
  items: FoodItem[],
  rawInput: string | null,
  sourceMealId?: string,
  groupName?: string | null,
  targetDate?: string,          // new optional param
) => {
  const effectiveDate = targetDate || dateStr;
  // ... rest uses effectiveDate instead of dateStr
```

Then the copy handler becomes:

```typescript
const handleCopyEntryToToday = useCallback((entryId: string) => {
  const entry = entries.find(e => e.id === entryId);
  if (!entry) return;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  createEntryFromItems(
    entry.food_items,
    entry.raw_input,
    undefined,                   // no source_meal_id
    entry.group_name ?? null,
    todayStr,                    // target today
  );
}, [entries, createEntryFromItems]);
```

For `WeightLog.tsx`, the equivalent `createEntryFromExercises` helper gets the same `targetDate` parameter treatment.

## Edge cases handled
- **Read-only / demo mode**: Hidden (same `!isReadOnly` guard as "Save as meal/routine").
- **Viewing today**: Hidden (no point copying to the same day).
- **Portion multiplier**: Copied as-is (what you see is what you get).
- **Source meal/routine ID**: Not carried over -- standalone copy.
- **Group name**: Carried over so the copied entry keeps its collapsed header.

## Summary

| File | Change |
|------|--------|
| `src/components/EntryExpandedPanel.tsx` | Add `onCopyToToday` prop, render link, `py-1` + `gap-4` hit targets |
| `src/components/FoodItemsTable.tsx` | Accept and pass through `onCopyEntryToToday` |
| `src/pages/FoodLog.tsx` | Add `targetDate` param to `createEntryFromItems`, implement copy handler |
| `src/components/WeightItemsTable.tsx` | Accept and pass through `onCopyEntryToToday` |
| `src/pages/WeightLog.tsx` | Add `targetDate` param to `createEntryFromExercises`, implement copy handler |

