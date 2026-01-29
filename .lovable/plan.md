

## Refine Duplicate Exercise Prompt UI

### Overview

Tone down the duplicate exercise prompt to feel like a natural part of the charts UI rather than an alarming warning. Match the typography of chart titles/subtitles and remove the yellow warning styling.

---

### Current vs. Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| Border | Yellow warning border | No border (like chart cards) |
| Background | `bg-warning/10` (yellow tint) | `bg-muted/30` (subtle gray) |
| Icon | AlertTriangle (warning) | None |
| Title size | `text-sm font-medium` | `text-xs font-semibold` (matches ChartTitle) |
| Subtitle size | `text-xs` | `text-[10px]` (matches ChartSubtitle) |
| Overall feel | Alarming | Informational, blends with charts |

---

### File to Modify

**`src/components/DuplicateExercisePrompt.tsx`**

**Changes:**

1. Remove the `AlertTriangle` import and icon
2. Change card styling from warning to subtle:
   - `border-warning bg-warning/10` → `border-0 shadow-none bg-muted/30`
3. Match chart typography:
   - Title: `text-sm font-medium text-warning-foreground` → `text-xs font-semibold`
   - Subtitle: `text-xs text-muted-foreground` → `text-[10px] text-muted-foreground`
4. Adjust padding to be more compact (like chart cards)
5. Make buttons even smaller/subtler

**Updated component structure:**

```tsx
<Card className="border-0 shadow-none bg-muted/30 rounded-md">
  <CardContent className="p-2">
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold">
        {totalDuplicates === 1 
          ? "1 exercise may have duplicates"
          : `${totalDuplicates} exercises may have duplicates`
        }
      </p>
      <p className="text-[10px] text-muted-foreground truncate">
        "{firstGroup.winner.description}" appears under {firstGroup.exercises.length} entries
      </p>
      <div className="flex gap-2 mt-1">
        <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2">
          <Merge className="h-3 w-3 mr-1" />
          {isPending ? "Merging..." : "Merge"}
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2">
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### Multiple Duplicates Behavior

Currently, when multiple duplicate groups exist:
- Shows "N exercises may have duplicates" in the title
- Shows details for the first group only
- "Merge" button only acts on the first group

**Enhanced approach for multiple duplicates:**

When there are multiple groups, show them in a stacked list so users can address each one:

```tsx
{groups.map((group, index) => (
  <div key={group.description} className="flex items-center justify-between gap-2">
    <p className="text-[10px] text-muted-foreground truncate flex-1">
      "{group.winner.description}" ({group.exercises.length} entries)
    </p>
    <Button size="sm" variant="secondary" className="h-5 text-[10px] px-2 shrink-0">
      Merge
    </Button>
  </div>
))}
```

This way each duplicate group has its own inline merge button, and when merged, it disappears from the list.

---

### Summary

| Change | Details |
|--------|---------|
| Remove warning styling | No yellow border/background, no warning icon |
| Match typography | Use `text-xs font-semibold` for title, `text-[10px]` for subtitle |
| Compact layout | Smaller padding (`p-2`), smaller buttons (`h-6`) |
| Multiple duplicates | Show each group with its own merge button in a list |

The result will feel like a natural extension of the charts section rather than an alarming alert.

