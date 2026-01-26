

## Admin Page Layout Redesign

### Overview
Redesign the top stats section of the Admin page to be more scannable:
1. Replace "in last 7 days" with "RL7" (rolling 7 days)
2. Add percentages to the user sub-stats
3. Reformat the stats into a 3-column, 2-row grid layout

---

### Changes

**File: `src/pages/Admin.tsx`**

#### Change 1: Replace "in last 7 days" with "RL7" (4 places)

| Current Text | New Text |
|--------------|----------|
| "Active in last 7 days" | "Active RL7" |
| "Created in last 7 days" | "Created RL7" |
| "Created in last 7 days" (entries) | "Created RL7" |
| "Used in last 7 days" | "Used RL7" |

#### Change 2: Add percentages to user sub-stats

For sub-stats under Users, calculate and display the percentage of total users:

```text
With entries: 5 (100%)
Active RL7: 5 (100%)
Created RL7: 5 (100%)
```

Helper function to calculate percentage:
```tsx
const pct = (value: number) => 
  stats && stats.total_users > 0 
    ? Math.round((value / stats.total_users) * 100) 
    : 0;
```

#### Change 3: Reformat to 3-column, 2-row grid

**Current layout (vertical stacking with indentation):**
```text
Users: 5
    With entries: 5
    Active in last 7 days: 5
    Created in last 7 days: 5

Entries: 47
    Average per user: 9.4
    Created in last 7 days: 47

Saved Meals: 3
    Users with saved meals: 1
    Avg per user: 3
    Used in last 7 days: 1
```

**New layout (3-column grid with 2 rows):**

Row 1 (headers with totals):
```text
[Users: 5]        [Entries: 47]      [Saved Meals: 3]
```

Row 2 (sub-stats, left-justified in each column):
```text
With entries: 5 (100%)    Avg/user: 9.4         Users w/ meals: 1
Active RL7: 5 (100%)      Created RL7: 47       Avg/user: 3
Created RL7: 5 (100%)                           Used RL7: 1
```

---

### Updated Code Structure (lines 52-72)

```tsx
{/* Row 1: Headers with totals */}
<div className="grid grid-cols-3 gap-4 text-muted-foreground">
  <p className="font-medium">Users: {stats?.total_users ?? 0}</p>
  <p className="font-medium">Entries: {stats?.total_entries ?? 0}</p>
  <p className="font-medium">Saved Meals: {stats?.total_saved_meals ?? 0}</p>
</div>

{/* Row 2: Sub-stats in 3 columns */}
<div className="grid grid-cols-3 gap-4 text-muted-foreground text-sm">
  {/* Users column */}
  <div className="space-y-0.5">
    <p>With entries: {stats?.users_with_entries ?? 0} ({pct(stats?.users_with_entries ?? 0)}%)</p>
    <p>Active RL7: {stats?.active_last_7_days ?? 0} ({pct(stats?.active_last_7_days ?? 0)}%)</p>
    <p>Created RL7: {stats?.users_created_last_7_days ?? 0} ({pct(stats?.users_created_last_7_days ?? 0)}%)</p>
  </div>
  
  {/* Entries column */}
  <div className="space-y-0.5">
    <p>Avg/user: {avgEntriesPerUser}</p>
    <p>Created RL7: {stats?.entries_created_last_7_days ?? 0}</p>
  </div>
  
  {/* Saved Meals column */}
  <div className="space-y-0.5">
    <p>Users w/ meals: {stats?.users_with_saved_meals ?? 0}</p>
    <p>Avg/user: {stats?.avg_saved_meals_per_user ?? 0}</p>
    <p>Used RL7: {stats?.saved_meals_used_last_7_days ?? 0}</p>
  </div>
</div>
```

---

### Summary

| Aspect | Before | After |
|--------|--------|-------|
| "in last 7 days" text | Full phrase (4 places) | "RL7" abbreviation |
| User sub-stats | No percentages | Shows (X%) of total users |
| Layout | Vertical stacking with indentation | 3-column grid, 2 rows |
| Scannability | Low (vertical scrolling) | High (compact horizontal) |

---

### Technical Notes
- Uses `grid-cols-3` for consistent column layout
- Percentage helper function avoids division by zero
- Sub-stat columns are left-justified as requested
- Maintains existing responsive behavior (grid will stack naturally on very narrow screens if needed, but works well at all viewport widths shown)

