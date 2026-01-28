

## Weight Logging Feature - Final Implementation Plan

### Summary

This plan adds **weight training tracking** focused on machines/exercises with sets, reps, and weight. The key architectural decision is a **normalized table** (one row per exercise) instead of JSONB, making per-exercise trending queries simple. The AI maps user descriptions to canonical `exercise_key` values for consistent aggregation.

---

### Part 1: Feature Name and Navigation

**Feature name**: "Log Weights" (sits next to "Log Food" in bottom nav)

**Navigation update in BottomNav.tsx:**
- Log Food → Log Weights → Calendar → Trends → Settings → (Admin)
- Gated behind `FEATURES.WEIGHT_TRACKING` flag

---

### Part 2: Database Schema (Normalized - No JSONB)

**Why normalized instead of JSONB:**
- Per-exercise trending queries are simple: `WHERE exercise_key = 'lat_pulldown'`
- No need for `jsonb_array_elements` complexity
- Standard SQL aggregation for volume calculations
- Easier indexing and filtering

**New table: `weight_sets`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| logged_date | date | Date of workout |
| entry_id | uuid | Groups exercises logged together (for display) |
| exercise_key | text | Canonical key for trending (e.g., "lat_pulldown") |
| description | text | Display name (e.g., "Lat Pulldown") |
| sets | integer | Number of sets |
| reps | integer | Reps per set |
| weight_lbs | integer | Weight used |
| raw_input | text | Original user input (nullable, same for all in entry) |
| source_routine_id | uuid | If from saved routine (nullable) |
| created_at | timestamp | |

**Key insight:** `entry_id` groups exercises from a single input (e.g., "bench press 3x10, lat pulldown 3x8" creates 2 rows with same `entry_id`). This replaces the JSONB array concept while enabling per-exercise queries.

**New table: `saved_routines`** (mirrors saved_meals pattern but simpler since no JSONB)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| name | text | User-defined name |
| exercise_data | jsonb | Array of {exercise_key, description, sets, reps, weight_lbs} |
| original_input | text | |
| use_count | integer | |
| last_used_at | timestamp | |
| created_at | timestamp | |

*Note: saved_routines uses JSONB for the template since we don't need to trend on saved routine data - only on actual logged sets.*

**RLS Policies:** Users can only CRUD their own data (same pattern as food_entries).

---

### Part 3: Feature Flag

**New file: `src/lib/feature-flags.ts`**

```typescript
export const FEATURES = {
  WEIGHT_TRACKING: import.meta.env.DEV,
} as const;
```

To ship: change to `WEIGHT_TRACKING: true`

Used in:
- `BottomNav.tsx` - show/hide "Log Weights" tab
- `App.tsx` - register `/weights` route
- `Settings.tsx` - show/hide "Saved Routines" section
- `Trends.tsx` - show/hide "Weight Trends" section

---

### Part 4: Type Definitions

**New file: `src/types/weights.ts`**

```typescript
export type WeightEditableField = 'description' | 'sets' | 'reps' | 'weight_lbs';

export interface WeightSet {
  id: string;          // Database row ID
  uid: string;         // Client-side unique ID (for React keys, editing)
  entry_id: string;    // Groups sets from same input
  exercise_key: string;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  raw_input?: string;
  editedFields?: WeightEditableField[];
}

export interface WeightEntry {
  entry_id: string;
  logged_date: string;
  raw_input: string | null;
  sets: WeightSet[];   // All sets with this entry_id
  total_volume: number;
  total_sets: number;
}

export function calculateVolume(set: WeightSet): number {
  return set.sets * set.reps * set.weight_lbs;
}

export function calculateTotalVolume(sets: WeightSet[]): number {
  return sets.reduce((sum, set) => sum + calculateVolume(set), 0);
}

export function calculateTotalSets(sets: WeightSet[]): number {
  return sets.reduce((sum, set) => sum + set.sets, 0);
}
```

---

### Part 5: Edge Function (analyze-weights)

**Authentication:** Uses `supabase.auth.getClaims()` pattern - requires valid JWT.

**Prompt approach** (no specific examples, trusts LLM knowledge):

```text
You are helping a user track their weight training for fitness goals. Accuracy matters.

Analyze the workout description and extract individual exercises.

For each exercise, provide:
- name: A clean, properly formatted display name (max 25 chars)
- exercise_key: A canonical snake_case identifier for this exercise type 
  (e.g., "lat_pulldown", "bench_press", "squat", "leg_press", "bicep_curl").
  Use the most specific common name. This key enables tracking progress over time.
- sets: number of sets (whole number)
- reps: reps per set (whole number)
- weight_lbs: weight used (whole number)

Parse common patterns like "3x10", "3 sets of 10", "3 sets 10 reps".
If weight not specified, use 0 (user can edit).
If sets/reps not specified, default to reasonable values (3 sets, 10 reps).

Respond ONLY with valid JSON:
{
  "exercises": [
    {
      "name": "Lat Pulldown",
      "exercise_key": "lat_pulldown", 
      "sets": 3,
      "reps": 10,
      "weight_lbs": 100
    }
  ]
}
```

