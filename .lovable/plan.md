
## Add Saved Meals/Routines Columns to Admin User Table

### Overview
Add columns showing saved meals and saved routines count per user, while making the username display more compact.

---

### Changes Required

#### 1. Database Function Update
**Update `get_user_stats` to include saved meals/routines counts**

```sql
-- Add to the SELECT in get_user_stats function
COUNT(DISTINCT sm.id) as saved_meals_count,
COUNT(DISTINCT sr.id) as saved_routines_count

-- Add LEFT JOINs
LEFT JOIN saved_meals sm ON p.id = sm.user_id
LEFT JOIN saved_routines sr ON p.id = sr.user_id
```

#### 2. TypeScript Interface Update
**File:** `src/hooks/useAdminStats.ts`

Add to `UserStats` interface:
```tsx
saved_meals_count: number;
saved_routines_count: number;
```

#### 3. Admin Page UI Updates
**File:** `src/pages/Admin.tsx`

**Username display logic change:**
```tsx
// Before
User {user.user_number}
{USER_NAMES[user.user_number] && ` (${USER_NAMES[user.user_number]})`}

// After - use name if available, otherwise "User X"
{USER_NAMES[user.user_number] ?? `User ${user.user_number}`}
```

**Add two new columns:**
- Header: "SM" (Saved Meals) and "SR" (Saved Routines)
- Cells: `{user.saved_meals_count}` and `{user.saved_routines_count}`

---

### Column Width Savings
- "User 1 (KC)" → "KC" saves ~7 characters per row
- "User 10 (Jenny)" → "Jenny" saves ~9 characters per row
- Unknown users remain "User X" (no change in width for those)

### New Table Structure
| User | Food Logged | Food Today | Weight Logged | Weight Today | SM | SR | Last Active |
|------|-------------|------------|---------------|--------------|----|----|-------------|
| KC   | 44          | 4          | 82            | 10           | 5  | 2  | Jan 28      |

---

### Files to Modify
1. **Database migration** - Update `get_user_stats` function
2. **`src/hooks/useAdminStats.ts`** - Add new fields to interface
3. **`src/pages/Admin.tsx`** - Update username display + add columns
