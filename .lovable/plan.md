

## Add Refresh Icon to Suggestion Chips

**File: `src/components/AskTrendsAIDialog.tsx`**

1. Add `RefreshCw` to the `lucide-react` import.
2. Replace `chips` from `useMemo` to `useState` (initialized via `pickRandom`), and memoize the `pool` separately.
3. Add a `refreshChips` handler that re-rolls with `setChips(pickRandom(pool, 4))`.
4. Append a small `RefreshCw` icon button at the end of the chips flex container.

### Technical detail

```tsx
// 1. Import
import { Loader2, Sparkles, RefreshCw } from "lucide-react";

// 2. Replace useMemo chips with useState + memoized pool
const pool = useMemo(() => [...SHARED_PROMPTS, ...(mode === "food" ? FOOD_PROMPTS : EXERCISE_PROMPTS)], [mode]);
const [chips, setChips] = useState(() => pickRandom(pool, 4));
const refreshChips = () => setChips(pickRandom(pool, 4));

// 3. Add refresh button after the chip buttons
<div className="flex flex-wrap gap-1.5 items-center">
  {chips.map(...)}
  <button
    onClick={refreshChips}
    className="p-1 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors"
    aria-label="Refresh suggestions"
  >
    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
  </button>
</div>
```

Single file change.

