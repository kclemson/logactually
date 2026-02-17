

# Collapsed Group Rows for Multi-Item Food Entries

## Overview
Multi-item food entries (from photos, saved meals, or multi-item text input) will default to a collapsed "group header" row showing a summary name, aggregate calories/P/C/F, and a portion multiplier. Expanding reveals indented sub-items with full edit capabilities, plus the existing metadata panel.

## How grouping works (data model)

No new database relationships are needed. The existing `food_entries` table already contains a `food_items` JSONB array -- each entry IS the group. A new nullable `group_name TEXT` column on the `food_entries` table stores the display label for the collapsed row. Single-item entries (1 item) render exactly as today with no group header.

There is no risk of name collisions across days or duplicate entries, because `group_name` is just a display label on a specific `food_entries` row (identified by its UUID `id`). Two entries on different days -- or even the same day -- can share the same `group_name` without conflict.

## Deletion behavior

- **Collapsed group**: The delete button (trash icon) on the group header row triggers the existing `DeleteGroupDialog` (confirmation listing all sub-items), then deletes the entire entry.
- **Expanded sub-items**: Each sub-item has its own delete button (same as today). Deleting individual items updates the entry; deleting the last item removes the entry.

## Inline editing in expanded state

The expanded sub-items reuse the exact same rendering code paths as today (same `DescriptionCell`, `useInlineEdit`, portion scaling stepper, calorie input, P/C/F preview). No behavioral changes to individual item editing -- it's the same code, just visually indented under the group header.

---

## Technical details

### 1. Database migration
Add nullable `group_name TEXT` column to `food_entries`.

### 2. `src/types/food.ts`
Add `group_name: string | null` to the `FoodEntry` interface.

### 3. `supabase/functions/_shared/prompts.ts`
In `buildPhotoAnalysisPrompt()`, tighten the `summary` instruction from "max ~60 chars" to "max ~30 chars" so it fits cleanly as a group header label (e.g., "Turkey dinner", "Chicken salad").

### 4. `src/pages/FoodLog.tsx` -- populate `group_name` at creation time

- **Photo entries** (`handlePhotoSubmit`): Use `result.summary` as `group_name`.
- **Saved meal entries** (`handleLogSavedMeal` / `createEntryFromItems`): Look up the meal name from the `mealId` parameter and pass it as `group_name`.
- **Text entries** (`handleSubmit`): For multi-item results (2+ items), use `raw_input` as fallback `group_name` (or null; client truncates for display).

Build an `entryGroupNames` map (like existing `entryMealNames`) from `entries` data and pass to `FoodItemsTable`.

### 5. `src/components/FoodItemsTable.tsx` -- major rendering changes

This is the core change. For each entry boundary with 2+ items:

**New props:**
- `entryGroupNames?: Map<string, string>` -- maps entryId to group display name

**Collapsed state (default -- entry NOT in `expandedEntryIds`):**
- Render a single "group header" row instead of individual items
- Description cell: group name (truncated if needed) with clickable "(1 portion)" for group-level scaling
- Calories cell: sum of all items' calories in that entry
- P/C/F cell: summed P/C/F
- Chevron on left to expand
- Delete button on right triggers `DeleteGroupDialog` (lists all sub-items)

**Expanded state (entry IS in `expandedEntryIds`):**
- Group header row stays visible (semibold styling)
- Individual sub-items rendered below with `pl-6` indent and smaller/muted text
- Each sub-item has full inline edit (description, calories, portion scaling, individual delete)
- Below sub-items: existing `EntryExpandedPanel` (Logged as, Save as meal, Delete group)

**Group-level portion scaling:**
- Tapping "(1 portion)" on the group header opens the same stepper UI (-, 1x, +, Done)
- On "Done", applies `scaleItemByMultiplier` to every item in the group, then saves via existing `handleItemUpdateBatch` pattern

**Single-item entries (1 item):**
- Render exactly as today, no group header, no behavior change

### 6. `src/lib/entry-boundaries.ts`
Add a small helper `isMultiItemEntry(boundary)` that returns `boundary.endIndex > boundary.startIndex`. Used to decide whether to render the group header vs individual rows.

### 7. Files summary

| File | Change |
|------|--------|
| Database migration | Add `group_name TEXT` column to `food_entries` |
| `src/types/food.ts` | Add `group_name` to `FoodEntry` |
| `supabase/functions/_shared/prompts.ts` | Shorten photo summary to ~30 chars |
| `src/pages/FoodLog.tsx` | Populate `group_name` on creation; build + pass `entryGroupNames` map |
| `src/components/FoodItemsTable.tsx` | Render collapsed group headers for multi-item entries; group-level portion scaling; indent sub-items when expanded |
| `src/lib/entry-boundaries.ts` | Add `isMultiItemEntry` helper |

### 8. What does NOT change
- Single-item entries look and behave identically to today
- `EntryExpandedPanel`, `DeleteGroupDialog`, `EntryChevron` -- reused as-is
- `WeightItemsTable` -- no grouping changes in this phase
- Settings pages, `SavedItemRow` -- no changes (different UX pattern)
- All existing inline editing behavior (description, calories, portion) remains identical for sub-items

