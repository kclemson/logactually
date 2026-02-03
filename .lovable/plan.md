

## Fix Admin Tooltip Formatting and Saved Item Display

### Issues

1. **Wrapping/repetition**: Items from saved routines show `"From saved routine" → Leg Curl` repeated on each line unnecessarily
2. **Saved meal identification**: Entries from saved meals (no raw_input) show only bullets with no context about which saved meal they came from

---

### Solution

**Database Changes**: Update `get_user_stats` function to include the saved meal/routine name in the tooltip data

**Frontend Changes**: Update tooltip display logic with special handling for saved items

---

### Database Migration

Update the subqueries in `get_user_stats` to join with saved_meals/saved_routines and include the name:

```sql
-- Food details: add saved meal name
(
  SELECT json_agg(json_build_object(
    'raw_input', fe2.raw_input,
    'saved_meal_name', sm2.name,  -- NEW: include saved meal name
    'items', (
      SELECT json_agg(item->>'description')
      FROM jsonb_array_elements(fe2.food_items) item
    )
  ))
  FROM food_entries fe2
  LEFT JOIN saved_meals sm2 ON fe2.source_meal_id = sm2.id
  WHERE fe2.user_id = p.id 
  AND fe2.eaten_date = local_today
) as food_today_details,

-- Weight details: add saved routine name
(
  SELECT json_agg(json_build_object(
    'raw_input', ws2.raw_input,
    'saved_routine_name', sr2.name,  -- NEW: include saved routine name
    'description', ws2.description
  ))
  FROM weight_sets ws2
  LEFT JOIN saved_routines sr2 ON ws2.source_routine_id = sr2.id
  WHERE ws2.user_id = p.id 
  AND ws2.logged_date = local_today
) as weight_today_details
```

---

### TypeScript Types Update (`src/hooks/useAdminStats.ts`)

```typescript
interface TodayFoodDetail {
  raw_input: string | null;
  saved_meal_name: string | null;  // NEW
  items: string[] | null;
}

interface TodayWeightDetail {
  raw_input: string | null;
  saved_routine_name: string | null;  // NEW
  description: string;
}
```

---

### Frontend Display Logic (`src/pages/Admin.tsx`)

**Food tooltip** - Group items by entry and show appropriate prefix:

```tsx
{user.food_today_details.map((entry, i) => (
  <div key={i}>
    {entry.raw_input ? (
      // Manual entry: show "input" → items (combine into one line if single item)
      entry.items?.length === 1 ? (
        <p><span className="italic text-muted-foreground">"{entry.raw_input}"</span> → {entry.items[0]}</p>
      ) : (
        <>
          <p className="italic text-muted-foreground">"{entry.raw_input}"</p>
          {entry.items?.map((item, j) => <p key={j} className="pl-2">→ {item}</p>)}
        </>
      )
    ) : entry.saved_meal_name ? (
      // Saved meal: show meal name header with items below
      <>
        <p className="text-muted-foreground">[{entry.saved_meal_name}]</p>
        {entry.items?.map((item, j) => <p key={j} className="pl-2">• {item}</p>)}
      </>
    ) : (
      // No context: just bullets
      entry.items?.map((item, j) => <p key={j}>• {item}</p>)
    )}
  </div>
))}
```

**Weight tooltip** - Similar pattern:

```tsx
{user.weight_today_details.map((entry, i) => (
  <div key={i}>
    {entry.raw_input ? (
      <p><span className="italic text-muted-foreground">"{entry.raw_input}"</span> → {entry.description}</p>
    ) : entry.saved_routine_name ? (
      <p><span className="text-muted-foreground">[{entry.saved_routine_name}]</span> {entry.description}</p>
    ) : (
      <p>• {entry.description}</p>
    )}
  </div>
))}
```

---

### Visual Examples

**Food Tooltip (F2day)**:

| Scenario | Display |
|----------|---------|
| Manual entry (single item) | `"200g yogurt" → Nonfat Greek Yogurt` |
| Manual entry (multi-item) | `"yogurt and granola"` then indented `→ Nonfat Greek Yogurt` and `→ Honey Granola` |
| Saved meal | `[Morning Coffee]` then indented `• Black Coffee` and `• Whole Milk` |
| Unknown source | `• Item Name` |

**Weight Tooltip (W2day)**:

| Scenario | Display |
|----------|---------|
| Manual entry | `"Leg curl 10 reps at 65" → Leg Curl` |
| Saved routine | `[Leg Day] Leg Curl` |
| Unknown source | `• Leg Curl` |

---

### Files Changed

| File | Change |
|------|--------|
| Database migration | Add saved_meal_name and saved_routine_name to get_user_stats |
| `src/hooks/useAdminStats.ts` | Add new fields to TypeScript interfaces |
| `src/pages/Admin.tsx` | Update tooltip rendering logic for both food and weight |

