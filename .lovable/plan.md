
# Remove "By Type" View from Other Log

## What's changing

The view-mode selector currently has three options: **By Date**, **By Type**, **By Meds**. We're removing "By Type" entirely and making the header controls consistent between the remaining two modes.

## Current control layout (per mode)

| Mode | Left control | Right control |
|---|---|---|
| By Date | View-mode Select (90px) | "Add custom log" Select (teal, full list) |
| By Type | View-mode Select (90px) | Type picker Select + "Log New" Button |
| By Meds | View-mode Select (90px) | "Log New" Select (teal, meds only) |

## Target control layout (after)

| Mode | Left control | Right control |
|---|---|---|
| By Date | View-mode Select (90px, now only 2 options) | "Log New" Select (teal, full list) |
| By Meds | View-mode Select (90px) | "Log New" Select (teal, meds only) |

The "By Date" `Add custom log` Select becomes a `Log New` Select — same underlying mechanic (pick a type → show input dialog, or pick "New Custom Log Type" to open picker), just renamed to match "By Meds".

## Technical changes — `src/pages/OtherLog.tsx`

1. **Narrow `ViewMode` type** from `'date' | 'type' | 'medication'` to `'date' | 'medication'`.

2. **`getStoredViewMode`** — remove `'type'` from the valid stored values; anything other than `'date'` or `'medication'` falls back to `'date'`.

3. **`effectiveViewMode` guard** — currently handles `viewMode === 'medication' && !showMedView`. Remove the `type` branch entirely; simplify the guard to just handle the meds-threshold case.

4. **`activeTypeId`** — remove the `viewMode === 'type' ? effectiveTypeId` branch; it becomes `null` for date mode (the entry dialog uses `effectiveTypeId` separately) and `selectedMedTypeId` for medication mode.

5. **`useCustomLogEntriesForType`** — this hook is currently driven by `activeTypeId`. After removal of the type view it's only needed for meds (`selectedMedTypeId`). The hook call and `typeEntries` / `typeEntriesLoading` remain, but only used in the medication dialog path.

6. **View-mode Select** — remove the `<SelectItem value="type">` option.

7. **Right-side controls** — remove the entire `effectiveViewMode === 'type'` branch (the nested Type-picker Select + Log New button). The `effectiveViewMode === 'date'` branch's label changes from `"Add custom log"` to `"Log New"` and the trigger gets a `<Plus>` icon prepended to match By Meds styling.

8. **Body rendering** — remove the `effectiveViewMode === 'type' && selectedType` branch (which renders `<CustomLogTypeView>`). The ternary collapses to: medication view → date view.

9. **`selectedTypeId` / `effectiveTypeId` / `selectedType`** — these are still needed for the By Date dialog (to know which log type the user picked from the dropdown before the dialog opens). No change needed here.

10. **`useCustomLogEntriesForType` import** — still needed for the medication entry dialog, so the import stays.

11. **`CustomLogTypeView` import** — can be removed since it's no longer rendered anywhere.

## What's NOT changing

- All entry submission logic, create/update/delete mutations — unchanged
- `AllMedicationsView`, `MedicationEntryInput`, `LogEntryInput` — unchanged
- All dialogs (CreateLogType, CreateMedication, LogTemplatePicker) — unchanged
- DateNavigation — unchanged (still present in both remaining views)
- The "Log New" by-meds Select already works exactly as desired; no change needed there

## Files to edit

- `src/pages/OtherLog.tsx` — all changes are here; no other files are affected
