

## Phase 2: Weight Logging - Core Implementation

### Overview

This phase implements the weight tracking feature end-to-end, following the same patterns established for food logging but with a normalized database schema optimized for per-exercise trending.

---

### Database Schema

Create a new `weight_sets` table with one row per exercise set (not JSONB like food):

```sql
CREATE TABLE weight_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entry_id UUID NOT NULL,  -- Groups multiple exercises logged together
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercise_key TEXT NOT NULL,  -- Canonical identifier: 'lat_pulldown', 'bench_press'
  description TEXT NOT NULL,   -- User-friendly: "Lat Pulldown"
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_lbs NUMERIC NOT NULL,
  raw_input TEXT,              -- Original AI input (only on first set of entry)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies (same pattern as food_entries)
ALTER TABLE weight_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight sets" ON weight_sets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight sets" ON weight_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight sets" ON weight_sets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight sets" ON weight_sets
  FOR DELETE USING (auth.uid() = user_id);

-- Index for efficient date + exercise queries
CREATE INDEX idx_weight_sets_user_date ON weight_sets(user_id, logged_date);
CREATE INDEX idx_weight_sets_exercise ON weight_sets(user_id, exercise_key);
```

**Why normalized (not JSONB)?**
- Enables simple SQL for per-exercise trending: `WHERE exercise_key = 'lat_pulldown' ORDER BY logged_date`
- Allows filtering/aggregating by exercise type efficiently
- Each set is independently editable with proper schema validation

---

### Edge Function: analyze-weights

Create `supabase/functions/analyze-weights/index.ts`:

**Input:** `{ rawInput: string }` (e.g., "3 sets of 10 reps lat pulldown at 100 lbs, then bench 4x8 at 135")

**Output:**
```typescript
{
  exercises: [
    {
      exercise_key: "lat_pulldown",      // Canonical key for DB
      description: "Lat Pulldown",       // Display name
      sets: 3,
      reps: 10,
      weight_lbs: 100
    },
    {
      exercise_key: "bench_press",
      description: "Bench Press",
      sets: 4,
      reps: 8,
      weight_lbs: 135
    }
  ]
}
```

**AI prompt responsibilities:**
1. Parse natural language workout descriptions
2. Extract sets, reps, weight for each exercise
3. Map exercise names to canonical `exercise_key` values (handles variations like "lat pulldowns", "lat pull-down machine", "pulldowns" → `lat_pulldown`)
4. Handle common patterns: "3x10", "3 sets of 10", "3 sets 10 reps"
5. Default to lbs for weight (can add kg support later)

---

### Types

Create `src/types/weight.ts`:

```typescript
export type WeightEditableField = 'description' | 'sets' | 'reps' | 'weight_lbs';

export interface WeightSet {
  id: string;           // Database ID
  uid: string;          // Client-side tracking
  entryId: string;      // Groups exercises logged together
  exercise_key: string;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  editedFields?: WeightEditableField[];
}

export interface WeightEntry {
  entry_id: string;
  logged_date: string;
  raw_input: string | null;
  weight_sets: WeightSet[];
  created_at: string;
}
```

---

### Hooks

**`src/hooks/useWeightEntries.ts`**
- Similar pattern to `useFoodEntries`
- Query weight_sets by date, group by entry_id for display
- createEntry: bulk insert multiple weight_sets with shared entry_id
- updateSet: update single weight_set row
- deleteSet: delete single row (auto-cleanup if entry becomes empty)
- Expose `isFetching` for extended loading state

**`src/hooks/useAnalyzeWeights.ts`**
- Calls analyze-weights edge function
- Returns `{ analyzeWeights, isAnalyzing, error }`

---

### Components

**`src/components/WeightItemsTable.tsx`**
- Grid layout similar to FoodItemsTable but with different columns:
  - Description (exercise name)
  - Sets (number)
  - Reps (number)
  - Weight (lbs)
  - Delete button
- Uses same patterns: inline editing, grouped outline for new entries, entry boundaries
- Mobile-optimized column widths

**Reused components:**
- `LogInput` with `mode="weights"` (already prepared)
- `CollapsibleSection` for Trends
- Generic `useEditableItems` hook

---

### Pages

**`src/pages/WeightLog.tsx`**
- Same structure as FoodLog:
  - LogInput at top (mode="weights")
  - Date navigation
  - WeightItemsTable with daily sets
- Track pendingEntryId for extended loading state
- No saved meals equivalent initially (can add saved routines later)

**Update `src/pages/Trends.tsx`**
- Add new CollapsibleSection for "Weight Trends"
- Show per-exercise progress charts (weight over time for each exercise_key)
- Query weight_sets grouped by exercise_key

---

### Navigation

**Update `src/components/BottomNav.tsx`**
- Add "Log Weights" tab between "Log Food" and "Calendar"
- Only show when `FEATURES.WEIGHT_TRACKING` is enabled
- Use `Dumbbell` icon from lucide-react
- Route: `/weights`

**Update `src/App.tsx`**
- Add route for WeightLog page (conditionally based on feature flag)

---

### Files to Create

1. `src/types/weight.ts` - Type definitions
2. `src/hooks/useWeightEntries.ts` - Data fetching/mutations
3. `src/hooks/useAnalyzeWeights.ts` - AI analysis hook
4. `src/pages/WeightLog.tsx` - Main weight logging page
5. `src/components/WeightItemsTable.tsx` - Table component for weight sets
6. `supabase/functions/analyze-weights/index.ts` - Edge function

### Files to Modify

1. `supabase/functions/_shared/prompts.ts` - Add weight analysis prompt
2. `src/components/BottomNav.tsx` - Add conditional nav item
3. `src/App.tsx` - Add route
4. `src/pages/Trends.tsx` - Add weight trends section
5. Database migration for weight_sets table

---

### Implementation Order

1. **Database**: Create weight_sets table with RLS
2. **Types**: Define WeightSet and WeightEntry interfaces
3. **Edge Function**: Create analyze-weights with AI prompt
4. **Hooks**: useWeightEntries and useAnalyzeWeights
5. **Components**: WeightItemsTable
6. **Page**: WeightLog
7. **Navigation**: Update BottomNav and App routes
8. **Trends**: Add weight trends section

---

### UX Notes

- Weight table columns are narrower than food (no protein/carbs/fat)
- Mobile layout: Description takes most space, Sets/Reps/Weight in compact columns
- Same highlight animation pattern for new entries
- Same inline editing pattern (Enter to save, Escape to cancel)
- Date picker uses same blue hyperlink style

---

### Out of Scope (Future)

- Saved routines (like saved meals)
- Exercise library/autocomplete
- Personal records tracking
- Rep max calculations
- Workout templates
- kg/lbs unit preference

