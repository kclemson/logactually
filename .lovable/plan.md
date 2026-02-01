

## Empty Results Warning (Both Pages) + Data Cleanup

Prevent "ghost entries" when users log content on the wrong page by detecting empty AI results and showing a warning instead of silently saving.

---

### Overview

| Aspect | Details |
|--------|---------|
| Problem | Logging exercise on Food page (or food on Weights page) saves an entry with zero items - invisible in UI |
| Solution | Detect empty results in analyze hooks, return warning instead of null, display in both pages |
| Pattern | Add `warning` state to analyze hooks - reusable for future log types (books, movies, etc.) |
| Cleanup | Delete 4 existing ghost entries from food_entries table |

---

### Design: Future-Proof Pattern

Both `useAnalyzeFood` and `useAnalyzeWeights` already share identical structure:
- `isAnalyzing` state
- `error` state  
- Returns `result | null`

Adding `warning` state follows the same pattern. When we add new log types (books, movies, period tracker), each `useAnalyze[Type]` hook will include the same three states: `isAnalyzing`, `error`, `warning`.

The consuming pages already have identical UI patterns for error display:
```tsx
{analyzeError && (
  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
    Analysis failed: {analyzeError}
  </div>
)}
```

The warning display will follow the same pattern, making it trivial to copy-paste for future log types.

---

### Technical Changes

#### 1. Add Warning State to useAnalyzeFood

**File: `src/hooks/useAnalyzeFood.ts`**

| Change | Details |
|--------|---------|
| Add state | `const [warning, setWarning] = useState<string \| null>(null);` |
| Clear on request | `setWarning(null);` at start of analyze |
| Check empty | After successful parse, if `food_items.length === 0`, set warning and return null |
| Return | Add `warning` to return object |

```typescript
// After successful parse
if (data.food_items.length === 0) {
  setWarning("No food items detected. If this is exercise, try the Weights page.");
  return null;
}
setWarning(null); // Clear any previous warning on success
```

---

#### 2. Add Warning State to useAnalyzeWeights

**File: `src/hooks/useAnalyzeWeights.ts`**

| Change | Details |
|--------|---------|
| Add state | `const [warning, setWarning] = useState<string \| null>(null);` |
| Clear on request | `setWarning(null);` at start of analyze |
| Check empty | After successful parse, if `exercises.length === 0`, set warning and return null |
| Return | Add `warning` to return object |

```typescript
// After successful parse
if (data.exercises.length === 0) {
  setWarning("No exercises detected. If this is food, try the Food page.");
  return null;
}
setWarning(null); // Clear any previous warning on success
```

---

#### 3. Display Warning in FoodLog

**File: `src/pages/FoodLog.tsx`**

Extract `warning` from hook and display below error:

```typescript
const { analyzeFood, isAnalyzing, error: analyzeError, warning: analyzeWarning } = useAnalyzeFood();

// In JSX, after existing error block (line ~483):
{analyzeWarning && (
  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
    {analyzeWarning}
  </div>
)}
```

---

#### 4. Display Warning in WeightLog

**File: `src/pages/WeightLog.tsx`**

Extract `warning` from hook and display below error:

```typescript
const { analyzeWeights, isAnalyzing, error: analyzeError, warning: analyzeWarning } = useAnalyzeWeights();

// In JSX, after existing error block (line ~325):
{analyzeWarning && (
  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mt-3">
    {analyzeWarning}
  </div>
)}
```

---

#### 5. Database Cleanup

Delete the 4 ghost entries:

| Date | Raw Input |
|------|-----------|
| 2026-02-01 | `.7 miles on the treadmill in 11:25` |
| 2026-02-01 | `.8 miles on treadmill in 11:40` (x2) |
| 2026-01-29 | `Just testing my voice to make sure it works` |

```sql
DELETE FROM food_entries 
WHERE id IN (
  '13e8d822-c5e2-4baa-9cae-29d6d28b1f31',
  '3767e715-610d-4e86-b955-0c8e2061629a',
  '1de62f34-e31e-4269-87b7-04ab26f16b17',
  '474c10d8-1b4b-4b62-869e-365d1294d56a'
);
```

---

### Summary

| Step | File | Change |
|------|------|--------|
| 1 | `useAnalyzeFood.ts` | Add `warning` state, check for empty `food_items` |
| 2 | `useAnalyzeWeights.ts` | Add `warning` state, check for empty `exercises` |
| 3 | `FoodLog.tsx` | Extract and display `warning` |
| 4 | `WeightLog.tsx` | Extract and display `warning` |
| 5 | Database | Delete 4 ghost entries |

---

### Future Extensibility

When adding `useAnalyzeBooks`, `useAnalyzeMovies`, etc., each hook will follow the same pattern:

```typescript
export function useAnalyze[Type]() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);  // Standard pattern
  
  // ... analyze logic ...
  
  if (data.items.length === 0) {
    setWarning("No [type] detected. Try the [correct] page.");
    return null;
  }
  
  return { analyze[Type], isAnalyzing, error, warning };
}
```

The consuming pages will all use the same UI pattern for displaying warnings - copy-paste friendly.

