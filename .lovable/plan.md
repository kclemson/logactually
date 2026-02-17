
# Style static-mode tooltips to match equation modes

The static calorie target mode tooltips currently render plain text strings, while the other two modes get a structured grid with numbers at default size and labels in `text-[9px] italic opacity-60`. This plan brings visual consistency.

## What changes

### 1. Daily tooltip (History.tsx) -- the fallback block at lines 287-302

Replace the plain `1,583 / 1,500 cal target` text with a styled layout matching the equation modes:
- Use the same `grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums` container
- One row: number on the left (e.g., `1,500`), label on the right in `text-[9px] italic opacity-60` (`(daily calorie target)`)
- Keep the day label and dot legend above it (same as now)

### 2. Rollup tooltip (CalorieTargetRollup.tsx) -- the `targetDescription` fallback at line 109

Replace the plain `Target: 1,500 cal/day` string with a styled single-row grid matching `renderEquationBlock`:
- Same grid container styling
- One row: `1,500` on the left, `(daily calorie target)` label on the right in `text-[9px] italic opacity-60`

## Technical details

**File: `src/pages/History.tsx` (lines 287-302)**

Replace the fallback return block. Instead of:
```
<div>
  {intake} / {target} cal target
</div>
```

Render:
```
<div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
  <div className="text-right">{target.toLocaleString()}</div>
  <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
</div>
```

**File: `src/components/CalorieTargetRollup.tsx` (line 109)**

Replace `targetDescription && <div>{targetDescription}</div>` with a styled single-row grid:
```
<div className="grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums">
  <div className="text-right">{baseTarget.toLocaleString()}</div>
  <div className="text-[9px] italic opacity-60">(daily calorie target)</div>
</div>
```

The `describeCalorieTarget` function can remain for now (used in tests, possibly elsewhere), but the rollup tooltip will no longer call it.
