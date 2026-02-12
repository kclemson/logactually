

## Add Press Animation to Refresh Icon

**File: `src/components/AskTrendsAIDialog.tsx`** (line 119)

Add `active:scale-75` and a brief transition to the refresh button's className so it visually shrinks on press, giving a satisfying "click" feel:

```tsx
className="absolute right-12 top-4 p-1 rounded-full border border-border bg-muted/50 hover:bg-muted active:scale-75 transition-all duration-150"
```

Single class change on one line -- adds `active:scale-75`, changes `transition-colors` to `transition-all`, and adds `duration-150` for a snappy bounce-back.

