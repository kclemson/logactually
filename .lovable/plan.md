
## Store and restore chart DSL for edit flow

### Problem

When you open a pinned chart to edit it, the DSL panel is empty because the DSL was never persisted. The `saved_charts` table only stores `chart_spec` (the rendering definition), not `chart_dsl` (the v2 intent object). So when the edit dialog opens, `chartDSL` state starts as `null`, and "Show DSL" shows nothing useful.

This matters for the Refine flow too: ideally a future iteration could include the saved DSL in the refinement conversation context.

---

### Three-part fix

**1. Database — add `chart_dsl` column**

Add a nullable `jsonb` column `chart_dsl` to the `saved_charts` table. Nullable so all existing saved charts continue to work without migration data.

```sql
ALTER TABLE saved_charts ADD COLUMN IF NOT EXISTS chart_dsl jsonb;
```

**2. `useSavedCharts.ts` — persist DSL on save/update**

- Extend the `SavedChart` interface to include `chart_dsl?: unknown`
- Update `saveMutation` to accept and store an optional `chartDsl` field
- Update `updateMutation` similarly

**3. `CustomChartDialog.tsx` + `Trends.tsx` — thread DSL through the edit path**

- `CustomChartDialogProps.initialChart` gains an optional `chartDsl?: unknown` field
- On mount, `chartDSL` state is pre-populated from `initialChart.chartDsl` if present
- `handleSave` passes `chartDsl: chartDSL` to the save/update mutations
- In `Trends.tsx`, `editingChart` state type is extended to include `chartDsl?: unknown`, and when opening the edit dialog it maps `chart.chart_dsl` onto that field

---

### What this achieves

- **Edit → Show DSL**: works immediately for newly-saved charts; existing charts will populate DSL the next time they're saved/refined
- **Refine loop**: DSL is now in-memory and correctly populated from the saved version, ready for future use in refinement context
- **No data loss**: the column is nullable so all existing rows are unaffected
- **v1 charts**: `chart_dsl` will be `null` for v1 charts (they don't produce a DSL), which is correct — the debug panel for v1 already shows `chart_spec` instead

---

### Files changed

| File | Change |
|---|---|
| DB migration | Add `chart_dsl jsonb` column to `saved_charts` |
| `src/hooks/useSavedCharts.ts` | Extend type + accept/persist `chartDsl` in save/update mutations |
| `src/components/CustomChartDialog.tsx` | Accept `chartDsl` in `initialChart`; seed state on mount; pass to save |
| `src/pages/Trends.tsx` | Include `chart_dsl` from DB record when setting `editingChart` |
