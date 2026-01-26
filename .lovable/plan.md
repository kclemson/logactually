

## Add CSV Data Export to Settings

### Overview
Add the ability for users to export their food log data as CSV files from the Settings page. Two export options will be provided:
1. **Daily Totals** - One row per day with aggregated calories and macros
2. **Food Log** - Detailed export with one row per food item

The Export Data section will appear below Appearance (at the bottom of the page).

---

### New Utility File: `src/lib/csv-export.ts`

Create a dedicated utility for CSV generation and download:

```typescript
import { FoodEntry } from '@/types/food';
import { format } from 'date-fns';

function escapeCSV(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDailyTotals(entries: FoodEntry[]) { /* aggregate by date, download */ }
export function exportFoodLog(entries: FoodEntry[]) { /* one row per food item, download */ }
```

---

### New Hook: `src/hooks/useExportData.ts`

Fetch all user entries and trigger exports:

```typescript
export function useExportData() {
  const [isExporting, setIsExporting] = useState(false);

  const fetchAllEntries = async (): Promise<FoodEntry[]> => { /* query food_entries */ };
  const handleExportDailyTotals = async () => { /* fetch + export */ };
  const handleExportFoodLog = async () => { /* fetch + export */ };

  return { isExporting, exportDailyTotals, exportFoodLog };
}
```

---

### Update Settings Page: `src/pages/Settings.tsx`

Add Export Data section **after Appearance**:

```text
Settings
  |
  +-- Saved Meals (Star icon)
  |
  +-- Appearance (SunMoon icon)
  |
  +-- Export Data (Download icon)  <-- NEW, at bottom
```

```tsx
{/* Appearance section - existing */}
<section className="space-y-3">
  <h3>Appearance</h3>
  {/* theme options */}
</section>

{/* Export Data - NEW section below Appearance */}
<section className="space-y-3">
  <h3 className="text-heading text-muted-foreground flex items-center gap-2">
    <Download className="h-4 w-4" />
    Export Data
  </h3>
  <div className="pl-4 space-y-2">
    <div className="flex flex-col gap-2 max-w-xs">
      <Button variant="outline" size="sm" onClick={exportDailyTotals} disabled={isExporting}>
        <Download className="h-4 w-4 mr-2" />
        Daily Totals (CSV)
      </Button>
      <Button variant="outline" size="sm" onClick={exportFoodLog} disabled={isExporting}>
        <Download className="h-4 w-4 mr-2" />
        Full Food Log (CSV)
      </Button>
    </div>
    <p className="text-xs text-muted-foreground">
      Export your data for use in spreadsheet apps
    </p>
  </div>
</section>
```

---

### CSV Output Examples

**Daily Totals CSV:**
```text
Date,Calories,Protein (g),Carbs (g),Fat (g)
2026-01-24,1850,95,180,65
2026-01-25,2100,110,195,75
2026-01-26,201,8,28,6
```

**Food Log CSV:**
```text
Date,Time,Food Item,Calories,Protein (g),Carbs (g),Fat (g),Raw Input
2026-01-26,10:47,Bacon pan-fried (1 slice),43,3,0,3,One piece of bacon...
2026-01-26,10:58,Vanilla Yogurt (1 container),90,4,13,2,another activia...
```

---

### Files Changed

| File | Action |
|------|--------|
| `src/lib/csv-export.ts` | Create |
| `src/hooks/useExportData.ts` | Create |
| `src/pages/Settings.tsx` | Add Export Data section after Appearance |

