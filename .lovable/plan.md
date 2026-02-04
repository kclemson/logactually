

## Save Suggestion Feature: Complete Design

This feature detects when users log something similar to what they've logged **2+ times** in the past 90 days (excluding entries from saved meals/routines), and suggests creating a saved meal/routine with **editable items preview**.

### Dismissal Strategy: Progressive Disclosure

**Three-tier approach**:

1. **Per-pattern dismissal** ("Not Now"): Clicking dismisses this specific pattern permanently via localStorage signature hash. Available from the first prompt.

2. **Global opt-out link** (revealed after N dismissals): After the user clicks "Not Now" 3+ times (across any patterns), a small "Don't suggest saves" link appears in future prompts. This ensures users understand the feature's value before being offered the permanent opt-out.

3. **Settings toggles** (always available for power users): Separate toggles in "Saved Meals" and "Saved Routines" sections for independent control. Users who want to find it can, but it's not prominently displayed.

```text
First 3 prompts:                    After 3+ dismissals:
┌────────────────────────────────┐  ┌────────────────────────────────┐
│ 💡 You've logged similar...   │  │ 💡 You've logged similar...   │
│                                │  │                                │
│ [items table - editable]       │  │ [items table - editable]       │
│                                │  │                                │
│ [Save as Meal]  [Not Now]      │  │ [Save as Meal]  [Not Now]      │
└────────────────────────────────┘  │                                │
                                    │ Don't suggest saves            │
                                    └────────────────────────────────┘
```

### Settings Integration

Add toggles at the bottom of each section (below the saved items list):

**Saved Meals section**:
```text
┌─ Saved Meals ─────────────────────────────────────┐
│ + Add Saved Meal                                   │
│ Morning smoothie          3 items    →            │
│ Chicken salad             4 items    →            │
│ ─────────────────────────────────────────────────  │
│ Suggest saves              [ON|off]                │
└────────────────────────────────────────────────────┘
```

**Saved Routines section** (same pattern):
```text
┌─ Saved Routines ──────────────────────────────────┐
│ + Add Saved Routine                                │
│ Leg day                   3 exercises  →          │
│ ─────────────────────────────────────────────────  │
│ Suggest saves              [ON|off]                │
└────────────────────────────────────────────────────┘
```

### UX Flow

```text
User logs: "greek yogurt with honey"
   ↓
AI returns structured items → Entry saved successfully
   ↓
Detection runs on cached 90-day history (already in memory)
   ↓
Finds 2+ similar entries → Check if suggestions enabled for food
   ↓
Check dismissal count → Show/hide "Don't suggest saves" link accordingly

┌─────────────────────────────────────────────────────────────┐
│ 💡 You've logged similar items 3 times. Save for quick     │ ✕
│    access?                                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Greek yogurt with honey  1 cup    Cal 180  P 15  C 20  F 4│ │ (editable)
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│    [Save as Meal]  [Not Now]                               │
│                                                             │
│    (after 3+ dismissals: "Don't suggest saves" link)        │
└─────────────────────────────────────────────────────────────┘

On "Save as Meal" → Opens CreateMealDialog pre-populated with edited items
On "Not Now" → Dismisses, stores signature hash, increments dismissal count
On "Don't suggest saves" → Sets suggestMealSaves: false in UserSettings
```

---

## Technical Implementation

### 1. Update UserSettings Interface

**File**: `src/hooks/useUserSettings.ts`

Add two new boolean settings:
```typescript
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  weightUnit: WeightUnit;
  showWeights: boolean;
  suggestMealSaves: boolean;    // NEW - default true
  suggestRoutineSaves: boolean; // NEW - default true
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  weightUnit: 'lbs',
  showWeights: true,
  suggestMealSaves: true,
  suggestRoutineSaves: true,
};
```

### 2. New Detection Module

**File**: `src/lib/repeated-entry-detection.ts`

Core detection algorithms and dismissal tracking:

