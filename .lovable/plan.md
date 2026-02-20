
# Fix: Verify accuracy runs immediately when opening an existing chart

## Why `useEffect` is wrong here

The user is right. A `useEffect` that runs on mount is the wrong tool — it's hiding the real trigger, which is a concrete user event (clicking the edit button). Instead, we do the work in the event handler itself, pass the result in as a prop, and seed `useState` from it. No effect needed.

## Approach

### 1. `Trends.tsx` — extract an async `openChartForEditing` handler

Both edit triggers (inline pencil button and context menu) call `setEditingChart(...)` with the same shape. We replace them both with a single `openChartForEditing` async function that:

1. Sets `editingChart` immediately so the dialog opens (the chart spec is already available — the user sees it right away)
2. In the background, if `chart.chart_dsl` is present (v2 chart), calls `fetchChartData(supabase, chart.chart_dsl, period)` then `verifyChartData(chart.chart_spec, dt)`
3. Sets a separate piece of state `editingChartVerification` with the result
4. Passes that as `initialVerification` into `CustomChartDialog`

The dialog opens instantly. The verification result populates a moment later when the DB query resolves (same latency as the first-time generation flow).

### 2. `CustomChartDialog` — accept `initialVerification` prop and seed state

Add `initialVerification?: VerificationResult` to `CustomChartDialogProps`. Thread it through the outer wrapper to `CustomChartDialogInner`, and use it to seed `useState`:

```ts
const [verification, setVerification] = useState<VerificationResult | null>(initialVerification ?? null);
```

That's it. Because `CustomChartDialog` conditionally renders `CustomChartDialogInner` only when `open` is true (line 44-46), and `editingChart` and `editingChartVerification` are set in the same event handler, the inner component mounts with the verification already in state — or populates it shortly after if the DB query is still in flight. No `useEffect`, no mount logic.

For v1 charts (no `chartDsl`), `openChartForEditing` skips the fetch and passes `initialVerification: null` — same experience as today.

## Files changed

| File | Change |
|---|---|
| `src/pages/Trends.tsx` | Add `editingChartVerification` state; replace both `setEditingChart(...)` calls with an `openChartForEditing` async function; pass `initialVerification` to `CustomChartDialog` |
| `src/components/CustomChartDialog.tsx` | Add `initialVerification?: VerificationResult` to props interface; thread through to inner component; seed `useState` from it |

## What stays the same

- Auto-verification after every AI generation (already works, untouched)
- Verify button visibility and behaviour (untouched)
- No `useEffect` added anywhere
