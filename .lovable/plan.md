

## Extend Prompt Eval Tools for Weights Testing

Add support for testing `analyze-weights` alongside `analyze-food` in the DevTools panel, using dropdown menus for compact controls, with table styling improvements.

---

### Overview

| Current | Proposed |
|---------|----------|
| Radio buttons for Prompt and Routing | Dropdown menus for Test Type, Prompt, and Routing |
| Food-only testing | Support both Food and Weights testing |
| font-mono on Input cell | Consistent font-face across all columns |
| Unlimited Input lines | Cap at 5 lines with `line-clamp-5` |

---

### Technical Changes

#### 1. Add Select UI Component

Create a new shadcn/ui select component for dropdown menus.

**File: `src/components/ui/select.tsx`** (new)

Standard Radix UI Select component with proper styling and z-index for the content dropdown.

---

#### 2. Update DevToolsPanel UI

**File: `src/components/DevToolsPanel.tsx`**

**Add Imports:**
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

**Add Test Type State:**
```typescript
const [testType, setTestType] = useState<'food' | 'weights'>('food');
```

**Add Exercise Output Interface:**
```typescript
interface ExerciseItemOutput {
  exercise_key: string;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_minutes?: number | null;
  distance_miles?: number | null;
}
```

**Update TestResult Interface:**
```typescript
interface TestResult {
  // ... existing fields
  output: { 
    food_items?: FoodItemOutput[];
    exercises?: ExerciseItemOutput[];
  } | null;
}
```

**Replace Radio Buttons with Dropdowns:**
```tsx
{/* Test Type */}
<Select value={testType} onValueChange={(v) => setTestType(v as 'food' | 'weights')}>
  <SelectTrigger className="w-24 h-7 text-xs">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="food">Food</SelectItem>
    <SelectItem value="weights">Weights</SelectItem>
  </SelectContent>
</Select>

{/* Prompt Version */}
<Select value={promptVersion} onValueChange={(v) => setPromptVersion(v as 'default' | 'experimental')}>
  <SelectTrigger className="w-28 h-7 text-xs">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="default">Default</SelectItem>
    <SelectItem value="experimental">Experimental</SelectItem>
  </SelectContent>
</Select>

{/* Routing (only for food) */}
{testType === 'food' && (
  <Select value={routingMode} onValueChange={(v) => setRoutingMode(v as 'client' | 'ai-only')}>
    <SelectTrigger className="w-24 h-7 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="client">Client</SelectItem>
      <SelectItem value="ai-only">AI Only</SelectItem>
    </SelectContent>
  </Select>
)}
```

**Table Styling Fixes:**

Remove `font-mono` from Input cell and add 5-line cap:
```tsx
// Before
<td className="px-1 py-1 font-mono text-xs" ...>
  <div className="break-words">{result.input}</div>
</td>

// After
<td className="px-1 py-1 text-xs" ...>
  <div className="break-words line-clamp-5">{result.input}</div>
</td>
```

**Conditional Table Columns:**

Render different column headers and cells based on `testType`:
- Food: Desc, Portion, Cal, P, C, Fb, Sg, F, SF, Na, Ch, Conf, Note
- Weights: Exercise, Sets, Reps, Weight, Duration, Distance

**Update runTests to pass testType:**
```typescript
body: { 
  testCases: [{ input: testCase.input, source }], 
  promptVersion, 
  iterations: 1,
  testType,
},
```

---

#### 3. Update run-prompt-tests Edge Function

**File: `supabase/functions/run-prompt-tests/index.ts`**

**Accept testType Parameter:**
```typescript
const { testCases, promptVersion = 'default', iterations = 1, testType = 'food' } = await req.json();
```

**Route to Correct Function:**
```typescript
const functionName = testType === 'weights' ? 'analyze-weights' : 'analyze-food';
const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`;
```

**Handle Different Response Shapes:**
```typescript
// For food responses
if (testType === 'food') {
  actual_output = { food_items: data.food_items };
}
// For weights responses
else {
  actual_output = { exercises: data.exercises };
}
```

---

### Results Table Layout

**Food Mode (existing columns):**
| Input | Source | Prompt | Desc | Portion | Cal | P | C | Fb | Sg | F | SF | Na | Ch | Conf | Note |

**Weights Mode (new columns):**
| Input | Source | Prompt | Exercise | Sets | Reps | Weight | Duration | Distance |

---

### Summary of Files Changed

| File | Changes |
|------|---------|
| `src/components/ui/select.tsx` | New shadcn/ui Select component |
| `src/components/DevToolsPanel.tsx` | Add testType dropdown, replace radio buttons with selects, conditional columns, styling fixes |
| `supabase/functions/run-prompt-tests/index.ts` | Accept testType param, route to correct function, handle different response shapes |

---

### Notes

- Routing mode dropdown only shows for Food mode (UPC lookup doesn't apply to weights)
- Historical results will display whichever fields are present in the output
- The weights table won't show food-specific columns (Cal, P, C, etc.) and vice versa

