

# Extract Entry Expanded Panel into Shared Component

## What this extracts

The "expanded content panel" is the section revealed when a user clicks the chevron on any entry. Both `FoodItemsTable` and `WeightItemsTable` render this inline today with nearly identical structure.

## Complete inventory of what the panel contains today

### Shared between Food (lines 677-734) and Weight (lines 676-767)

1. **"Logged as: {rawInput}"** -- italic muted text showing the original user input. Hidden when the entry came from a saved meal/routine, or when rawInput is null.

2. **Saved item link OR save button** (left side of a flex row):
   - If from a saved meal/routine: `"From saved meal/routine: {Name}"` where Name is a blue `hover:underline` link to `/settings`, or `"(deleted)"` if the saved item no longer exists
   - If NOT from a saved item: a `"Save as meal"` / `"Save as routine"` blue button that triggers the save flow

3. **DeleteGroupDialog** (right side of the same flex row): "Delete this group (N items)" link with confirmation dialog. The component itself handles hiding when fewer than 2 items.

### Weight-only content (rendered ABOVE the shared content)

4. **Per-exercise calorie burn estimates** -- iterates over all exercises in the entry, calls `estimateCalorieBurn` + `formatCalorieBurnValue` for each, then displays either `"Estimated calories burned: 120-150"` for a single exercise or `"120-150 (Bench Press), 80-100 (Curls)"` for multiple. Only shown when `calorieBurnSettings.calorieBurnEnabled` is true.

### Minor differences to normalize

| Detail | Food (current) | Weight (current) | Shared (new) |
|---|---|---|---|
| "Save as" button class | `underline` | `hover:underline` | `hover:underline` |
| Panel padding | `pl-6 pt-2 pb-1` | `pl-6 py-1` | `pl-6 pt-2 pb-1` |
| Panel spacing | `space-y-1.5` | `space-y-1` | `space-y-1.5` |

## Phased rollout to minimize regression risk

**Phase 1 (this plan):** Create the shared `EntryExpandedPanel` component and migrate `WeightItemsTable` to use it. Weight is the superset (it has everything Food has plus calorie burn estimates), so if it works for Weight, it works for Food.

**Phase 2 (separate future plan):** Migrate `FoodItemsTable` to use the same component.

## New component

**`src/components/EntryExpandedPanel.tsx`** (~70 lines)

```text
Props:
  items: { uid: string; description: string }[]   -- for DeleteGroupDialog + save callback
  rawInput: string | null                          -- original logged text
  savedItemInfo: {
    type: 'meal' | 'routine'
    name: string | null        -- null = saved item was deleted
    isFromSaved: boolean       -- whether entry came from a saved item
  }
  onSaveAs?: () => void        -- "Save as meal/routine" callback
  onDeleteEntry?: () => void   -- group deletion callback
  gridCols: string             -- parent grid column class for alignment
  extraContent?: ReactNode     -- slot rendered before standard content
```

Renders (in order):
1. `extraContent` slot (Weight passes calorie burn estimates here)
2. "Logged as: {rawInput}" -- hidden when `isFromSaved` is true or `rawInput` is null
3. Flex row with:
   - Left: "From saved {type}: {name}" link, or "(deleted)", OR "Save as {type}" button
   - Right: `DeleteGroupDialog`

## Files changed in Phase 1

| File | Change |
|---|---|
| `src/components/EntryExpandedPanel.tsx` | New shared component (~70 lines) |
| `src/components/WeightItemsTable.tsx` | Replace lines 676-767 (~91 lines of inline JSX) with `<EntryExpandedPanel>` call (~18 lines). The calorie burn estimate block becomes the `extraContent` prop value. |

## What does NOT change

- `FoodItemsTable.tsx` -- keeps its inline expanded panel code until Phase 2
- Entry boundary logic, chevron component, highlight animations (already extracted)
- Row-level delete buttons (trash icon on last item row)
- Inline editing behavior
- TotalsRow rendering
- Item-level row rendering (description cells, macro columns, sets/reps/weight cells)
- Settings page sections (SavedMealRow, SavedRoutineRow, CustomLogTypeRow)
- Custom Log page (OtherLog.tsx, CustomLogEntryRow.tsx)
- Calorie burn calculation logic itself (just moves into the extraContent slot)

