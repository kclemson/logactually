
# Make "export your data to CSV" a Clickable Link

## What changes

**`AllMedicationsView.tsx`** — two small edits:

1. Add `onExport?: () => void` to the props interface.
2. Replace the plain text footer with mixed text + inline button:

```tsx
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

If no `onExport` is passed (e.g. in read-only / demo mode), it gracefully falls back to the plain text.

**`OtherLog.tsx`** — import `useExportData` and pass the handler:

```tsx
const { exportCustomLog } = useExportData();
...
<AllMedicationsView
  onExport={exportCustomLog}
  ...
/>
```

`useExportData` is already used elsewhere in the settings page, so it's a well-tested path.

## Files changed

| File | Change |
|---|---|
| `src/components/AllMedicationsView.tsx` | Add `onExport?` prop; replace plain footer text with inline clickable link |
| `src/pages/OtherLog.tsx` | Import `useExportData`; pass `exportCustomLog` as `onExport` to `AllMedicationsView` |