---

### Part 6: Phase 1 - Component Refactoring (Test with Food First)

Before adding weight-specific code, refactor shared components to be reusable.

#### 6.1: CollapsibleSection Component

**New file: `src/components/CollapsibleSection.tsx`**

```typescript
interface CollapsibleSectionProps {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  headerAction?: React.ReactNode; // For "Add" button in header
  children: React.ReactNode;
}
```

- Chevron indicator for expand/collapse
- Uses localStorage to remember state per section (`settings-section-${title}`)
- Smooth height transition

#### 6.2: Update Settings Page with Collapsible Sections

Wrap each section:
- Saved Meals (with Add button)
- Appearance
- Export as CSV (clarify buttons are food-related)

Add placeholder for Saved Routines (behind feature flag).

#### 6.3: Update Trends Page with Collapsible Sections

Wrap existing content under "Food Trends" header.

Add placeholder "Weight Trends" section (behind feature flag).

#### 6.4: Extract Shared Table UX Primitives

**New directory: `src/components/ItemsTable/`**

These primitives extract the core UX patterns from FoodItemsTable:

**`useEditableCell.ts`**
- Manages editing state for a single cell
- Enter to save, Escape to cancel, blur to cancel
- Returns: `{ isEditing, value, startEditing, handleChange, handleKeyDown, handleBlur }`

**`EditableTextCell.tsx`**
- ContentEditable span with focus ring (`focus-within:ring-2 focus-within:ring-focus-ring`)
- Keyboard handling for Enter/Escape
- Props: `value`, `onSave`, `className`, `title`

**`EditableNumberCell.tsx`**
- Number input with focus ring styling
- Enter/Escape handling
- Props: `value`, `onSave`, `className`, `min`, `max`

**`HighlightableRow.tsx`**
- Wrapper applying new-item highlight animations
- `animate-outline-fade` on row container
- `animate-highlight-fade` on cells
- Props: `isNew`, `children`, `className`

**`DeleteCell.tsx`**
- Trash button with hover reveal (desktop), always visible (mobile)
- Optional AlertDialog confirmation
- Props: `onDelete`, `confirmTitle`, `confirmDescription`, `requireConfirm`

**`index.ts`**
- Barrel export for all primitives

#### 6.5: Refactor FoodItemsTable to Use Primitives

FoodItemsTable.tsx imports and uses extracted primitives. Food-specific parts remain:
- Grid column layout (description, calories, P/C/F)
- Macro preview when editing calories (`scaleMacrosByCalories`)
- Entry boundary/expansion logic
- "Save as meal" link

This ensures shared UX code has a single source of truth.

#### 6.6: Rename FoodInput → LogInput with Mode Config

**`src/components/LogInput.tsx`** (renamed from FoodInput.tsx)

```typescript
type LogMode = 'food' | 'weights';

interface LogInputConfig {
  placeholders: string[];
  showBarcodeScanner: boolean;
  showSavedButton: boolean;
  submitLabel: string;
  submitLabelShort: string;
}

const CONFIGS: Record<LogMode, LogInputConfig> = {
  food: {
    placeholders: FOOD_PLACEHOLDER_EXAMPLES,
    showBarcodeScanner: true,
    showSavedButton: true,
    submitLabel: 'Add Food',
    submitLabelShort: 'Add',
  },
  weights: {
    placeholders: WEIGHTS_PLACEHOLDER_EXAMPLES,
    showBarcodeScanner: false,  // No barcodes for weights
    showSavedButton: true,
    submitLabel: 'Add Exercise',
    submitLabelShort: 'Add',
  },
};

interface LogInputProps {
  mode: LogMode;
  onSubmit: (text: string) => void;
  // ... rest of props
}
```

FoodLog.tsx uses `<LogInput mode="food" ... />` - no behavior change.

#### 6.7: Generalize useEditableFoodItems

**`src/hooks/useEditableItems.ts`** (renamed)

```typescript
interface BaseEditableItem {
  uid: string;
  entryId?: string;
}

export function useEditableItems<T extends BaseEditableItem>(
  queryItems: T[],
  editableFields: string[]
) {
  // Same logic as useEditableFoodItems, but generic
}
```

FoodLog uses: `useEditableItems<FoodItem>(allItems, ['description', 'calories', ...])`
WeightLog uses: `useEditableItems<WeightSet>(allSets, ['description', 'sets', 'reps', 'weight_lbs'])`

---

### Part 7: Phase 2 - Weight-Specific Implementation

Only after Phase 1 is tested with food tracking.

#### 7.1: Database Migration

Create `weight_sets` and `saved_routines` tables with RLS policies.

#### 7.2: Hooks

**`useWeightSets.ts`**
- Query weight_sets by logged_date
- Group by entry_id for display
- Insert/update/delete operations

**`useSavedRoutines.ts`**
- CRUD for saved_routines table

**`useAnalyzeWeights.ts`**
- Calls analyze-weights edge function

#### 7.3: WeightSetsTable Component

Uses shared primitives from Phase 1.

