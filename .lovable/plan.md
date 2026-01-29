

## Apply Weight Unit Setting to Weight Log Display

### Overview

Update the `WeightItemsTable` component to respect the user's weight unit preference (lbs vs kg). Currently the values are hardcoded to display in pounds even when the user has selected kilograms in Settings.

---

### Changes Required

**1. WeightItemsTable.tsx - Add weight unit support**

Accept a new `weightUnit` prop and use conversion utilities:

| Location | Current | Updated |
|----------|---------|---------|
| Props interface | - | Add `weightUnit?: WeightUnit` |
| Column header (line 267, 278) | `"Lbs"` | Dynamic: `getWeightUnitLabel(weightUnit)` |
| Display values | `item.weight_lbs` | `formatWeight(item.weight_lbs, weightUnit, 0)` |
| Totals volume | `totals.volume` | Convert using the unit |
| Input handling | Save value directly | Convert kg input to lbs via `parseWeightToLbs()` |

**2. WeightLog.tsx - Pass weight unit to table**

```typescript
import { useUserSettings } from '@/hooks/useUserSettings';
import type { WeightUnit } from '@/lib/weight-units';

// In component:
const { settings } = useUserSettings();

// Pass to table:
<WeightItemsTable
  items={displayItems}
  weightUnit={settings.weightUnit}
  // ... other props
/>
```

---

### Conversion Logic

The database stores all weights in pounds (`weight_lbs`). Display conversion:

```text
Display (kg setting):  weight_lbs × 0.453592 = displayed kg
Input (kg setting):    user_input × 2.20462 = stored lbs
```

For precision:
- lbs: Display as whole numbers (0 decimals)
- kg: Display with 1 decimal place for accuracy

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/WeightItemsTable.tsx` | Add `weightUnit` prop, convert display/input values, dynamic header |
| `src/pages/WeightLog.tsx` | Import `useUserSettings`, pass `weightUnit` to table |

