

## Plan: Add Saved Item Names to `get_user_stats` RPC

### Overview
Add two new fields to the existing `get_user_stats()` RPC to support tooltips on the SF (Saved Foods) and SW (Saved Weights) columns in the admin dashboard.

---

### Database Migration

Update the `get_user_stats` function to include `saved_meal_names` and `saved_routine_names` arrays for each user.

**New fields added to the SELECT:**
```sql
-- Saved meal names (ordered by most recently used)
(
  SELECT json_agg(sm2.name ORDER BY sm2.last_used_at DESC NULLS LAST)
  FROM saved_meals sm2 
  WHERE sm2.user_id = p.id
) as saved_meal_names,

-- Saved routine names (ordered by most recently used)
(
  SELECT json_agg(sr2.name ORDER BY sr2.last_used_at DESC NULLS LAST)
  FROM saved_routines sr2 
  WHERE sr2.user_id = p.id
) as saved_routine_names
```

---

### TypeScript Changes

**File: `src/hooks/useAdminStats.ts`**

Add to `UserStats` interface:
```typescript
interface UserStats {
  // ... existing fields ...
  saved_meal_names: string[] | null;
  saved_routine_names: string[] | null;
}
```

---

### UI Changes

**File: `src/pages/Admin.tsx`**

Add tooltips to the SF and SW columns following the existing pattern for F2day/W2day:

**SF Column (lines 245-249):**
```tsx
{hasHover && (user.saved_meals_count ?? 0) > 0 && user.saved_meal_names ? (
  <Tooltip>
    <TooltipTrigger asChild>
      <td className="text-center py-0.5 pr-2 cursor-default">
        {user.saved_meals_count ?? 0}
      </td>
    </TooltipTrigger>
    <TooltipContent className="max-w-lg text-xs space-y-0.5 bg-popover text-popover-foreground border">
      {user.saved_meal_names.map((name, i) => (
        <p key={i}>• {name}</p>
      ))}
    </TooltipContent>
  </Tooltip>
) : (
  <td className={`text-center py-0.5 pr-2 ${...}`}>
    {user.saved_meals_count ?? 0}
  </td>
)}
```

**SW Column (lines 255-259):** Same pattern for `saved_routine_names`.

---

### Files to Modify

| File | Change |
|------|--------|
| Database migration | Update `get_user_stats()` to include name arrays |
| `src/hooks/useAdminStats.ts` | Add `saved_meal_names` and `saved_routine_names` to interface |
| `src/pages/Admin.tsx` | Add tooltips to SF and SW columns |

---

### Technical Notes

- Names are ordered by `last_used_at DESC NULLS LAST` so most-recently-used appear first in the tooltip
- Uses `json_agg` which returns `null` for users with no saved items (handled gracefully in UI)
- Follows exact same tooltip pattern as existing F2day/W2day columns
- No performance concern since this is admin-only and user count is small

