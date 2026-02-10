

## Fix: Non-Deterministic Ordering of Weight Entries

### Problem

Apple Health imports insert many entries with the same `created_at` timestamp. The `useWeightEntries` query only sorts by `created_at`, so when the query re-runs (e.g., after adding a new entry like "30m bike ride"), the database returns identically-timestamped rows in a different arbitrary order, making it look like existing entries changed values.

### Fix

Add a secondary sort on `id` in `useWeightEntries.ts` to guarantee deterministic ordering when `created_at` values are tied.

**File: `src/hooks/useWeightEntries.ts` (line 24)**

Change:
```typescript
.order('created_at', { ascending: true });
```

To:
```typescript
.order('created_at', { ascending: true })
.order('id', { ascending: true });
```

This is a one-line addition. The `id` column (UUID) is unique per row, so it breaks all ties deterministically. No other files need changes.

