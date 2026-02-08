

## Add Color-Coded Columns to Admin Dashboard

### Overview

Apply blue color scheme to food-related columns and purple to weight-related columns for visual distinction, while preserving the existing green "today" indicators on F2day and W2day.

### Color Scheme

| Type | Active (> 0) | Inactive (= 0) |
|------|-------------|---------------|
| **Food** | `text-blue-500` | `text-blue-400/50` |
| **Weight** | `text-purple-500` | `text-purple-400/50` |

### Columns to Update

**User Stats Table:**
| Column | Line | Current | New |
|--------|------|---------|-----|
| F (total_entries) | 244-248 | no color / muted/50 | blue-500 / blue-400/50 |
| SF (saved_meals_count) | 254-258 | no color / muted/50 | blue-500 / blue-400/50 |
| W (total_weight_entries) | 269-273 | no color / muted/50 | purple-500 / purple-400/50 |
| SW (saved_routines_count) | 279-283 | no color / muted/50 | purple-500 / purple-400/50 |

**Daily Stats Table:**
| Column | Line | Current | New |
|--------|------|---------|-----|
| Food Logged (entry_count) | 330-331 | no color / muted/50 | blue-500 / blue-400/50 |
| Weight Logged (weight_count) | 333-336 | no color / muted/50 | purple-500 / purple-400/50 |

### Unchanged Columns

- **F2day** (line 167): Keeps `text-green-500` for today activity
- **W2day** (line 216): Keeps `text-green-500` for today activity

### Implementation Details

**File**: `src/pages/Admin.tsx`

Each cell update follows this pattern:

```typescript
// Before (F column - line 245)
className={`text-center py-0.5 pr-2 ${user.total_entries === 0 ? "text-muted-foreground/50" : ""}`}

// After
className={`text-center py-0.5 pr-2 ${user.total_entries === 0 ? "text-blue-400/50" : "text-blue-500"}`}
```

```typescript
// Before (W column - line 270)
className={`text-center py-0.5 pr-2 ${(user.total_weight_entries ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}

// After
className={`text-center py-0.5 pr-2 ${(user.total_weight_entries ?? 0) === 0 ? "text-purple-400/50" : "text-purple-500"}`}
```

### Result

- Food columns (F, SF, Food Logged) will be blue-tinted
- Weight columns (W, SW, Weight Logged) will be purple-tinted
- Today columns (F2day, W2day) retain green highlighting for at-a-glance activity tracking

