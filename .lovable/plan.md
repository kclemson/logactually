

## Reduce PCF Chart Grid Gap

A single-line change to see if tighter spacing prevents the subtitle from wrapping.

### Change

**File: `src/pages/Trends.tsx`** (line 768)

Change the PCF row grid gap from `gap-3` (12px) to `gap-1` (4px):

```
- <div className="grid grid-cols-3 gap-3">
+ <div className="grid grid-cols-3 gap-1">
```

This frees up 16px total across the two gutters, which should give enough room for the subtitle text to stay on one line. If it still wraps, we can also shorten the label format.

