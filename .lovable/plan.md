
## Two changes in one file: fix the debug display bug + tag chips with v1/v2 routing

### Problem 1 — Debug display reads live toggle, not the engine that ran

Lines 453 and 536 both branch on `mode`, which is live UI state. When you run a query on v2, then flip the toggle to v1 without re-running, both the button label and the debug textarea content switch — giving the false impression that v1 produced the result.

**Fix**: Add a `resultMode` state variable (`"v1" | "v2" | null`, initialized to `null`). Set it alongside `setCurrentSpec` in both `handleSubmit` and `handleNewRequest`. Use `resultMode` (not `mode`) everywhere the debug display branches:

```ts
// line 453 area — button label
{resultMode === "v2" ? (showDebug ? "Hide DSL" : "Show DSL") : (showDebug ? "Hide debug JSON" : "Show debug JSON")}

// line 461 area — "Verify accuracy" button visibility
{resultMode === "v1" && ( ... )}

// line 536 area — textarea content
value={JSON.stringify(resultMode === "v2" ? chartDSL : currentSpec, null, 2)}
```

Also reset `resultMode` to `null` inside `handleNewRequest`'s atomic reset block (alongside `setCurrentSpec(null)`).

---

### Problem 2 — Chips don't route to the right engine

Each chip is a flat string. Clicking any chip uses whatever `mode` the toggle is set to. Some questions (e.g. "Calories eaten from candy or chocolate") can only be answered by v1 (AI reads raw data with natural language filtering); others are better answered by v2 (structured DSL, deterministic, no hallucination risk).

**Fix**: Replace the `ALL_CHIPS` string array with a typed `Chip` interface:

```ts
interface Chip {
  label: string;
  mode: "v1" | "v2";
}
```

**Categorization logic:**

v2-safe — the DSL can express these as structured aggregations over known columns:
- Daily fiber intake over time
- Sodium intake trend
- My highest calorie days
- Average calories by hour of day
- Which day of the week do I tend to eat the most?
- Weekly calorie average trend
- Protein per meal over time
- Calorie comparison: weekdays vs weekends
- Cardio vs strength training split
- Exercise frequency by day of week
- Which exercises do I do most often?

v1-required — needs AI to semantically interpret, join across domains, or filter by description:
- Which meals have the most calories? (meal-level grouping not in DSL)
- My most common foods (description-based grouping, richer in v1)
- Average calories on workout days vs rest days (cross-domain join)
- Average heart rate by exercise (JSONB averaging by exercise name)
- Rest days between workouts (gap/streak analysis, no DSL support)

**Routing**: `handleNewRequest` gains an optional `overrideMode?: "v1" | "v2"` parameter. When provided, it uses that mode for the request AND syncs both `setMode` and `localStorage` so the toggle reflects what actually ran (enabling free-text refinement on the same engine):

```ts
const handleNewRequest = async (question: string, overrideMode?: "v1" | "v2") => {
  const effectiveMode = overrideMode ?? mode;
  // ... atomic reset ...
  setMode(effectiveMode);
  localStorage.setItem("chart-mode", effectiveMode);
  setResultMode(effectiveMode); // set after result arrives
  const result = await generateChart.mutateAsync({ messages: freshMessages, period, mode: effectiveMode });
  // ...
};
```

Chip click:
```tsx
onClick={() => handleNewRequest(chip.label, chip.mode)}
```

**`pickFresh` / `visibleChips` / `seen` updates**: These currently use the chip string as a key. With objects, switch to `chip.label` as the key everywhere (same dedup behavior, just `chip.label` instead of `c`):

```ts
// seen tracking
picked.forEach((c) => seen.current.add(c.label));

// filter
ALL_CHIPS.filter((c) => !seen.current.has(c.label))
```

---

### What the user sees

- Chip clicks are invisible in terms of routing — no v1/v2 labels shown on chips. The toggle simply updates to reflect which engine the chip used, so any subsequent free-text refinement runs on the same engine.
- Flipping the toggle after a result is shown no longer changes the debug content or button label — those are frozen to what actually ran.
- Free-text queries continue to use whatever the toggle is set to.

---

### Files changed

| File | Lines affected | Change |
|---|---|---|
| `src/components/CustomChartDialog.tsx` | 57, 78–86, 138–175, 280–288, 453–461, 536 | Add `resultMode` state; update `ALL_CHIPS` to `Chip[]`; add `overrideMode` param to `handleNewRequest`; fix debug label and textarea to use `resultMode`; pass `chip.mode` on click |
