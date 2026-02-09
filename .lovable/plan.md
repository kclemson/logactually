

## Fix Calendar Cell Vertical Centering

### Problem

The 3-row grid inside each calendar day cell uses `items-center` (centers items within their row tracks) but lacks `content-center` (centers the row tracks themselves within the container). This causes the group of rows to sit at the bottom of the cell rather than being vertically centered.

### Solution

Add `content-center` to the button's className so the three grid rows (calories, day number, dumbbell) are centered as a group within the cell.

### File Changed

| File | Change |
|------|--------|
| `src/pages/History.tsx` | Line 197: Add `content-center` to the button className, changing `grid grid-rows-3 items-center justify-items-center` to `grid grid-rows-3 content-center items-center justify-items-center` |

Single one-word addition. No other changes needed.

