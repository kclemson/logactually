

## Fix Display Macros layout for mobile

### Problem
On the 390px viewport, three horizontal dropdowns plus the label text creates a cramped layout where the subtitle wraps excessively.

### Change
Switch from a horizontal side-by-side layout to a vertical stack: label/subtitle on top, three dropdowns stacked vertically below, each full-width within the row. "Reset to default" right-aligned below the last dropdown.

### Implementation — `src/components/settings/PreferencesSection.tsx`

Replace the current `flex items-start justify-between` wrapper (lines 212-250) with:

```tsx
{/* Display Macros */}
<div className="space-y-2">
  <div>
    <p className="text-xs text-muted-foreground">Display macros</p>
    <p className="text-[10px] text-muted-foreground/70">Customize the 3 values shown in food tables and charts</p>
  </div>
  <div className="flex flex-col gap-1.5">
    {settings.displayMacros.map((selected, slotIndex) => {
      const otherSelected = settings.displayMacros.filter((_, i) => i !== slotIndex);
      return (
        <Select key={slotIndex} value={selected} onValueChange={...}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>...</SelectContent>
        </Select>
      );
    })}
    {!isStandardMacros(settings.displayMacros) && (
      <button className="text-[10px] text-primary hover:underline self-end">
        Reset to default
      </button>
    )}
  </div>
</div>
```

Key differences from current code:
- Layout changes from horizontal (`justify-between`) to vertical (`space-y-2`)
- Dropdowns stack top-to-bottom instead of left-to-right
- Each dropdown is `w-full` instead of `w-[100px]`
- "Reset to default" stays right-aligned via `self-end`

One file, ~same line count.

