

## Update Bottom Navigation: Food Icon & Vertical Layout

Two changes to improve the bottom navigation styling and clarity.

---

### Change 1: Food-Representative Icon

Replace the generic `PenLine` icon for "Log Food" with `Utensils` (fork and knife), which clearly represents food/eating.

**File:** `src/components/BottomNav.tsx`

```tsx
// Before (line 2)
import { PenLine, CalendarDays, TrendingUp, Settings, Shield, Dumbbell } from 'lucide-react';

// After
import { Utensils, CalendarDays, TrendingUp, Settings, Shield, Dumbbell } from 'lucide-react';
```

```tsx
// Before (line 14)
{ to: '/', icon: PenLine, label: 'Log Food' },

// After
{ to: '/', icon: Utensils, label: 'Log Food' },
```

---

### Change 2: Top-Aligned Icons with Multi-Line Labels

Update the layout so icons are always pinned to the top with labels below that can wrap to two lines on narrow screens (e.g., "Log\nFood" and "Log\nWeights").

**Current layout:**
- Uses `items-center` which vertically centers icon+text as a group
- Uses `gap-1` between icon and text

**New layout:**
- Pin icons to top with `justify-start` and `pt-2` for top padding
- Allow labels to wrap naturally with multi-line support
- Set a fixed height for consistent nav appearance

**File:** `src/components/BottomNav.tsx`

```tsx
// Before (lines 28-34)
className={({ isActive }) =>
  cn(
    'flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors',
    isActive
      ? 'text-primary'
      : 'text-muted-foreground hover:text-foreground'
  )
}

// After
className={({ isActive }) =>
  cn(
    'flex flex-1 flex-col items-center pt-2 pb-1.5 h-14 transition-colors',
    isActive
      ? 'text-primary'
      : 'text-muted-foreground hover:text-foreground'
  )
}
```

```tsx
// Before (line 38)
<span className="text-xs text-center">{label}</span>

// After - add mt-1 spacing and leading-tight for multi-line support
<span className="text-xs text-center leading-tight mt-1">{label}</span>
```

---

### Visual Result

| Before | After |
|--------|-------|
| Icon + label vertically centered | Icons at top, labels below |
| "Log Food" single line | "Log Food" can wrap to "Log" + "Food" |
| Single-word labels same | Calendar/Trends/Settings unchanged |
| PenLine icon | Utensils (fork+knife) icon |

---

### Files to Modify

**src/components/BottomNav.tsx**
- Line 2: Replace `PenLine` import with `Utensils`
- Line 14: Update icon reference from `PenLine` to `Utensils`
- Lines 28-34: Update className for top-aligned layout with fixed height
- Line 38: Update label styling for multi-line support

