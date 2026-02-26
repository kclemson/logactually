

## Fix: Remove quotes around existing prompt in chart dialog

### Problem
When editing a chart, the prompt text (e.g. "Net daily calories trend") is displayed with literal quote marks around it: `"{lastQuestion}"`. This appears in three places in `src/components/CustomChartDialog.tsx`.

### Fix

**File: `src/components/CustomChartDialog.tsx`**

Remove the wrapping `"..."` from the `lastQuestion` display in all three locations:

| Line | Before | After |
|------|--------|-------|
| 334 | `"{lastQuestion}"` | `{lastQuestion}` |
| 354 | `"{lastQuestion}"` | `{lastQuestion}` |
| 404 | `"{lastQuestion}"` | `{lastQuestion}` |

Three lines, one file. The italic styling remains — it still looks visually distinct — just no quotes.

