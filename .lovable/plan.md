## Fix truncated exports caused by 1000-row query limit

### Problem
`useExportData` fetches each table with a single `.select()` and no pagination. Supabase caps results at 1000 rows by default. The exercise export sorts ascending by date, so once a user has >1000 weight_sets the most recent dates silently disappear from the CSV. The same latent bug exists for food and custom log exports — it just hasn't surfaced because those users haven't crossed 1000 rows yet.

### Fix — `src/hooks/useExportData.ts`

Add a small generic pagination helper, then use it in all three fetchers (`fetchAllEntries`, `fetchAllWeightSets`, `fetchAllCustomLogEntries`) so any user can export their full history.

```ts
async function fetchAllPages<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
```

Refactor each fetcher to call `fetchAllPages`, applying its existing `.select(...).order(...)` plus `.range(from, to)`. Sort order, column lists, and the existing post-processing (food_items mapping, Number coercions for weight sets, type aliasing for custom logs) all stay identical.

### Out of scope
No UI changes; export buttons stay the same. No memory updates needed (the existing core memory already calls out the 1000-row default).