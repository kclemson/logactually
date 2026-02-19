
# Add "Log New" to the By Meds View

## What we're building

In "By Meds" view, add a teal "Log New" dropdown button to the header row — sitting right next to the view-mode selector — that lets the user pick which medication to log. Selecting a medication opens the existing `MedicationEntryInput` modal dialog.

This mirrors the "Add custom log" dropdown pattern already used in "By Date" mode and avoids forcing the user to switch views just to log a dose.

---

## Header row layout for By Meds mode

```
[By Meds ▾]   [Log New ▾]
```

The "Log New" dropdown lists only medication-type log types (the same `medicationTypes` array we already filter). Selecting one sets a `selectedMedTypeId` state and opens the `showInputDialog` modal — the exact same dialog used in By Type mode.

This is a dropdown rather than a simple button because there's no "currently selected" medication context in By Meds mode the way there is in By Type mode.

---

## State additions in `OtherLog.tsx`

We need:
- `viewMode` extended from `'date' | 'type'` to `'date' | 'type' | 'medication'`
- `selectedMedTypeId: string | null` — tracks which medication was chosen from the Log New dropdown in By Meds mode
- `showMedInputDialog: boolean` — separate from `showInputDialog` used in By Type, to avoid coupling (or we can reuse `showInputDialog` and just route `selectedMedTypeId` vs `effectiveTypeId` into the dialog — simpler, one less state)

**Simpler approach (one dialog state):** Reuse `showInputDialog` and derive the "active type for the dialog" as:
```ts
const dialogType = viewMode === 'medication'
  ? logTypes.find(t => t.id === selectedMedTypeId)
  : selectedType;  // existing By Type logic
```

Then the existing dialog block at the bottom of the JSX just renders `dialogType` instead of `selectedType`.

---

## Data for the By Meds view itself

The new hook `useAllMedicationEntries` queries entries for all `medicationTypes` IDs. This powers the history list below the header.

For the "Log New" dialog, we reuse `useCustomLogEntriesForType` — but it currently only activates when `viewMode === 'type'`. We extend the condition:
```ts
const activeTypeId = viewMode === 'type' ? effectiveTypeId
                   : viewMode === 'medication' ? selectedMedTypeId
                   : null;

const { entries: typeEntries, createEntry: createTypeEntry, deleteEntry: deleteTypeEntry } =
  useCustomLogEntriesForType(activeTypeId);
```

This means `todayMedEntries` (for the dose count/timestamps) is already correctly scoped to whichever medication was picked in the dropdown.

---

## Files changed

| File | Change |
|---|---|
| `src/hooks/useAllMedicationEntries.ts` | New hook — queries `custom_log_entries` IN list of medication type IDs, ordered by date/time DESC |
| `src/components/AllMedicationsView.tsx` | New component — date-grouped table of all medication doses with name, dose+unit, time, delete |
| `src/pages/OtherLog.tsx` | (1) Extend `ViewMode` to `'date' \| 'type' \| 'medication'`; (2) compute `medicationTypes` and `showMedView` (>= 2 meds); (3) add `'medication'` to view selector conditionally; (4) add `selectedMedTypeId` state; (5) in By Meds header, render a teal "Log New" dropdown listing medication types; (6) unify dialog logic to use `dialogType` derived from active view mode; (7) render `<AllMedicationsView>` when `viewMode === 'medication'` |

---

## Technical details

### `useAllMedicationEntries`

```ts
export function useAllMedicationEntries(medTypeIds: string[]) {
  return useQuery({
    queryKey: ['custom-log-entries-all-meds', medTypeIds],
    queryFn: async () => {
      if (!medTypeIds.length) return [];
      const { data, error } = await supabase
        .from('custom_log_entries')
        .select('*')
        .in('log_type_id', medTypeIds)
        .order('logged_date', { ascending: false })
        .order('logged_time', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: medTypeIds.length >= 2,
  });
}
```

### `AllMedicationsView` layout

Entries are grouped by `logged_date`. Each date section renders a muted centered date header, then one row per entry:

```
── Today ─────────────────────────────────
  Metformin      500 mg    9:04 AM    🗑
  Lisinopril      10 mg    8:58 AM    🗑

── Feb 18 ────────────────────────────────
  Metformin      500 mg    8:45 PM    🗑
```

Columns: name (flex-1 truncate), dose+unit (tabular-nums fixed width `w-28`), time (muted right-align `w-16`), delete icon.

Notes shown below the row in italic muted `text-xs` if present.

### Fallback on med type count drop

If the user is in `'medication'` mode and the count of medication types drops below 2 (e.g. they delete one), we auto-reset to `'date'`:

```ts
const medicationTypes = logTypes.filter(t => t.value_type === 'medication');
const showMedView = medicationTypes.length >= 2;

// Guard: fall back if med view no longer qualifies
if (viewMode === 'medication' && !showMedView) {
  handleViewModeChange('date');
}
```

This is done inline in the render (before the JSX return), not in a `useEffect`, since it's derived state — consistent with the project's guidelines.

### `getStoredViewMode` update

```ts
function getStoredViewMode(): ViewMode {
  try {
    const stored = localStorage.getItem('custom-log-view-mode');
    if (stored === 'date' || stored === 'type' || stored === 'medication') return stored;
  } catch {}
  return 'date';
}
```

No DB changes. No new migrations.
