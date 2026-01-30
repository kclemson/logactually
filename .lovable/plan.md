

## Add Blue Background to CollapsibleSection Headers

### Change

**File: `src/components/CollapsibleSection.tsx`**

Update the header button styling to include a subtle blue background:

```tsx
// Line 52-57: Change from:
<button
  type="button"
  onClick={handleToggle}
  aria-expanded={isOpen}
  className="flex items-center gap-2 font-semibold text-foreground transition-colors"
>

// To:
<button
  type="button"
  onClick={handleToggle}
  aria-expanded={isOpen}
  className="flex items-center gap-2 px-2 py-1.5 -ml-2 rounded-md font-semibold text-foreground bg-[hsl(217_91%_60%/0.08)] transition-colors"
>
```

### What's changing

| Property | Before | After |
|----------|--------|-------|
| Background | None | `hsl(217 91% 60% / 8%)` — subtle blue tint |
| Padding | None | `px-2 py-1.5` — breathing room |
| Margin | None | `-ml-2` — align text with content below |
| Border radius | None | `rounded-md` — soft corners |

### Visual result

The section headers (Account, Saved Meals, Preferences, etc.) will have a very subtle blue wash behind them, distinguishing them from the white action rows beneath while staying cohesive with the app's blue accent system.

