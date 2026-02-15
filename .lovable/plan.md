
# Make "Resolve" Button Green in Admin Portal

## Change
Update the "Resolve" button color from muted gray (`text-muted-foreground`) to green (`text-green-600 dark:text-green-400`) to match the "Resolve Fixed" button styling.

## Technical details

| File | Line | Change |
|------|------|--------|
| `src/pages/Admin.tsx` | line 414 | Change `className="text-muted-foreground underline"` to `className="text-green-600 dark:text-green-400 underline"` on the "Resolve" button |

One class name change, nothing else.
