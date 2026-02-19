
## Fix: sort by `logged_date` instead of `created_at` in the by-type view

### Root cause

In `src/hooks/useCustomLogEntriesForType.ts`, the query is:

```ts
.order('created_at', { ascending: false })
```

This sorts by the database insertion timestamp, not the date the entry represents. A backdated entry (like Jan 1) that was inserted *after* a Feb 13 entry will appear above it.

### The fix

Change the order to `logged_date` descending, with `created_at` as a tiebreaker for same-day entries:

```ts
// Before
.order('created_at', { ascending: false })

// After
.order('logged_date', { ascending: false })
.order('created_at', { ascending: false })
```

For `text` / `text_multiline` types where the display date uses `created_at` (time-of-day matters), `logged_date` is still the correct primary sort key — they're always logged to today so `logged_date` will be the same for same-day entries, and `created_at` as tiebreaker handles ordering within a day correctly.

### Only file changed

`src/hooks/useCustomLogEntriesForType.ts` — one line changed in the query.
