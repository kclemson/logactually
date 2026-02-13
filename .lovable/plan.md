

## Restructure Other Log Page Layout

Reorganize the page into three clear zones: date picker at top, all logged entries in the middle, and all entry creation controls at the bottom.

### Current layout
1. Date picker
2. Add Tracking Type button
3. Per-type collapsible sections (each containing its entries AND its "+ Add" button)

### New layout
1. Date picker (unchanged)
2. Flat list of ALL logged entries across all types (no collapsible sections)
3. Bottom section: per-type "+ Add" buttons + "Add Tracking Type" button

---

### File: `src/pages/OtherLog.tsx`

**Entries section (middle):** Replace the collapsible sections with a simple flat list of all entries. Each entry row already shows the type name on the left and the value on the right via `CustomLogEntryRow`, so grouping by type headers is unnecessary -- the type name is already visible on each row.

```
{/* All logged entries, flat list */}
{entries.length > 0 ? (
  entries.map(entry => {
    const logType = logTypes.find(t => t.id === entry.log_type_id);
    return (
      <CustomLogEntryRow
        key={entry.id}
        entry={entry}
        typeName={logType?.name || ''}
        valueType={logType?.value_type || 'text'}
        onDelete={id => deleteEntry.mutate(id)}
        isReadOnly={isReadOnly}
      />
    );
  })
) : (
  <p className="text-xs text-muted-foreground py-1">No entries for this date.</p>
)}
```

**Bottom section:** Show a "+ Add" `LogEntryInput` for each existing tracking type (labeled with the type name), followed by the "+ Add Tracking Type" button at the very end.

```
{/* Entry creation controls */}
{!isReadOnly && (
  <div className="space-y-2 pt-4 border-t border-border/50">
    {logTypes.map(logType => (
      <LogEntryInput
        key={logType.id}
        valueType={logType.value_type}
        label={logType.name}        // NEW prop
        onSubmit={params => createEntry.mutate({
          log_type_id: logType.id,
          logged_date: dateStr,
          ...params,
        })}
        isLoading={createEntry.isPending}
      />
    ))}
    <button onClick={() => setCreateTypeOpen(true)} ...>
      + Add Tracking Type
    </button>
  </div>
)}
```

### File: `src/components/LogEntryInput.tsx`

Add an optional `label` prop so the collapsed "+ Add" button reads "+ Add weight" or "+ Add mood" instead of just "+ Add".

```tsx
interface LogEntryInputProps {
  // ...existing
  label?: string;  // NEW
}

// In the collapsed state:
<Button ...>
  <Plus /> Add {label || ''}
</Button>
```

### File: `src/components/CollapsibleSection.tsx`

No changes -- it simply won't be used on this page anymore. The import can be removed from `OtherLog.tsx`.

---

### Summary of changes

| File | Change |
|------|--------|
| `src/pages/OtherLog.tsx` | Remove collapsible sections; flat entry list in middle, add-controls at bottom with separator |
| `src/components/LogEntryInput.tsx` | Add optional `label` prop to show type name on the button |

2 files changed.
