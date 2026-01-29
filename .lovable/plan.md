

## Refine Duplicate Exercise Prompt - Better Layout and Context

### Overview

Redesign the prompt to feel more integrated with the charts UI and provide meaningful context about what's being merged - showing session counts and date ranges for each duplicate chart.

---

### Current Issues

1. X button feels disconnected (top-right corner, no visual boundary)
2. Merge button too far right, disconnected from content
3. Text is mechanical - "2 entries" doesn't help user understand what they're merging
4. Header "1 exercise may have duplicates" is generic and doesn't add value

---

### Proposed Layout

For each duplicate group:

```text
Diverging Low Row
Found in 2 charts: 8 sessions (Dec 21 - Jan 29), 1 session (Dec 15)
[Merge into one chart]  [×]
```

Key changes:
- Exercise name as the title (like chart titles)
- Descriptive subtitle showing what each chart contains
- Buttons grouped together on same line, closer to content
- Remove the generic header entirely

---

### Data Available

From `ExerciseTrend` we have access to:
- `sessionCount` - unique dates (what we show as "X sessions")
- `weightData[].date` - can derive date range (first/last date)

---

### File to Modify

**`src/components/DuplicateExercisePrompt.tsx`**

**Changes:**

1. Remove the header row ("1 exercise may have duplicates")
2. For each group, show:
   - Exercise name as title (`text-xs font-semibold`)
   - Descriptive subtitle with session counts and date ranges
   - Action buttons grouped on same line below
3. Add helper function for date formatting
4. Change dismiss to per-group (so users can selectively ignore)

**Updated structure:**

```tsx
import { format, parseISO } from "date-fns";

const formatChartInfo = (exercises: ExerciseTrend[]) => {
  return exercises.map(ex => {
    const dates = ex.weightData.map(d => d.date);
    const firstDate = parseISO(dates[0]);
    const lastDate = parseISO(dates[dates.length - 1]);
    
    const dateStr = dates.length === 1 || dates[0] === dates[dates.length - 1]
      ? format(firstDate, 'MMM d')
      : `${format(firstDate, 'MMM d')} - ${format(lastDate, 'MMM d')}`;
    
    const sessionWord = ex.sessionCount === 1 ? 'session' : 'sessions';
    return `${ex.sessionCount} ${sessionWord} (${dateStr})`;
  }).join(', ');
};

// Inside component:
<Card className="border-0 shadow-none bg-muted/30 rounded-md">
  <CardContent className="p-2">
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.description} className="flex flex-col gap-1">
          {/* Exercise name as title */}
          <p className="text-xs font-semibold leading-tight">
            {group.winner.description}
          </p>
          
          {/* Descriptive context */}
          <p className="text-[10px] text-muted-foreground">
            Found in {group.exercises.length} charts: {formatChartInfo(group.exercises)}
          </p>
          
          {/* Action buttons - grouped together */}
          <div className="flex items-center gap-2 mt-0.5">
            <Button 
              size="sm" 
              variant="secondary"
              className="h-5 text-[10px] px-2"
              onClick={() => onMerge(group)}
              disabled={isPending}
            >
              <Merge className="h-2.5 w-2.5 mr-1" />
              Merge into one chart
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={() => onDismissGroup(group.description)}
              disabled={isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

---

### Example Output

**Single duplicate:**
```
Diverging Low Row
Found in 2 charts: 8 sessions (Dec 21 - Jan 29), 1 session (Dec 15)
[Merge into one chart]  [×]
```

**Multiple duplicates:**
```
Diverging Low Row
Found in 2 charts: 8 sessions (Dec 21 - Jan 29), 1 session (Dec 15)
[Merge into one chart]  [×]

Lat Pulldown
Found in 2 charts: 5 sessions (Nov 19 - Jan 10), 2 sessions (Jan 23)
[Merge into one chart]  [×]
```

---

### Per-Group Dismiss

To support dismissing individual groups, we'll need to update how dismiss works:

1. Change `onDismiss: () => void` to `onDismiss: (description: string) => void`
2. In `Trends.tsx`, update localStorage to store an array of dismissed descriptions instead of a boolean
3. Filter `duplicateGroups` to exclude dismissed ones

This lets users keep some duplicates separate intentionally while merging others.

---

### Summary

| Change | Details |
|--------|---------|
| Remove generic header | No more "1 exercise may have duplicates" |
| Exercise name as title | Use the actual exercise name prominently |
| Rich context | Show session counts and date ranges per chart |
| Grouped buttons | Merge + dismiss on same line, close to content |
| Per-group dismiss | Allow selective dismissal of individual duplicates |
| Date formatting | Add `format`, `parseISO` from date-fns |

