

# Shorten "Estimated burn rate" mode label

## Problem
The third calorie target mode label "Estimated burn rate minus a deficit" gets clipped in the dropdown on mobile viewports.

## Change
Rename it to **"Estimated burn rate - deficit"** (shorter, fits the dropdown).

## Technical Detail

**File: `src/lib/calorie-target.ts` (line 47)**

Change:
```
label: 'Estimated burn rate minus a deficit'
```
to:
```
label: 'Estimated burn rate - deficit'
```

Single string change, one file.

