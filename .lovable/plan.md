
# Fix: Add timeout to prevent "Generating..." hanging forever

## What changes

One file only: `src/hooks/useGenerateChart.ts`.

Add a small `withTimeout` helper at the top of the file, then wrap each network call in the mutation:

- `generate-chart-dsl` invoke → 25s timeout
- `fetchChartData` → 15s timeout
- v1 fallback `generate-chart` invoke → 30s timeout
- multi-option `fetchChartData` calls inside `Promise.all` → 15s each

When a timeout fires, the promise rejects with a clear message ("Chart schema generation timed out after 25s. Please try again."), TanStack Query sets `isPending = false`, the error surfaces in the dialog, and the overlay clears.

## The helper

```ts
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s. Please try again.`)), ms)
    ),
  ]);
}
```

## Files changed

| File | Change |
|---|---|
| `src/hooks/useGenerateChart.ts` | Add `withTimeout` helper; wrap all network calls (DSL invoke, fetchChartData, v1 invoke) in timeouts |
