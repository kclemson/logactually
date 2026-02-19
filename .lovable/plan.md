
# Make "export your data to CSV" a Clickable Link

This is a small two-file change with no new dependencies or database changes needed.

## Changes

### `src/components/AllMedicationsView.tsx`

1. Add `onExport?: () => void` to the `AllMedicationsViewProps` interface and destructure it.
2. Update the footer paragraph (line 144-146) to render an inline `<button>` when `onExport` is provided, falling back to plain text otherwise.
3. Do the same for the empty-state footer (lines 49-51).

```tsx
// Props interface — add one line
onExport?: () => void;

// Footer (both the empty-state and the populated list)
<p className="text-xs text-muted-foreground text-center pt-2">
  For full history across all dates,{' '}
  {onExport ? (
    <button
      onClick={onExport}
      className="underline underline-offset-2 hover:text-foreground transition-colors"
    >
      export your data to CSV
    </button>
  ) : (
    'export your data in Settings → Import/Export.'
  )}
</p>
```

### `src/pages/OtherLog.tsx`

Import `useExportData` and call it, then pass `exportCustomLog` to `AllMedicationsView`:

```tsx
import { useExportData } from '@/hooks/useExportData';
// inside component:
const { exportCustomLog } = useExportData();
// on the component:
<AllMedicationsView onExport={exportCustomLog} ... />
```

`useExportData` is already used in `ImportExportSection` — no new patterns introduced.

## Files changed

| File | Change |
|---|---|
| `src/components/AllMedicationsView.tsx` | Add `onExport?` prop; replace plain footer text in both empty-state and populated-list with clickable inline button |
| `src/pages/OtherLog.tsx` | Import `useExportData`; pass `exportCustomLog` as `onExport` to `AllMedicationsView` |

No database changes, no new dependencies.
