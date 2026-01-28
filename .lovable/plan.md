

## Settings Page Updates

Address spacing issues and enhance CSV export functionality with weight lifting data support.

---

### Issue 1: Reduce Vertical Spacing

The current Settings page uses `space-y-6` (24px gap) between sections, which creates too much visual separation.

**Change in `src/pages/Settings.tsx`:**
- Line 98: Change `<div className="space-y-6">` to `<div className="space-y-4">`
- This reduces the gap from 24px to 16px, creating a more cohesive layout

---

### Issue 2: Rename and Expand Export Section

**Current state:**
- Section title: "Export Food Data"
- Buttons: "Daily Totals", "Food Log"

**New state:**
- Section title: "Export to CSV"
- Buttons grouped by data type:
  - Food: "Food Daily Totals", "Food Log"  
  - Weights: "Weight Log" (gated by `showWeights` flag)

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Reduce spacing; update section title; add weight export button |
| `src/hooks/useExportData.ts` | Add `exportWeightLog` function |
| `src/lib/csv-export.ts` | Add `exportWeightLog` function with proper typing |

---

### Technical Details

**New export function in `src/lib/csv-export.ts`:**

```typescript
interface WeightSetExport {
  logged_date: string;
  created_at: string;
  exercise_key: string;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  raw_input: string | null;
}

export function exportWeightLog(sets: WeightSetExport[]) {
  const headers = ['Date', 'Time', 'Exercise', 'Sets', 'Reps', 'Weight (lbs)', 'Raw Input'];
  
  const sorted = [...sets].sort((a, b) => {
    if (a.logged_date !== b.logged_date) {
      return a.logged_date.localeCompare(b.logged_date);
    }
    return a.created_at.localeCompare(b.created_at);
  });

  const rows = sorted.map(set => [
    set.logged_date,
    format(new Date(set.created_at), 'HH:mm'),
    set.description,
    set.sets,
    set.reps,
    set.weight_lbs,
    set.raw_input || '',
  ]);

  // ... generate and download CSV
}
```

**Hook update in `src/hooks/useExportData.ts`:**
- Add `fetchAllWeightSets()` to query weight_sets table
- Add `handleExportWeightLog()` wrapper function
- Export the new function

**Settings page update:**
- Rename section title to "Export to CSV"
- Update button labels: "Food Daily Totals", "Food Log"
- Add conditional "Weight Log" button (shown when `showWeights` is true)

---

### Visual Layout

```
┌─────────────────────────────────────┐
│ ↓ Export to CSV                 ▼   │
├─────────────────────────────────────┤
│ [Food Daily Totals] [Food Log]      │
│ [Weight Log]  ← only if showWeights │
└─────────────────────────────────────┘
```

