

## Reduce Chips to 4

**File: `src/components/AskTrendsAIDialog.tsx`**

Two lines to change -- revert the chip count from 8 back to 4:

1. **Line 99**: `const [chips, setChips] = useState(() => pickRandom(pool, 4));`
2. **Line 100**: `const refreshChips = () => setChips(pickRandom(pool, 4));`

The fixed container height (`h-[10.5rem]`) stays as-is to prevent layout shifts.

