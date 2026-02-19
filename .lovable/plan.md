
# Unify Custom Log Rendering into a Single `AllEntriesView` Component

## The Core Idea

Instead of two separate rendering components (`AllMedicationsView` for "By Meds" and the `CustomLogEntryRow` loop in `OtherLog.tsx` for "By Date"), we create one new component — let's call it **`CustomLogEntriesView`** — that handles **all entry types** and takes a `medicationsOnly?: boolean` prop. The By Meds view passes `medicationsOnly={true}`, the By Date view passes nothing (defaults to false, shows everything).

This also folds in all four layout improvements simultaneously:

1. Tighter vertical padding everywhere
2. Consistent grid-column layout for medication rows across both views
3. Pencil edit icon present in both views (currently missing in By Date)
4. Inline truncated notes column instead of a second line

`AllMedicationsView` is retired entirely and replaced by `CustomLogEntriesView`.

---

## New Component: `src/components/CustomLogEntriesView.tsx`

This replaces `AllMedicationsView` and the inline grouping loop in `OtherLog.tsx`.

### Props

```ts
interface CustomLogEntriesViewProps {
  entries: CustomLogEntry[];          // all entries for the date
  logTypes: CustomLogType[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit?: (entry: CustomLogEntry) => void;
  onExport?: () => void;
  isReadOnly: boolean;
  medicationsOnly?: boolean;          // true = By Meds, false/absent = By Date (show all)
}
```

### Grouping logic

Identical to what `AllMedicationsView` and `OtherLog.tsx` each do independently today — group entries by `log_type_id`. When `medicationsOnly={true}`, only medication-type groups are rendered.

### Row layout — one design for all entry types

**Medication entries** (value_type === 'medication'):

Uses a CSS grid — 4 columns:

```
[time: w-16] [dose: min-w-[60px]] [notes: flex-1 truncated muted italic] [pencil: w-6] [trash: w-6]
```

- Time: `text-xs text-muted-foreground`, formatted as `h:mm a` (or `—` if no `dose_time`)
- Dose: `text-sm tabular-nums`, formatted as `value unit` (or `—`)
- Notes: `text-xs text-muted-foreground italic truncate`, displayed inline — no second line; if absent, column is empty (no layout shift)
- Edit (pencil): only shown if `!isReadOnly && onEdit`
- Delete (trash): only shown if `!isReadOnly`
- On desktop: pencil + trash are `md:opacity-0 md:group-hover:opacity-100`

**Non-medication entries** (numeric, dual_numeric, text, text_multiline, text_numeric):

These render exactly as they currently do via `CustomLogEntryRow`. The existing `CustomLogEntryRow` component is kept intact and called for non-medication entries, same as today.

### Section headers

`text-xs font-medium text-muted-foreground` — same as today but with reduced vertical padding: `py-0.5` instead of `py-1`.

### Spacing

- Between groups: `space-y-1.5` (down from `space-y-3`)
- Entry rows within a medication group: `py-1` (down from `py-2`)
- No second-line for notes (inline instead)

### Footer

The export footer ("For full history...") is shown when `onExport` is provided. In the By Date view, `onExport` is not passed, so no footer appears. In the By Meds view, `onExport` is passed — footer appears at the bottom. Same behavior as today, just controlled by prop presence rather than a separate `hideFooter` prop.

### Empty state

- `medicationsOnly={true}`: "No medications logged for this day."
- `medicationsOnly={false}` (By Date): "No custom log items for this day"

---

## Changes to `OtherLog.tsx`

### Imports
- Remove: `AllMedicationsView`, `CustomLogEntryRow`
- Add: `CustomLogEntriesView`
- Remove: `useAllMedicationEntries` (no longer needed as a separate hook — By Date already has all entries from `useCustomLogEntries`; By Meds can use the same `entries` if we pass all entries and let the component filter, but we keep `useAllMedicationEntries` for the med-only query since it uses `.in('log_type_id', medTypeIds)` which is more targeted. Actually — re-evaluate below.)

### Data fetching re-evaluation

Currently:
- **By Date**: `useCustomLogEntries(dateStr)` — all entries for the date (all types) ✓
- **By Meds**: `useAllMedicationEntries(medTypeIds, dateStr)` — medication entries only

With the unified component, By Date passes all entries + `medicationsOnly={false}`, so it filters in the component. By Meds currently fetches with a separate targeted query. We can simplify: pass the full `entries` to By Meds too with `medicationsOnly={true}`, and drop the `useAllMedicationEntries` hook entirely. The `useCustomLogEntries(dateStr)` already fetches all entries for the date anyway.

This also removes the `useAllMedicationEntries` hook import and the `medTypeIds` memo.

### Body rendering

Both view modes now render:

```tsx
<CustomLogEntriesView
  entries={entries}
  logTypes={logTypes}
  isLoading={isLoading}
  onDelete={(id) => deleteEntry.mutate(id)}
  onEdit={(entry) => setEditingEntry(entry)}
  onExport={effectiveViewMode === 'medication' ? exportCustomLog : undefined}
  isReadOnly={isReadOnly}
  medicationsOnly={effectiveViewMode === 'medication'}
/>
```

The `DateNavigation` block above it is duplicated currently — we can hoist it to render once regardless of mode.

### Removed state/variables

- `activeTypeId` — no longer needed (was for `useCustomLogEntriesForType` in med mode)
- `useCustomLogEntriesForType` — still needed for the medication entry dialog's `todayMedEntries` count. The hook call stays, but only for the dialog's `todayEntryCount`/`todayLoggedTimes`. The entries display no longer uses it.
- `allMedEntries`, `allMedEntriesLoading`, `deleteAllMedEntry`, `medTypeIds` — all removed
- `deleteAllMedEntry` calls → replaced with `deleteEntry.mutate(id)`

### Edit dialog

The `editingEntry` + `updateMedEntry` pattern stays exactly as-is. The new `CustomLogEntriesView` calls `onEdit(entry)` → sets `editingEntry` → dialog opens. No change.

---

## Files to Create/Edit

| File | Action |
|---|---|
| `src/components/CustomLogEntriesView.tsx` | **Create new** — unified view component |
| `src/pages/OtherLog.tsx` | Edit — use new component in both view modes; remove now-dead imports and data fetching |
| `src/components/AllMedicationsView.tsx` | Delete (replaced by `CustomLogEntriesView`) |

`CustomLogEntryRow.tsx` is **kept unchanged** — used for non-medication entries inside `CustomLogEntriesView`.

---

## Visual Result

**By Date** (non-medication, e.g. Blood Pressure):
```
Blood Pressure
120 / 80 mmHg                          [🗑]
```

**By Date** (medication):
```
Compazine
12:48 PM   5 mg    foo bar...    [✎]  [🗑]
3:55 PM    7 mg    more foo b…   [✎]  [🗑]
```

**By Meds** (same medication block — identical rendering):
```
Compazine
12:48 PM   5 mg    foo bar...    [✎]  [🗑]
3:55 PM    7 mg    more foo b…   [✎]  [🗑]

Blood Pressure  ← hidden (medicationsOnly=true)
```