```typescript
// Types
interface FoodSaveSuggestion {
  matchCount: number;
  signatureHash: string;
  items: FoodItem[];
}

interface WeightSaveSuggestion {
  matchCount: number;
  signatureHash: string;
  exercises: AnalyzedExercise[];
}

// Food detection: requires BOTH text similarity (≥0.4) AND macro similarity (within 40%)
function detectRepeatedFoodEntry(
  newItems: FoodItem[],
  recentEntries: FoodEntry[],
  minMatches = 2
): FoodSaveSuggestion | null

// Weight detection: matches on exercise_key set (≥0.7 Jaccard), ignores numeric values
function detectRepeatedWeightEntry(
  newExercises: AnalyzedExercise[],
  recentEntries: WeightEntry[],
  minMatches = 2
): WeightSaveSuggestion | null

// Dismissal tracking
const STORAGE_KEY = 'save-suggestion-dismissed';
const COUNT_KEY = 'save-suggestion-dismiss-count';
const SHOW_OPT_OUT_THRESHOLD = 3;

function isDismissed(signatureHash: string): boolean
function dismissSuggestion(signatureHash: string): void
function getDismissalCount(): number
function shouldShowOptOutLink(): boolean  // returns count >= 3
```

### 3. New Weight Entries Hook

**File**: `src/hooks/useRecentWeightEntries.ts`

Mirrors useRecentFoodEntries for weight tracking:

```typescript
interface WeightEntryGrouped {
  entry_id: string;
  logged_date: string;
  exercise_keys: Set<string>;
  source_routine_id: string | null;
}

export function useRecentWeightEntries(daysBack = 90) {
  // Fetch weight_sets from last 90 days
  // Group by entry_id
  // Return with source_routine_id for filtering
}
```

### 4. Update Recent Food Entries Hook

**File**: `src/hooks/useRecentFoodEntries.ts`

Add `source_meal_id` to the select query (line 29):
```typescript
.select('id, eaten_date, raw_input, food_items, total_calories, 
         total_protein, total_carbs, total_fat, source_meal_id, created_at')
```

Update the return mapping (around line 69):
```typescript
source_meal_id: entry.source_meal_id || null,  // Use actual value instead of hardcoded null
```

### 5. New Save Suggestion Prompt Component

**File**: `src/components/SaveSuggestionPrompt.tsx`

Unified prompt with editable items preview:

```typescript
interface SaveSuggestionPromptProps<T> {
  mode: 'food' | 'weights';
  matchCount: number;
  items: T[];
  onSave: (editedItems: T[]) => void;
  onDismiss: () => void;
  onOptOut: () => void;          // For "Don't suggest saves" click
  showOptOutLink: boolean;        // Based on dismissal count ≥ 3
  renderItemsTable: (props: {
    items: T[];
    editable: boolean;
    onUpdateItem: (...) => void;
    onRemoveItem: (index: number) => void;
  }) => React.ReactNode;
  isLoading?: boolean;
}
```

Features:
- Shows "You've logged similar items X times"
- Displays editable FoodItemsTable or WeightItemsTable via render prop
- "Save as Meal/Routine" button → Triggers onSave with edited items
- "Not Now" button → Calls onDismiss
- "Don't suggest saves" link → Calls onOptOut (only visible when showOptOutLink=true)
- Dismiss X button in corner

### 6. Update CreateMealDialog

**File**: `src/components/CreateMealDialog.tsx`

Add optional `initialItems` prop to pre-populate and skip analyze step:

```typescript
interface CreateMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealCreated: (meal: SavedMeal, foodItems: FoodItem[]) => void;
  showLogPrompt?: boolean;
  initialItems?: FoodItem[];  // NEW - skip analyze, go straight to editing
  initialName?: string;       // NEW - optional default name
}
```

When `initialItems` is provided:
- Skip the input/analyze step
- Go directly to the editing state
- Use items as starting point

### 7. Update CreateRoutineDialog

**File**: `src/components/CreateRoutineDialog.tsx`

Same pattern as CreateMealDialog:

```typescript
interface CreateRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoutineCreated: (routine: SavedRoutine, exercises: SavedExerciseSet[]) => void;
  showLogPrompt?: boolean;
  initialExercises?: SavedExerciseSet[];  // NEW
  initialName?: string;                   // NEW
}
```

