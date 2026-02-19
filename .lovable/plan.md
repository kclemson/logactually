

## Edit-mode toggle for saved charts

### Behavior

- Default state: charts render with no action icons — clean view
- A pencil icon button on the "My Charts" section header toggles edit mode on/off
- In edit mode: each chart card shows a pencil icon (opens editor) and a trash icon (delete with confirmation) in its header row
- Exiting edit mode hides all per-card controls

### Changes

| File | What changes |
|---|---|
| `src/pages/Trends.tsx` | Re-introduce `isEditMode` state. Restore the pencil toggle button as the `headerAction` on the `CollapsibleSection`. For each saved chart's `DynamicChart`, only pass the `headerAction` prop (containing edit + delete buttons) when `isEditMode` is true. Keep the `onNavigate` prop always present (it's independent of edit mode). |

### Detail

The `headerAction` on each `DynamicChart` will be conditionally rendered:

```
headerAction={isEditMode ? (
  <div className="flex items-center gap-0.5">
    <button onClick={() => setEditingChart(...)}>
      <Pencil className="h-3 w-3" />
    </button>
    <DeleteConfirmPopover ... />
  </div>
) : undefined}
```

The section-level header action stays as the edit-mode toggle:

```
headerAction={
  <button onClick={() => setIsEditMode(v => !v)}>
    <Pencil className="h-3.5 w-3.5" />
  </button>
}
```

When `isEditMode` is true, the section header pencil gets a highlight color (e.g. `text-primary`) to indicate active state; when false, it's muted.

One file changed, roughly reverting the edit-mode removal while keeping `onNavigate` and the per-card pencil icon from the previous change.