**Grid columns:**
- Description (editable text)
- Sets (editable number)
- Reps (editable number)
- Weight (editable number, suffixed with "lbs")
- Delete

**Totals row shows:**
- Total sets count
- Total volume (formatted, e.g., "12,500 lbs")

**Entry grouping:**
- Groups rows by entry_id
- Shows chevron on last item of each entry
- Expanded state shows raw_input

#### 7.4: WeightLog Page

**`src/pages/WeightLog.tsx`**

Structure mirrors FoodLog:
- `<LogInput mode="weights" ... />`
- `<WeightSetsTable ... />`
- Date navigation (same component/pattern)
- Entry boundary logic (using entry_id)

#### 7.5: Navigation Updates

**BottomNav.tsx:**
```tsx
{FEATURES.WEIGHT_TRACKING && (
  <NavLink to="/weights" icon={Dumbbell} label="Log Weights" />
)}
```

**App.tsx:** Add `/weights` route (behind feature flag)

#### 7.6: Settings - Saved Routines

Add "Saved Routines" collapsible section (behind feature flag) between Saved Meals and Appearance. Same UI pattern as Saved Meals.

#### 7.7: Trends - Weight Trends

Add "Weight Trends" collapsible section with:
- Dropdown to select exercise (from user's unique exercise_keys)
- Chart showing weight progression over time
- Option to show sets/reps/volume trends
- Average volume per session

**Trending query (simple with normalized data):**
```sql
SELECT logged_date, weight_lbs, sets, reps
FROM weight_sets
WHERE user_id = $1 
  AND exercise_key = 'lat_pulldown'
ORDER BY logged_date
```

---

### Part 8: Placeholder Text Examples

**`WEIGHTS_PLACEHOLDER_EXAMPLES`:**
```typescript
const WEIGHTS_PLACEHOLDER_EXAMPLES = [
  "Describe your workout: 3 sets of 10 reps lat pulldown at 100 lbs",
  "Describe your workout: bench press 4x8 at 135",
  "Describe your workout: squats 5x5 at 185 lbs, then leg press 3x12 at 200",
  "Describe your workout: bicep curls 3x12 at 25 lbs",
  "Describe your workout: chest fly machine 3x10, then shoulder press 3x8",
  "Describe your workout: leg extensions and hamstring curls, 3 sets each",
  "Describe your workout: cable rows 4x10 at 80 lbs",
];
```

---

### Implementation Order

**Phase 1: Refactoring (Test with Food)**
1. Create `src/lib/feature-flags.ts`
2. Create `src/components/CollapsibleSection.tsx`
3. Update `Settings.tsx` with collapsible sections
4. Update `Trends.tsx` with collapsible sections
5. Create `src/components/ItemsTable/` primitives
6. Refactor `FoodItemsTable.tsx` to use primitives
7. Rename `FoodInput.tsx` → `LogInput.tsx` with mode config
8. Rename `useEditableFoodItems.ts` → `useEditableItems.ts` (generic)
9. **Verify**: Food tracking works correctly

**Phase 2: Weight Feature (Behind Dev Flag)**
1. Database migration for `weight_sets` and `saved_routines`
2. Create `src/types/weights.ts`
3. Create `analyze-weights` edge function (with auth)
4. Create hooks (`useWeightSets`, `useSavedRoutines`, `useAnalyzeWeights`)
5. Create `WeightSetsTable.tsx` (using shared primitives)
6. Create `WeightLog.tsx` page
7. Update navigation (`BottomNav.tsx`, `App.tsx`)
8. Add Saved Routines section to Settings
9. Add Weight Trends section to Trends

---

### File Summary

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1 (Refactor) | `feature-flags.ts`, `CollapsibleSection.tsx`, `ItemsTable/useEditableCell.ts`, `ItemsTable/EditableTextCell.tsx`, `ItemsTable/EditableNumberCell.tsx`, `ItemsTable/HighlightableRow.tsx`, `ItemsTable/DeleteCell.tsx`, `ItemsTable/index.ts` | `Settings.tsx`, `Trends.tsx`, `FoodItemsTable.tsx`, `FoodInput.tsx`→`LogInput.tsx`, `useEditableFoodItems.ts`→`useEditableItems.ts`, `FoodLog.tsx` |
| 2 (Weights) | `types/weights.ts`, `analyze-weights/index.ts`, `useWeightSets.ts`, `useSavedRoutines.ts`, `useAnalyzeWeights.ts`, `WeightSetsTable.tsx`, `WeightLog.tsx`, `SavedRoutinesPopover.tsx` | `BottomNav.tsx`, `App.tsx`, `Settings.tsx`, `Trends.tsx`, `supabase/config.toml` |

---

### Key Benefits of Normalized Approach

1. **Simple trending queries**: `WHERE exercise_key = 'lat_pulldown'` - no JSONB extraction
2. **Per-exercise charts**: Track lat pulldown vs bench press progression over time
3. **Standard SQL**: Easy aggregation, indexing, filtering
4. **entry_id grouping**: Preserves the "logged together" concept for display
5. **Canonical exercise_key**: AI normalizes user input for consistent aggregation across sessions

