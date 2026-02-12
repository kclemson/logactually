

## Show 4 Rows of Chips by Default

**File: `src/components/AskTrendsAIDialog.tsx`** (line 130)

Increase the fixed height from `h-[4.5rem]` to `h-[9rem]` to accommodate 4 rows of chips, and increase the number of random chips picked from 4 to 8 so there's enough content to fill the space.

### Changes

1. **Line 130** -- Update container height:
```tsx
<div className="flex flex-wrap gap-1.5 items-start h-[9rem] overflow-hidden">
```
Also switch `items-center` to `items-start` so chips align to the top.

2. **Line 99** -- Pick 8 chips instead of 4:
```tsx
const [chips, setChips] = useState(() => pickRandom(pool, 8));
```

3. **Line 100** -- Update refresh to also pick 8:
```tsx
const refreshChips = () => setChips(pickRandom(pool, 8));
```

Three small edits across the same file.

