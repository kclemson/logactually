

## Bug: Inline trend chart shows stale data

The new `useCustomLogTrendSingle` query (key: `custom-log-trend-single`) is never invalidated by any mutation. When you delete or create an entry, the existing `onSuccess` handlers only invalidate `custom-log-entries`, `custom-log-dates`, etc. — but not the new trend query.

### Fix

Add `queryClient.invalidateQueries({ queryKey: ['custom-log-trend-single'] })` to the `onSuccess` callbacks in:

1. **`src/hooks/useCustomLogEntries.ts`** — `createEntry` (line 62), `deleteEntry` (line 108), and `updateEntry` (line 95)
2. **`src/hooks/useCustomLogEntriesForType.ts`** — `createEntry` (line 54) and `deleteEntry` (line 69)
3. **`src/pages/OtherLog.tsx`** — `updateMedEntry` (line 140)

Six one-line additions total. No other changes needed.

