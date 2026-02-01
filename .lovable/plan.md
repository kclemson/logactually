

## Add Hover Tooltips for F2day/W2day on Admin Page

Show detailed information (raw input + logged items) when hovering over non-zero F2day or W2day values on desktop.

---

### Overview

| Aspect | Details |
|--------|---------|
| Trigger | Hover on non-zero F2day/W2day cells |
| Platform | Desktop only (uses `useHasHover`) |
| Content | Raw input + parsed item descriptions |
| Data source | Extend `get_user_stats` RPC to include today's items |

---

### Technical Changes

#### 1. Install Radix Tooltip

Add `@radix-ui/react-tooltip` package for proper tooltip behavior.

#### 2. Create Tooltip UI Component

**New file: `src/components/ui/tooltip.tsx`**

Standard shadcn/Radix tooltip wrapper:

```typescript
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = // styled portal content
```

#### 3. Extend Database RPC

**Migration: Modify `get_user_stats` function**

Add two new fields to the return data:
- `food_today_details`: Array of `{ raw_input, items[] }` for today's food entries
- `weight_today_details`: Array of `{ raw_input, items[] }` for today's weight entries

```sql
-- Add to the SELECT inside get_user_stats:
(
  SELECT json_agg(json_build_object(
    'raw_input', fe2.raw_input,
    'items', (
      SELECT json_agg(item->>'description')
      FROM jsonb_array_elements(fe2.food_items) item
    )
  ))
  FROM food_entries fe2 
  WHERE fe2.user_id = p.id 
  AND fe2.eaten_date = local_today
) as food_today_details,

(
  SELECT json_agg(json_build_object(
    'raw_input', ws2.raw_input,
    'description', ws2.description
  ))
  FROM weight_sets ws2 
  WHERE ws2.user_id = p.id 
  AND ws2.logged_date = local_today
) as weight_today_details
```

#### 4. Update TypeScript Types

**File: `src/hooks/useAdminStats.ts`**

```typescript
interface TodayFoodDetail {
  raw_input: string | null;
  items: string[] | null;
}

interface TodayWeightDetail {
  raw_input: string | null;
  description: string;
}

interface UserStats {
  // ... existing fields
  food_today_details: TodayFoodDetail[] | null;
  weight_today_details: TodayWeightDetail[] | null;
}
```

#### 5. Update Admin Page

**File: `src/pages/Admin.tsx`**

```typescript
import { useHasHover } from "@/hooks/use-has-hover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// In component:
const hasHover = useHasHover();

// Wrap table with TooltipProvider

// For F2day cell (lines 145-149):
{hasHover && user.entries_today > 0 && user.food_today_details ? (
  <Tooltip>
    <TooltipTrigger asChild>
      <td className="...cursor-default">{user.entries_today}</td>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs text-xs">
      {user.food_today_details.map((entry, i) => (
        <div key={i}>
          {entry.raw_input && <p className="italic text-muted-foreground">{entry.raw_input}</p>}
          {entry.items?.map((item, j) => <p key={j}>• {item}</p>)}
        </div>
      ))}
    </TooltipContent>
  </Tooltip>
) : (
  <td className="...">{user.entries_today}</td>
)}

// Similar pattern for W2day cell
```

---

### Data Shape Example

```json
{
  "user_id": "...",
  "entries_today": 2,
  "food_today_details": [
    {
      "raw_input": "oatmeal with blueberries",
      "items": ["Oatmeal", "Blueberries"]
    },
    {
      "raw_input": "chicken salad",
      "items": ["Grilled Chicken Breast", "Mixed Greens", "Ranch Dressing"]
    }
  ],
  "weight_today": 3,
  "weight_today_details": [
    { "raw_input": "bench press 3x10 135", "description": "Bench Press" },
    { "raw_input": null, "description": "Lat Pulldown" },
    { "raw_input": null, "description": "Bicep Curls" }
  ]
}
```

---

### Summary

| Step | Change |
|------|--------|
| 1 | Install `@radix-ui/react-tooltip` |
| 2 | Create `src/components/ui/tooltip.tsx` |
| 3 | Extend `get_user_stats` RPC with detail arrays |
| 4 | Update `UserStats` TypeScript interface |
| 5 | Add conditional tooltips to Admin.tsx (desktop only via `useHasHover`) |

