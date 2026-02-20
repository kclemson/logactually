
# Four improvements: verify at edit time, auto-verify v2, usage logging, boot log clarification

## Issue 1 — "Verify accuracy" missing in edit mode

**Root cause**: In `CustomChartDialog.tsx`, the `Verify accuracy` button is conditionally rendered only when `resultMode === "v1"` (line 482). When the dialog opens in edit mode (`initialChart` is set), `resultMode` is initialized to `null` — it only gets set after a new generation. So even though the chart being edited was a v1 chart with verification data, `resultMode` is `null` and the button never appears.

**Fix**: Initialize `resultMode` from the saved chart's metadata. The saved chart's `chartDsl` field is null for v1 charts and populated for v2 charts. We can use that to set the initial `resultMode`:

```typescript
const [resultMode, setResultMode] = useState<"v1" | "v2" | null>(
  () => initialChart ? (initialChart.chartDsl ? "v2" : "v1") : null
);
```

This correctly infers: if we're editing a chart that has no DSL, it was a v1 chart → show the verify button. If it has a DSL, it was v2.

There's a secondary problem: `dailyTotals` is also `null` on open, so clicking "Verify accuracy" will hit the `"unavailable"` branch. The verify button's on-click handler already handles this gracefully with the message "No daily totals available (try regenerating the chart)". That is acceptable behavior for edit mode — the user can refine/regenerate to get fresh data and then verify. No change needed to that logic.

**File**: `src/components/CustomChartDialog.tsx` — change the `useState` initializer for `resultMode`.

---

## Issue 2 — Auto-verification for v2 charts

The user asks whether verification could be run automatically after v2 chart generation, to build user confidence. This is a good idea with a specific nuance: the v2 DSL engine is fully deterministic (no AI hallucination risk for the data), so the "Verify accuracy" concept shifts from "did the AI compute the right numbers?" to "does the chart DSL produce results consistent with an independent check?".

**Proposed behavior**:
- For **v1 charts**: keep the existing on-demand "Verify accuracy" button (unchanged). Verification runs against `dailyTotals` returned from the server.
- For **v2 charts**: automatically run verification immediately after chart generation, but use the v2 `dailyTotals` fetched client-side. Display the result below the chart without requiring a button click. The "Show DSL" / "Hide DSL" button still exists for debugging. No separate "Verify accuracy" button is needed for v2 since it runs automatically.

**How v2 verification works**: `verifyChartData` in `src/lib/chart-verification.ts` already accepts `(chartSpec, dailyTotals)` and works for any chart. The `dailyTotals` from `fetchChartData` is in the same format the v2 result carries. So we can call `verifyChartData(result.chartSpec, result.dailyTotals)` for v2 the same way we do for v1.

The current code at line 137 explicitly skips verification for v2:
```typescript
setVerification(actualMode === "v2" ? null : verifyChartData(...))
```

**Fix**: Remove that guard — always run verification:
```typescript
setVerification(verifyChartData(result.chartSpec, result.dailyTotals));
```

This applies in both `handleSubmit` and `handleNewRequest`. The UI rendering section already shows the verification result whenever `verification` is non-null, so it will appear automatically for v2 charts too.

For **v2 charts**, the verification result will typically say something like "6/6 matched" with high accuracy since the DSL engine is deterministic. This actually gives the user a positive signal: "your data was computed deterministically and cross-checked." That's the confidence boost.

For the edge case where v2 verification hits a chart type that can't be verified (e.g. a derived percentage metric), `verifyChartData` already returns `{ status: "unavailable" }` which renders as a neutral grey box — still a non-alarming outcome.

**File**: `src/components/CustomChartDialog.tsx` — remove the `actualMode === "v2" ?` guard in both `handleSubmit` and `handleNewRequest`.

---

## Issue 3 — Usage logging for generate-chart and generate-chart-dsl

Following the same pattern as `ask-trends-ai` (which logs `[dev] exercise: "..."` or `[user] exercise: "..."`), we want a single line per request showing who called it and what they asked.

**Pattern from ask-trends-ai**:
```typescript
const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
const tag = isAdmin ? '[dev]' : '[user]';
console.info(`${tag} exercise: "${question}"`);
```

**For generate-chart** (`supabase/functions/generate-chart/index.ts`):
- After auth validation, extract `userId` from claims
- Call `has_role` RPC to determine dev vs user
- Log: `[dev] generate-chart v1: "Daily fiber intake" (30d)` or `[user] generate-chart v1: "..." (30d)`
- Remove the existing verbose `generate_chart args:` log at line 460 (it dumps 2000 chars of JSON per request — not useful for usage tracking)

**For generate-chart-dsl** (`supabase/functions/generate-chart-dsl/index.ts`):
- After auth validation, extract `userId` from claims (it has `claimsData.claims` already)
- Call `has_role` RPC to determine dev vs user  
- Log: `[dev] generate-chart-dsl: "Average heart rate by exercise" (30d) → DSL` or `→ unsupported` or `→ options(2)`
- The outcome suffix tells us at a glance whether the AI returned a valid DSL, fell back with unsupported, or returned a disambiguation options list
- Keep the existing `generate-chart-dsl result:` line as-is (it's useful for debugging the DSL shape), or trim it slightly

The `userId` is already available in both functions from `claimsData.claims.sub`.

**Files**: 
- `supabase/functions/generate-chart/index.ts`
- `supabase/functions/generate-chart-dsl/index.ts`

---

## Issue 4 — Boot/listening/shutdown logs

These are emitted by the **Supabase edge function runtime** (Deno Deploy), not by application code. They appear as:
- `booted (time: 29ms)`
- `Listening on http://localhost:9999/`

There is no way to suppress them — they are infrastructure-level events outside of the function code. This is a known limitation of the Supabase edge function log viewer and is not something we can change.

The best mitigation is to use more distinctive log lines in application code so they're easier to visually scan past — which the logging improvements in Issue 3 will help with.

---

## Files changed

| File | Change |
|---|---|
| `src/components/CustomChartDialog.tsx` | Initialize `resultMode` from `initialChart?.chartDsl` so the verify button appears in edit mode; remove `v2` guard so verification runs automatically for both v1 and v2 results |
| `supabase/functions/generate-chart/index.ts` | Add `[dev]`/`[user]` usage log after auth; remove the verbose `generate_chart args:` JSON dump |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `[dev]`/`[user]` usage log with outcome suffix (DSL / unsupported / options) after auth |
