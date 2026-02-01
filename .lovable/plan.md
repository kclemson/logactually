

## Filter Results Table by Test Type

Replace `displayResults` with the already-defined `filteredResults` in three locations so the table only shows relevant items based on the selected test type.

---

### Root Cause

The `getFilteredResults()` function (lines 348-357) already filters results correctly:
- **Food mode**: Shows results with `food_items` in output
- **Weights mode**: Shows results with `exercises` in output

However, the table rendering still uses `displayResults` (unfiltered) instead of `filteredResults`.

---

### Technical Changes

**File: `src/components/DevToolsPanel.tsx`**

| Line | Current | Change To |
|------|---------|-----------|
| 471 | `displayResults.length > 0` | `filteredResults.length > 0` |
| 555 | `displayResults.map((result, i) =>` | `filteredResults.map((result, i) =>` |
| 739 | `displayResults.map((result, i) =>` | `filteredResults.map((result, i) =>` |

---

### Result

- Switching to **Food** mode shows only results with `food_items` data
- Switching to **Weights** mode shows only results with `exercises` data
- Results with errors are shown in both modes (preserved by the filter logic)

