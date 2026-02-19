

## Show "matched exactly" when all values have zero delta

### Problem
When 28/28 values match with delta=0 (as in the sodium screenshot), the summary still says "within 1% or 5 units" -- this undersells a perfect result and doesn't distinguish between exact matches and tolerance-based matches.

### Fix

**Two changes in one file each:**

#### 1. `src/lib/chart-verification.ts` -- add an `allExact` flag to `VerificationResult`

- Add `allExact?: boolean` to the `VerificationResult` interface
- In `verifyDeterministic`, after building `allComparisons`, check if every matched comparison has `delta === 0`. If so, set `allExact: true`.
- Do the same in `verifyDaily` and `verifyAggregate` for consistency.

#### 2. `src/components/CustomChartDialog.tsx` -- use the flag in the summary line

- Change the summary text from:
  `"{matched}/{total} AI values matched your logs ({toleranceLabel})"`
- To conditionally show:
  - **When `allExact` is true and all matched:** `"{matched}/{total} AI values matched your logs exactly"`
  - **Otherwise:** keep the current tolerance label

This is a small, surgical change -- one new boolean field computed from existing data, one conditional string in the UI.

### Technical details

In `chart-verification.ts`, after the comparison loop in each verify function, add:
```typescript
const allExact = matched === total && allComparisons.every(c => c.delta === 0);
```
Then include `allExact` in the returned object.

In `CustomChartDialog.tsx` line 389, change the summary `<p>` to:
```tsx
<p className="font-medium">
  {verification.matched}/{verification.total} AI values matched your logs{" "}
  {verification.allExact ? "exactly" : `(${verification.toleranceLabel || "within 1% or 5 units"})`}
</p>
```
