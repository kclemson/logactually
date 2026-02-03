

## Improve Admin Page Tooltip Formatting

### Overview
Update the F2day (food) and W2day (weight) tooltips in the admin user stats table to be wider and use a consistent `→` format showing what was logged as what.

---

### Changes

**1. Widen both tooltips** (`src/pages/Admin.tsx`)

Change `max-w-xs` (320px) to `max-w-lg` (512px) for both tooltips to prevent wrapping.

**2. Update food tooltip format** (lines 163-172)

Current format:
```
"200 g nonfat Greek yogurt"
• Nonfat Greek Yogurt
```

New format using `→`:
```
"200 g nonfat Greek yogurt" → Nonfat Greek Yogurt
```

When there are multiple items from one entry, show each on its own line with the arrow format:
```
"yogurt and granola" → Nonfat Greek Yogurt
"yogurt and granola" → Honey Almond Granola
```

For entries without `raw_input`, fallback to bullet format: `• Item Name`

---

### Implementation Details

**Food tooltip (lines 163-172)**

Replace the current structure with:
```tsx
<TooltipContent className="max-w-lg text-xs space-y-1 bg-popover text-popover-foreground border whitespace-nowrap">
  {user.food_today_details.map((entry, i) => (
    <div key={i}>
      {entry.items?.map((item, j) => (
        <p key={j}>
          {entry.raw_input ? (
            <>
              <span className="italic text-muted-foreground">"{entry.raw_input}"</span> → {item}
            </>
          ) : (
            <>• {item}</>
          )}
        </p>
      ))}
    </div>
  ))}
</TooltipContent>
```

**Weight tooltip (lines 188-198)**

Update width class:
```tsx
<TooltipContent className="max-w-lg text-xs space-y-1 bg-popover text-popover-foreground border whitespace-nowrap">
```

---

### Visual Result

| Before | After |
|--------|-------|
| "200 g nonfat Greek yogurt"<br>• Nonfat Greek Yogurt | "200 g nonfat Greek yogurt" → Nonfat Greek Yogurt |
| Multi-line wrapping text | Single row per item, wider tooltip |

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Widen tooltips to `max-w-lg`, add `whitespace-nowrap`, update food tooltip to use `→` format |

