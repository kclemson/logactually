

## Remove Daily Food Totals Export

**File: `src/pages/Settings.tsx`**

Remove the "Daily Food Totals" button from the export row, keeping only "Detailed Food Log". This simplifies the UI to two export buttons total (one food, one exercise).

**File: `src/hooks/useExportData.ts`**

Remove the `handleExportDailyTotals` function and its return value `exportDailyTotals`.

**File: `src/lib/csv-export.ts`**

Remove the `exportDailyTotals` function (dead code cleanup).

