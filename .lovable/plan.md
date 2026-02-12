

## Move Refresh Icon Inline with Dialog Title

Place the refresh icon next to the title instead of after the chips, so it doesn't awkwardly sit on its own row.

### Change

**File: `src/components/AskTrendsAIDialog.tsx`**

1. Move the `RefreshCw` button from the chips container into the `DialogTitle` row (only visible when chips are showing -- i.e. no answer and not loading).
2. Remove the refresh button from the chips `div`.

The title line becomes:

```tsx
<DialogTitle className="text-sm font-medium flex items-center gap-1.5">
  <Sparkles className="h-4 w-4" />
  {title}
  {!data?.answer && !isPending && (
    <button
      onClick={refreshChips}
      className="ml-auto p-1 rounded-full border border-border bg-muted/50 hover:bg-muted transition-colors"
      aria-label="Refresh suggestions"
    >
      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  )}
</DialogTitle>
```

Two small edits in the same file.

