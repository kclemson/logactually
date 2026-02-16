

# Refactor: Extract duplicated entry-level code, with test coverage

## Situation

There are no existing tests for `FoodItemsTable`, `WeightItemsTable`, or any of the entry-boundary / chevron / highlight logic being extracted. The project's test strategy uses Vitest + JSDOM for pure utility tests and lightweight smoke tests, which is exactly the right fit here.

## Updated plan: add a testing step before the extraction

Since the extracted code is all pure functions (array lookups, string formatting, CSS class computation), we can write unit tests for them cheaply and confidently. The approach:

### Step 0: Write tests for the logic BEFORE extracting it

Create `src/lib/entry-boundaries.test.ts` that tests the functions as they will exist in the new shared file. We write the tests first against the new file, then extract the code into it. If any test fails after extraction, we know something went wrong in the move.

Tests to write:

- **`isFirstInBoundary(index, boundaries)`** -- given a boundary array like `[{entryId:'a', startIndex:0, endIndex:2}, {entryId:'b', startIndex:3, endIndex:5}]`, verify index 0 returns true, index 1 returns false, index 3 returns true, etc.

- **`isLastInBoundary(index, boundaries)`** -- same structure, verify index 2 returns true, index 5 returns true, others false.

- **`isEntryNew(entryId, newEntryIds)`** -- given a Set of IDs, verify membership check works and handles missing/undefined.

- **`getEntryHighlightClasses(isNew, isFirst, isLast)`** -- verify it returns the correct CSS class string for each combination: first-only item, first-of-many, middle, last, and not-new (empty string).

- **`hasAnyEditedFields(item)`** -- verify returns true when `editedFields` has entries, false when empty or undefined.

- **`formatEditedFields(item)`** -- verify it joins field names into the expected tooltip string like "Edited: Calories, Protein".

These are all pure functions with no dependencies, so the tests are trivial to write and run instantly.

### Steps 1-4: Same as the approved plan

After the tests are green against the newly extracted file:

1. Extract shared types and pure functions into `src/lib/entry-boundaries.ts`
2. Extract `EntryChevron.tsx` component
3. Extract `DeleteAllDialog.tsx` component
4. Extract `DeleteGroupDialog.tsx` component

After each step, run the unit tests (should stay green since the extracted logic is unchanged) and do a manual visual check of both Food Log and Weight Log.

## Files created

| File | Purpose |
|---|---|
| `src/lib/entry-boundaries.ts` | Shared types and pure helper functions |
| `src/lib/entry-boundaries.test.ts` | Unit tests for all extracted pure functions |
| `src/components/EntryChevron.tsx` | Shared expand/collapse chevron button |
| `src/components/DeleteAllDialog.tsx` | Shared "Delete all for today" confirmation dialog |
| `src/components/DeleteGroupDialog.tsx` | Shared "Delete this group" confirmation dialog |

## Files modified

| File | Change |
|---|---|
| `src/components/FoodItemsTable.tsx` | Import shared code, remove ~80-100 lines of duplicated logic |
| `src/components/WeightItemsTable.tsx` | Same treatment |

## Verification approach

1. Run `entry-boundaries.test.ts` after extraction -- all pure logic tests pass
2. Manual check: Food Log -- log multi-item entry, verify highlight animation, chevron expand/collapse, delete group dialog, delete all dialog
3. Manual check: Weight Log -- same verification
4. Manual check: other consumers (open SaveMealDialog, SavedMealRow in Settings, DemoPreviewDialog) -- confirm they still render flat item lists correctly
5. Run existing test suite (`Settings.test.tsx`, `DateNavigation.test.tsx`, etc.) -- confirm no regressions

