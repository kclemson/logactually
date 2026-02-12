

## Two Small Tweaks to Ask AI Dialog

**File: `src/components/AskTrendsAIDialog.tsx`**

### 1. Increase chips container height (line 130)

Bump from `h-[9rem]` to `h-[10.5rem]` so chips aren't clipped by the textarea below:

```tsx
<div className="flex flex-wrap gap-1.5 items-start h-[10.5rem] overflow-hidden">
```

### 2. Break checkbox label after "answer" (around line 158)

Split the label text so the parenthesized stats appear on their own line:

```tsx
<span className="text-xs text-muted-foreground leading-tight">
  Include my personal stats for a more personalized answer
  <br />
  ({profileSummary})
</span>
```

Two small edits, same file.