### 8. Update FoodLog Page

**File**: `src/pages/FoodLog.tsx`

Add state and detection logic after entry creation:

```typescript
// New imports
import { detectRepeatedFoodEntry, isDismissed, dismissSuggestion, 
         shouldShowOptOutLink, FoodSaveSuggestion } from '@/lib/repeated-entry-detection';

// New state
const [saveSuggestion, setSaveSuggestion] = useState<FoodSaveSuggestion | null>(null);
const [saveSuggestionItems, setSaveSuggestionItems] = useState<FoodItem[]>([]);
const [createMealFromSuggestion, setCreateMealFromSuggestion] = useState(false);

// In createEntryFromItems, after successful entry creation:
if (!isReadOnly && settings.suggestMealSaves && recentEntries) {
  const suggestion = detectRepeatedFoodEntry(items, recentEntries);
  if (suggestion && !isDismissed(suggestion.signatureHash)) {
    setSaveSuggestion(suggestion);
    setSaveSuggestionItems([...suggestion.items]); // Copy for editing
  }
}

// Handlers
const handleSaveSuggestion = (editedItems: FoodItem[]) => {
  setSaveSuggestionItems(editedItems);
  setCreateMealFromSuggestion(true);
  setSaveSuggestion(null);
};

const handleDismissSuggestion = () => {
  if (saveSuggestion) {
    dismissSuggestion(saveSuggestion.signatureHash);
  }
  setSaveSuggestion(null);
};

const handleOptOutMealSuggestions = () => {
  updateSettings({ suggestMealSaves: false });
  setSaveSuggestion(null);
};

// In render, after the input area:
{saveSuggestion && (
  <SaveSuggestionPrompt
    mode="food"
    matchCount={saveSuggestion.matchCount}
    items={saveSuggestionItems}
    onSave={handleSaveSuggestion}
    onDismiss={handleDismissSuggestion}
    onOptOut={handleOptOutMealSuggestions}
    showOptOutLink={shouldShowOptOutLink()}
    renderItemsTable={(props) => (
      <FoodItemsTable
        items={props.items}
        editable={props.editable}
        onUpdateItem={props.onUpdateItem}
        onRemoveItem={props.onRemoveItem}
        // ... other props
      />
    )}
  />
)}

// CreateMealDialog with pre-population:
{createMealFromSuggestion && (
  <CreateMealDialog
    open={createMealFromSuggestion}
    onOpenChange={setCreateMealFromSuggestion}
    onMealCreated={() => setCreateMealFromSuggestion(false)}
    showLogPrompt={false}
    initialItems={saveSuggestionItems}
  />
)}
```

### 9. Update WeightLog Page

**File**: `src/pages/WeightLog.tsx`

Same pattern as FoodLog:

```typescript
// New imports
import { detectRepeatedWeightEntry, isDismissed, dismissSuggestion,
         shouldShowOptOutLink, WeightSaveSuggestion } from '@/lib/repeated-entry-detection';
import { useRecentWeightEntries } from '@/hooks/useRecentWeightEntries';

// New hook call
const { data: recentWeightEntries } = useRecentWeightEntries(90);

// New state and detection logic (parallel to FoodLog)

// Check settings.suggestRoutineSaves instead of suggestMealSaves
```

### 10. Update Settings Page

**File**: `src/pages/Settings.tsx`

Add toggles at the bottom of each section:

```typescript
// In Saved Meals section, after the meals list:
{!isReadOnly && (
  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
    <p className="text-xs text-muted-foreground">Suggest saves</p>
    <button
      onClick={() => updateSettings({ suggestMealSaves: !settings.suggestMealSaves })}
      className={cn(
        "w-12 h-6 rounded-full transition-colors relative border",
        settings.suggestMealSaves ? "bg-primary border-primary" : "bg-muted border-border"
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
          settings.suggestMealSaves 
            ? "translate-x-6 bg-primary-foreground" 
            : "translate-x-0.5 bg-white"
        )}
      />
    </button>
  </div>
)}

// Same pattern in Saved Routines section with suggestRoutineSaves
```

