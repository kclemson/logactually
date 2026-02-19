
## Fix: Sort medication entries by dose_time ascending (earliest first)

### Root cause

There are two separate data-fetching hooks, each with a sorting bug:

**By Meds view — `useAllMedicationEntries.ts`**
Line 19: `.order('dose_time', { ascending: false, nullsFirst: false })`
This sorts descending, so 5:04 PM → 3:04 PM → 8:28 AM — the latest dose appears first. It should be ascending so 8:28 AM → 3:04 PM → 5:04 PM.

**By Date view — `useCustomLogEntries.ts`**
Line 31: `.order('created_at', { ascending: true })`
This sorts all entries (including medications) by when they were inserted into the database, completely ignoring the user-entered `dose_time`. So if you log 8:28 AM retroactively after 5:04 PM, it shows up last.

### Fix

**`useAllMedicationEntries.ts`** — flip `ascending: false` → `ascending: true` on the `dose_time` order:
```ts
.order('dose_time', { ascending: true, nullsFirst: false })
.order('created_at', { ascending: true })
```

**`useCustomLogEntries.ts`** — the By Date view fetches all log types (not just medications) and the client-side grouping in `CustomLogEntriesView` handles rendering. The sort happens before grouping, so we need to sort by `dose_time` first (for medication entries), then `created_at` as a fallback:
```ts
.order('dose_time', { ascending: true, nullsFirst: false })
.order('created_at', { ascending: true })
```

`nullsFirst: false` ensures non-medication entries (which have no `dose_time`) fall back to the `created_at` sort naturally — their `dose_time` is null, so they're ordered after entries with a dose_time. Actually, since all entries within a group share the same `log_type_id` (non-meds won't have `dose_time`), `nullsFirst: false` on the primary sort combined with `created_at` secondary sort gives correct results: non-medication groups sort by when they were created, medication groups sort by dose time within each group.

### Files to change

| File | Change |
|---|---|
| `src/hooks/useAllMedicationEntries.ts` | Flip `ascending: false` → `ascending: true` on `dose_time` order; flip `created_at` to `ascending: true` |
| `src/hooks/useCustomLogEntries.ts` | Add `dose_time` as primary sort (ascending, nulls last) before `created_at` |

No component changes needed — the data arrives in the correct order and the view renders it as-is.
