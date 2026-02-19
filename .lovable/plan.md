
## Add CSV Export for Custom Logs

### What this builds

A "Custom Logs" export button in Settings > Import and Export. Visible only when custom logging is enabled AND the user has at least one custom log type created. Sorted newest-first (matching food and exercise exports). Blood Pressure columns (Systolic, Diastolic, Reading) are included only when the user's data actually contains a BP entry.

---

### CSV column design

**Without Blood Pressure data:**
```
Date, Time, Log Type, Value, Unit
```

**With Blood Pressure data (at least one dual_numeric row):**
```
Date, Time, Log Type, Value, Systolic, Diastolic, Reading, Unit
```

- **Value** — `numeric_value` for numeric types; `text_value` for text/multiline types; empty for BP rows.
- **Systolic / Diastolic / Reading** — included in the header only if `hasBP`; populated only for BP rows.
- **Unit** — the unit stored on the entry (e.g. `lbs`, `hrs`, `mmHg`).
- Sorted newest-first by `logged_date` then `created_at` — matching food and exercise exports.

Filename: `custom-log-YYYY-MM-DD.csv`

---

### Files changed

**1. `src/lib/csv-export.ts`** — add `CustomLogExportRow` and `exportCustomLog`

```ts
export interface CustomLogExportRow {
  logged_date: string;
  created_at: string;
  log_type_name: string;
  value_type: string;
  numeric_value: number | null;
  numeric_value_2: number | null;
  text_value: string | null;
  unit: string | null;
}

export function exportCustomLog(rows: CustomLogExportRow[]) {
  // Sort newest-first (matching food/exercise)
  const sorted = [...rows].sort((a, b) => {
    if (a.logged_date !== b.logged_date) return b.logged_date.localeCompare(a.logged_date);
    return b.created_at.localeCompare(a.created_at);
  });

  const hasBP = sorted.some(r => r.value_type === 'dual_numeric');
  const headers = hasBP
    ? ['Date', 'Time', 'Log Type', 'Value', 'Systolic', 'Diastolic', 'Reading', 'Unit']
    : ['Date', 'Time', 'Log Type', 'Value', 'Unit'];

  // rows mapped accordingly...
  downloadCSV(csv, `custom-log-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}
```

**2. `src/hooks/useExportData.ts`** — add `handleExportCustomLog`

Fetches custom log entries joined with their log type for `name` and `value_type`. No need to specify sort order on the query since `exportCustomLog` sorts in memory (same pattern as `exportFoodLog` which also re-sorts after fetching):

```ts
const { data } = await supabase
  .from('custom_log_entries')
  .select('logged_date, created_at, numeric_value, numeric_value_2, text_value, unit, custom_log_types(name, value_type)')
  .order('logged_date', { ascending: false })
  .order('created_at', { ascending: false });
```

Returns `exportCustomLog` alongside the existing `exportFoodLog` and `exportWeightLog`.

**3. `src/components/settings/ImportExportSection.tsx`** — add conditional button

Two new props: `showCustomLogs: boolean` and `hasCustomLogTypes: boolean`. When both are true and not read-only, renders:

```
Export custom logs to CSV    [Custom Logs]
```

**4. `src/pages/Settings.tsx`** — thread props down

Calls `useCustomLogTypes()` (already cached by React Query since `CustomLogTypesSection` uses it — zero extra network cost) and passes:
- `showCustomLogs={settings.showCustomLogs}`
- `hasCustomLogTypes={logTypes.length > 0}`

---

### What does NOT change

- No database migrations needed
- No new dependencies
- Food and exercise log exports untouched
- `dual_numeric` detection uses `value_type` field — robust regardless of unit wording
