
# Four UX Fixes + Edit Support for By Meds View

## What's currently broken (confirmed by reading the code)

1. **Selector drifts** — `justify-center` on line 147 of `OtherLog.tsx` causes the entire row to re-center whenever controls change width on mode switch.
2. **No date nav in By Meds** — The `DateNavigation` component only renders inside the `date` branch (line 370). The `medication` branch (line 349) has no navigation at all, and `useAllMedicationEntries` fetches all 500 rows with no date filter.
3. **"Log New" wraps** — `SelectTrigger` for "Log New" has `min-w-[110px]` but no `whitespace-nowrap`, causing it to wrap on narrow screens.
4. **No edit support** — No pencil icon exists anywhere yet; `MedicationEntryInput` has no initial-value props.

---

## Fix 1 — Stable left-justified header row

**File:** `OtherLog.tsx` line 147

Change the flex container from `justify-center` to `justify-start`:

```tsx
// Before
<div className="flex items-center justify-center gap-2">
// After
<div className="flex items-center justify-start gap-2">
```

The view-mode `Select` has a fixed `w-[90px]` width, so it always anchors at the left edge. The right-side controls flow naturally after it with no re-centering.

---

## Fix 2 — Date navigation in By Meds, scoped to selected date

The "By Meds" view currently shows all-time history. The plan: scope it to the selected date (same as "By Date" mode), show `DateNavigation` above the list, and group entries by medication name instead of by date (since it's all one day).

### `useAllMedicationEntries.ts`

Add a `dateStr` parameter and filter by `logged_date`. Remove the `.limit(500)` (now unnecessary — one day's data is tiny):

```ts
export function useAllMedicationEntries(medTypeIds: string[], dateStr: string) {
  ...
  queryFn: async () => {
    const { data, error } = await supabase
      .from('custom_log_entries')
      .select('*')
      .in('log_type_id', medTypeIds)
      .eq('logged_date', dateStr)          // ← date-scoped
      .order('logged_time', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    ...
  },
  enabled: !!user && medTypeIds.length >= 2,
}
```

### `OtherLog.tsx`

Pass `dateStr` to the hook:
```ts
const { entries: allMedEntries, ... } = useAllMedicationEntries(
  effectiveViewMode === 'medication' ? medTypeIds : [],
  dateStr
);
```

Wrap the `AllMedicationsView` in a fragment that includes `DateNavigation` first — same props as the `date` branch:

```tsx
{effectiveViewMode === 'medication' ? (
  <>
    <DateNavigation ... />   {/* same as date branch */}
    <AllMedicationsView ... />
  </>
) : ...}
```

### `AllMedicationsView.tsx`

Since it's now date-scoped, remove the date-grouping headers. Group by medication name instead (matching the "By Date" view's pattern of type-name subheaders). Each group shows:

```
── Metformin ──────────────────────────────
  9:04 AM   500 mg   [✏] [🗑]
  8:30 AM   500 mg   [✏] [🗑]

── Lisinopril ─────────────────────────────
  8:58 AM   10 mg    [✏] [🗑]
```

Add a muted footer note: "For full history across all dates, export your data in Settings → Import/Export."

---

## Fix 3 — "Log New" button no longer wraps

**File:** `OtherLog.tsx` line 210–215

Remove `min-w-[110px]`, add `whitespace-nowrap` to the inner span:

```tsx
<SelectTrigger className="h-8 text-sm font-medium w-auto bg-teal-500 text-white border-teal-500 hover:bg-teal-600 shrink-0">
  <span className="flex items-center gap-1 whitespace-nowrap">
    <Plus className="h-3 w-3 shrink-0" />
    Log New
  </span>
</SelectTrigger>
```

---

## Fix 4 — Reuse MedicationEntryInput for editing (pencil icon)

### `MedicationEntryInput.tsx`

Add three optional props for pre-filling existing entry values:

```ts
interface MedicationEntryInputProps {
  ...
  initialDose?: number | null;
  initialTime?: string | null;
  initialNotes?: string | null;
}
```

Change the `useState` initializers to prefer these when provided:

```ts
const [timeValue, setTimeValue] = useState(
  initialTime ?? getCurrentTimeValue()
);
const [doseValue, setDoseValue] = useState(
  initialDose != null ? String(initialDose) : defaultDose != null ? String(defaultDose) : ''
);
const [notes, setNotes] = useState(initialNotes ?? '');
```

No structural JSX changes needed — the same Save/Cancel button labels work for both create and edit.

### `AllMedicationsView.tsx`

Add `onEdit?: (entry: CustomLogEntry) => void` prop. Render a `Pencil` icon button before the trash icon for each entry (only when `!isReadOnly && onEdit`):

```tsx
{!isReadOnly && onEdit && (
  <Button variant="ghost" size="icon" className="h-6 w-6 ..." onClick={() => onEdit(entry)} aria-label="Edit entry">
    <Pencil className="h-3 w-3" />
  </Button>
)}
```

### `CustomLogTypeView.tsx`

Same pattern — add `onEdit?: (entry: CustomLogEntry) => void`, render pencil only for `isMedication` entries.

### `OtherLog.tsx`

Add edit state and update mutation:

```ts
const [editingEntry, setEditingEntry] = useState<CustomLogEntry | null>(null);
const editingLogType = editingEntry ? logTypes.find(t => t.id === editingEntry.log_type_id) : null;

const updateMedEntry = useMutation({
  mutationFn: async ({ id, numeric_value, logged_time, entry_notes }) => {
    const { error } = await supabase
      .from('custom_log_entries')
      .update({ numeric_value, logged_time, entry_notes })
      .eq('id', id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['custom-log-entries-all-meds'] });
    queryClient.invalidateQueries({ queryKey: ['custom-log-entries-for-type'] });
    queryClient.invalidateQueries({ queryKey: ['custom-log-entries', dateStr] });
    setEditingEntry(null);
  },
});
```

Add edit `Dialog` at the bottom (separate from the create dialog):

```tsx
{editingEntry && editingLogType && !isReadOnly && (
  <Dialog open={!!editingEntry} onOpenChange={(open) => { if (!open) setEditingEntry(null); }}>
    <DialogContent className="max-w-sm p-0 gap-0 border-0 bg-transparent shadow-none [&>button]:hidden">
      <MedicationEntryInput
        label={editingLogType.name}
        unit={editingLogType.unit}
        ...
        initialDose={editingEntry.numeric_value}
        initialTime={editingEntry.logged_time}
        initialNotes={editingEntry.entry_notes}
        todayEntryCount={todayMedEntries.length}
        todayLoggedTimes={todayMedEntries.map(e => e.logged_time).filter(Boolean) as string[]}
        onSubmit={(params) => updateMedEntry.mutate({ id: editingEntry.id, ...params })}
        onCancel={() => setEditingEntry(null)}
        isLoading={updateMedEntry.isPending}
      />
    </DialogContent>
  </Dialog>
)}
```

Pass `onEdit` to both views:
```tsx
<AllMedicationsView onEdit={(e) => setEditingEntry(e)} ... />
<CustomLogTypeView onEdit={(e) => setEditingEntry(e)} ... />
```

---

## Files changed

| File | Change |
|---|---|
| `src/pages/OtherLog.tsx` | `justify-center` → `justify-start`; pass `dateStr` to `useAllMedicationEntries`; add `DateNavigation` in By Meds branch; fix "Log New" button; add `editingEntry` state + `updateMedEntry` mutation + edit Dialog; pass `onEdit` callbacks; import `useQueryClient` + `supabase` |
| `src/hooks/useAllMedicationEntries.ts` | Add `dateStr` param; filter by `logged_date`; remove `.limit(500)` |
| `src/components/AllMedicationsView.tsx` | Remove date grouping; add medication-name grouping; add `onEdit` prop + pencil icon; add CSV export footer nudge |
| `src/components/CustomLogTypeView.tsx` | Add `onEdit?` prop; render pencil icon for medication entries only |
| `src/components/MedicationEntryInput.tsx` | Add `initialDose`, `initialTime`, `initialNotes` props; update `useState` initializers |

No database migrations needed.