---

## Files Summary

| File | Type | Description |
|------|------|-------------|
| `src/hooks/useUserSettings.ts` | Modify | Add `suggestMealSaves` and `suggestRoutineSaves` booleans |
| `src/lib/repeated-entry-detection.ts` | New | Detection algorithms + dismissal tracking with count |
| `src/hooks/useRecentWeightEntries.ts` | New | Fetch 90 days of weight entries grouped by entry_id |
| `src/hooks/useRecentFoodEntries.ts` | Modify | Add `source_meal_id` to select and mapping |
| `src/components/SaveSuggestionPrompt.tsx` | New | Editable prompt with progressive opt-out |
| `src/components/CreateMealDialog.tsx` | Modify | Add `initialItems` prop for pre-population |
| `src/components/CreateRoutineDialog.tsx` | Modify | Add `initialExercises` prop for pre-population |
| `src/pages/FoodLog.tsx` | Modify | Add detection + prompt after entry creation |
| `src/pages/WeightLog.tsx` | Modify | Add detection + prompt after entry creation |
| `src/pages/Settings.tsx` | Modify | Add toggles in Saved Meals/Routines sections |

---

## Algorithm Details

### Food Similarity (both criteria must pass)

```typescript
function detectRepeatedFoodEntry(
  newItems: FoodItem[],
  recentEntries: FoodEntry[],
  minMatches = 2
): FoodSaveSuggestion | null {
  const newDescription = newItems.map(i => i.description).join(' ');
  const newCalories = newItems.reduce((sum, i) => sum + i.calories, 0);
  const newSignature = preprocessText(newDescription);
  
  // Filter out entries from saved meals
  const manualEntries = recentEntries.filter(e => !e.source_meal_id);
  
  const matches = manualEntries.filter(entry => {
    const historyDesc = entry.food_items.map(i => i.description).join(' ');
    const historyCal = entry.total_calories;
    
    // 1. Text similarity check (Jaccard >= 0.4)
    const textSim = jaccardSimilarity(
      preprocessText(newDescription),
      preprocessText(historyDesc)
    );
    if (textSim < 0.4) return false;
    
    // 2. Macro similarity check (within 40%)
    const calDiff = Math.abs(newCalories - historyCal) / Math.max(historyCal, 1);
    return calDiff <= 0.4;
  });
  
  if (matches.length >= minMatches) {
    return {
      matchCount: matches.length + 1, // +1 for the new entry
      signatureHash: hashSignature(newSignature),
      items: newItems,
    };
  }
  return null;
}
```

### Weight Similarity (exercise keys only)

```typescript
function detectRepeatedWeightEntry(
  newExercises: AnalyzedExercise[],
  recentEntries: WeightEntryGrouped[],
  minMatches = 2
): WeightSaveSuggestion | null {
  const newKeys = new Set(newExercises.map(e => e.exercise_key));
  
  // Filter out entries from saved routines
  const manualEntries = recentEntries.filter(e => !e.source_routine_id);
  
  const matches = manualEntries.filter(entry => {
    const historyKeys = entry.exercise_keys;
    
    // Jaccard similarity on exercise key sets
    const intersection = [...newKeys].filter(k => historyKeys.has(k)).length;
    const union = new Set([...newKeys, ...historyKeys]).size;
    const similarity = intersection / union;
    
    return similarity >= 0.7;
  });
  
  if (matches.length >= minMatches) {
    return {
      matchCount: matches.length + 1,
      signatureHash: hashExerciseKeys(newKeys),
      exercises: newExercises,
    };
  }
  return null;
}
```

---

## Edge Cases

- **New users**: No suggestions until 2+ similar manual entries exist
- **Saved meal/routine usage**: Entries with `source_meal_id` or `source_routine_id` excluded from count
- **Demo mode**: Skip detection entirely (read-only users can't save)
- **Independent control**: User can disable meal suggestions but keep routine suggestions or vice versa
- **Progressive disclosure**: "Don't suggest saves" link only appears after 3+ "Not Now" clicks
- **Auto-dismiss on input**: Clear suggestion when user starts new logging action

