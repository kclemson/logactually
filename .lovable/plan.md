

## Ask AI About Your Trends -- Full Plan

### Overview

Adds an "Ask AI" link to the Food Trends and Exercise Trends section headers on the Trends page. Clicking it opens a shared dialog where users can ask questions about their data. The system sends the question plus the user's last 90 days of historical data to an AI model and displays the response.

### User Experience

1. Each CollapsibleSection header gets a small "Ask AI" link via the existing `headerAction` slot
2. Clicking opens a Dialog containing:
   - Title: "Ask AI about your food trends" / "Ask AI about your exercise trends"
   - 3-4 randomly selected prompt chips from a library of ~15-20 per mode
   - A text input (Enter to send)
   - Loading spinner while waiting
   - AI response displayed as text
   - Option to ask another question
3. **Both modes**: If the user has configured any biometric data (weight, height, age, body composition), a checkbox appears:
   - "Include my stats for a more personalized answer (150 lbs, 5'1", 48 years old, male)"
   - Shows only the fields actually configured
   - Hidden entirely if no biometric fields are set
   - Default: checked

### Cost Estimate

- Food context: ~800 input tokens for 90 days of daily totals
- Exercise context: ~3K input tokens for 90 days of sets
- System prompt + question: ~500 tokens
- Response: ~300-500 tokens
- Total per query: ~1.5-4K tokens -- fractions of a cent with Gemini Flash

### Architecture: Shared Code

The dialog, hook, and edge function are all mode-agnostic. A single `mode: "food" | "exercise"` prop flows through the entire call chain:

```text
Trends.tsx
  -> AskTrendsAIDialog (mode="food" | "exercise")
       -> useAskTrendsAI hook (passes mode to edge function)
            -> ask-trends-ai edge function (fetches data based on mode)
```

There is one dialog component, one hook, and one edge function. Mode-specific behavior (which table to query, which prompt chips to show, title text) is driven by the `mode` prop/parameter -- no duplicated code paths.

### Technical Details

#### 1. Shared helpers in `src/lib/calorie-burn.ts`

**Extract** `formatInchesAsFeetInches` from `CalorieBurnDialog.tsx` to `calorie-burn.ts` as an export.

**Add** a new exported function:

```text
formatProfileStatsSummary(settings: UserSettings): string | null
```

- Collects non-null biometric fields into an array:
  - Weight: "150 lbs"
  - Height: "5'1\"" (or "170 cm" if heightUnit is cm)
  - Age: "48 years old"
  - Body composition: "male" / "female"
- Returns null if no fields are set (signals: hide checkbox)
- Returns parts joined with ", "

#### 2. Update `src/components/CalorieBurnDialog.tsx`

- Remove local `formatInchesAsFeetInches`
- Import from `@/lib/calorie-burn`
- No other changes

#### 3. Edge function: `supabase/functions/ask-trends-ai/index.ts`

- Auth: validate JWT via `getClaims` (same pattern as existing functions)
- Input: `{ question: string, mode: "food" | "exercise", includeProfile?: boolean }`
- Validation: question max 500 chars, mode must be "food" or "exercise"
- Data fetching (user's auth token, RLS applies):
  - **Food mode**: `food_entries` last 90 days -- `eaten_date, food_items` (JSONB with per-item calories, protein, carbs, fiber, sugar, fat, saturated_fat, sodium, cholesterol, description, portion), `total_calories, total_protein, total_carbs, total_fat`
  - **Exercise mode**: `weight_sets` last 90 days -- `logged_date, exercise_key, exercise_subtype, description, sets, reps, weight_lbs, duration_minutes, distance_miles, exercise_metadata` (effort, incline_pct, calories_burned)
  - **Profile** (if `includeProfile` true): `profiles.settings` JSONB for bodyWeightLbs, heightInches, age, bodyComposition, defaultIntensity
- Builds system prompt: fitness/nutrition analyst, reference data points, concise answers, no medical advice
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`), non-streaming
- Handles 429/402 errors
- Returns `{ answer: string }`

#### 4. Hook: `src/hooks/useAskTrendsAI.ts`

- `useMutation` wrapping `supabase.functions.invoke('ask-trends-ai', { body: { question, mode, includeProfile } })`
- Returns `{ mutate, isPending, data, error, reset }`

#### 5. Component: `src/components/AskTrendsAIDialog.tsx`

- Props: `mode: "food" | "exercise"`, `open: boolean`, `onOpenChange: (open: boolean) => void`
- Reads `settings` from `useUserSettings()`
- Computes `profileSummary` via `formatProfileStatsSummary(settings)` -- used in both modes
- Maintains prompt chip libraries (~15-20 per mode); randomly selects 3-4 on each open
- Contains:
  - Dialog title (derived from `mode`)
  - Prompt chips (clickable, fill the input)
  - Text input + Enter to send
  - "Include my stats" checkbox with inline summary (shown in both food and exercise mode, only if `profileSummary` is non-null, default checked)
  - Loading spinner
  - AI response area
  - "Ask another" to reset
- Resets state when dialog closes via conditional rendering

#### 6. Update `src/pages/Trends.tsx`

- Import `AskTrendsAIDialog`
- Add state: `foodAIOpen`, `exerciseAIOpen`
- Pass "Ask AI" link as `headerAction` to both CollapsibleSections
- Render the dialog instances conditionally

#### 7. Update `supabase/config.toml`

- Add `[functions.ask-trends-ai]` with `verify_jwt = false`

### Files Summary

| File | Action |
|------|--------|
| `src/lib/calorie-burn.ts` | Modify -- add `formatInchesAsFeetInches` export + `formatProfileStatsSummary` |
| `src/components/CalorieBurnDialog.tsx` | Modify -- import `formatInchesAsFeetInches` from shared module |
| `supabase/functions/ask-trends-ai/index.ts` | Create |
| `src/hooks/useAskTrendsAI.ts` | Create |
| `src/components/AskTrendsAIDialog.tsx` | Create |
| `src/pages/Trends.tsx` | Modify -- add headerAction links + dialog state |
| `supabase/config.toml` | Modify -- add function entry |

