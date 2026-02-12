

## Fix Dialog Border and Focus Ring on Ask AI Dialog

**Problem**: The entire Ask AI dialog has:
- A border that's too dark/barely visible in dark mode
- A thick white focus ring around the whole dialog that feels out of place

**File: `src/components/AskTrendsAIDialog.tsx` (line 108)**

Add overrides to the `DialogContent` className:

```tsx
className="left-2 right-2 top-[5%] ... sm:max-w-md border-border/50 focus-visible:ring-0 focus-visible:ring-offset-0"
```

- `border-border/50` -- softer, more visible border in dark mode (replacing the default `border` which uses `--border` at full opacity)
- `focus-visible:ring-0 focus-visible:ring-offset-0` -- removes the thick white focus ring around the dialog (dialogs don't need keyboard focus rings on the container)

One line change in one file.

