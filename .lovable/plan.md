

## Fix Refresh Icon Placement -- Move Away from Close Button

The refresh icon is overlapping with the dialog's close (X) button because they're both in the top-right area.

### Change

**File: `src/components/AskTrendsAIDialog.tsx`**

Add `mr-5` to the refresh button so it sits to the left of the close button with adequate spacing:

```tsx
className="ml-auto mr-5 p-1 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors"
```

Single class addition, one line.

