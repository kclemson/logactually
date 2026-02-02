

## Add Admin UI for Populate Demo Data Edge Function

### Overview
Add a button to the Admin page that opens a dialog for running the `populate-demo-data` edge function with customizable parameters.

---

### Current Parameters (from edge function)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startDate` | string | 90 days ago | Start of date range |
| `endDate` | string | 30 days from now | End of date range |
| `daysToPopulate` | number | All days in range | How many days to generate data for |
| `generateFood` | boolean | true | Generate food entries |
| `generateWeights` | boolean | true | Generate weight entries |
| `generateSavedMeals` | number | 5 | How many saved meals to create |
| `generateSavedRoutines` | number | 4 | How many saved routines to create |
| `clearExisting` | boolean | false | Delete existing data in range first |
| `food` | object | - | Food generation percentages |
| `weights` | object | - | Weight exercise category percentages |

**Food Config Options:**
- `barcodeScanPercent` (default: 15)
- `shorthandPercent` (default: 40)
- `casualWithTyposPercent` (default: 20)
- `recipeLinksPercent` (default: 5)
- `brandNamesPercent` (default: 20)

**Weight Config Options:**
- `machinePercent` (default: 40)
- `compoundPercent` (default: 30)
- `freeWeightPercent` (default: 30)
- `progressionMultiplier` (default: 1.0)

---

### Recommended UI Fields

For the admin UI, prioritize the most commonly needed controls:

**Essential (always visible):**
1. **Date Range** - Start and End date pickers
2. **Clear Existing** - Checkbox (dangerous, show warning)

**Optional (collapsed/advanced section):**
3. **Generate Food** - Checkbox
4. **Generate Weights** - Checkbox
5. **Days to Populate** - Number input (useful for partial fills)
6. **Saved Meals Count** - Number input
7. **Saved Routines Count** - Number input

**Skip for now:**
- Food/Weight config percentages (advanced tuning, rarely needed)

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add "Populate Demo Data" button and dialog |
| `src/hooks/usePopulateDemoData.ts` (new) | Hook to call the edge function |

---

### UI Design

**Button placement:** Below the feedback section, as a small admin tool

**Dialog contents:**
```text
┌─────────────────────────────────────────────┐
│  Populate Demo Data                         │
├─────────────────────────────────────────────┤
│  Date Range                                 │
│  [Start Date Picker] to [End Date Picker]   │
│                                             │
│  ☑ Clear existing data in range             │
│    ⚠ This will delete existing entries      │
│                                             │
│  Options                                    │
│  ☑ Generate Food    ☑ Generate Weights      │
│  Saved Meals: [5]   Saved Routines: [4]     │
│                                             │
│  [Cancel]                        [Populate] │
└─────────────────────────────────────────────┘
```

**Loading state:** Button shows spinner and disables while running

**Success/Error:** Toast or inline message with summary

---

### Implementation Details

**New hook: `src/hooks/usePopulateDemoData.ts`**
```tsx
interface PopulateDemoDataParams {
  startDate: string;
  endDate: string;
  clearExisting?: boolean;
  generateFood?: boolean;
  generateWeights?: boolean;
  generateSavedMeals?: number;
  generateSavedRoutines?: number;
}

export function usePopulateDemoData() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; summary?: any; error?: string } | null>(null);

  const populate = async (params: PopulateDemoDataParams) => {
    setIsLoading(true);
    setResult(null);
    
    const { data, error } = await supabase.functions.invoke('populate-demo-data', {
      body: params,
    });
    
    setIsLoading(false);
    
    if (error) {
      setResult({ success: false, error: error.message });
    } else {
      setResult({ success: true, summary: data.summary });
    }
  };

  return { populate, isLoading, result };
}
```

**Admin page additions:**
- Import dialog components and date picker
- Add state for dialog open/closed
- Add form state for parameters
- Call hook on submit
- Show result summary

---

### Technical Notes

1. The edge function already has admin auth check built-in
2. Uses `supabase.functions.invoke` which passes the user's auth token
3. Date pickers should default to reasonable ranges (last 90 days to +30 days)
4. Clear existing is the most dangerous option - show a warning

