

## Center Refresh Icon Between Title and Close Button

**File: `src/components/AskTrendsAIDialog.tsx`**

The refresh icon is currently pushed right next to the X via `ml-auto mr-5`. To visually center it in the gap between the title text and the close button, remove `ml-auto` and position it absolutely so it sits at roughly the midpoint of the available space.

**Approach**: Use absolute positioning on the refresh button so it floats independently of the title text width. Place it at approximately `right-12 top-4` (the X is at `right-4 top-4`), which puts clear space on both sides.

### Change (line 118)

Replace:
```tsx
className="ml-auto mr-5 p-1 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors"
```

With:
```tsx
className="absolute right-12 top-4 p-1 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors"
```

This pulls the icon out of the flex flow and places it to the left of the X with even spacing, regardless of title length. Single class change, one line.

