

## Update Export Section Styling

### Overview
Improve the Export Data section UI to match the Appearance section's button layout and simplify the title.

---

### Changes to `src/pages/Settings.tsx`

**1. Update section title**
- Before: `Export Data`
- After: `Export as CSV`

**2. Remove helper text**
- Delete: `Export your data for use in spreadsheet apps`

**3. Change button layout to match Appearance section**

| Before | After |
|--------|-------|
| Stacked full-width buttons (`flex-col`) | Side-by-side compact buttons (`flex gap-2`) |

---

### Code Changes

```tsx
{/* Export as CSV */}
<section className="space-y-3">
  <h3 className="text-heading text-muted-foreground flex items-center gap-2">
    <Download className="h-4 w-4" />
    Export as CSV
  </h3>
  <div className="pl-4">
    <div className="flex gap-2 max-w-xs">
      <Button
        variant="outline"
        size="sm"
        onClick={exportDailyTotals}
        disabled={isExporting}
      >
        Daily Totals
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportFoodLog}
        disabled={isExporting}
      >
        Food Log
      </Button>
    </div>
  </div>
</section>
```

---

### Visual Result

```text
Export as CSV
  [Daily Totals] [Food Log]
```

Buttons will be compact and side-by-side, matching the Appearance section's `[Light] [Dark] [System]` layout.

