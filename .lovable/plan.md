
## Remove Chart Borders and Update Color Palette

Make two visual improvements to the Trends page charts.

---

### Change 1: Remove Chart Card Borders

Currently all chart cards use the standard `Card` component which has `border` in its className. Override this by adding `border-0 shadow-none` to remove the visual borders and shadows from chart cards.

**Affected Cards:**
- Average stats row (4 cards)
- Calories chart
- Macro Split chart
- Protein/Carbs/Fat charts (3 cards)
- Exercise charts (ExerciseChart component)

**Implementation:**

Add `className="border-0 shadow-none"` to each chart Card:

```tsx
// Average stats cards
<Card key={key} className="text-center border-0 shadow-none">

// Chart cards
<Card className="border-0 shadow-none">

// ExerciseChart component
<Card className="border-0 shadow-none">
```

---

### Change 2: Update Color Palette

Replace current colors with the complementary 4-color palette from the reference image.

**Current Colors:**
| Macro | Current Color |
|-------|---------------|
| Calories | #0033CC (Deep Blue) |
| Protein | #43EBD7 (Teal) |
| Carbs | #9933FF (Purple) |
| Fat | #00CCFF (Cyan) |

**New Colors (from reference image, left to right):**
| Macro | New Color | Description |
|-------|-----------|-------------|
| Calories | #0033CC | Deep Blue (keep) |
| Protein | #115E83 | Steel Blue |
| Carbs | #00D4FF | Bright Cyan |
| Fat | #B8F4FF | Light Cyan |

These colors work on both light and dark backgrounds as shown in the reference image.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Remove borders from all Card components, update `charts` array colors, update Macro Split chart bar colors |

---

### Code Changes

**1. Update charts array (line 263-268):**
```tsx
const charts = [
  { key: 'calories', label: 'Calories', color: '#0033CC' },
  { key: 'protein', label: 'Protein (g)', color: '#115E83' },
  { key: 'carbs', label: 'Carbs (g)', color: '#00D4FF' },
  { key: 'fat', label: 'Fat (g)', color: '#B8F4FF' },
];
```

**2. Update Macro Split stacked bars (lines 369-371):**
```tsx
<Bar dataKey="proteinPct" name="Protein" stackId="macros" fill="#115E83" />
<Bar dataKey="carbsPct" name="Carbs" stackId="macros" fill="#00D4FF" />
<Bar dataKey="fatPct" name="Fat" stackId="macros" fill="#B8F4FF" radius={[2, 2, 0, 0]} />
```

**3. Add border-0 shadow-none to all chart Cards:**
- Line 289: Average stats cards
- Line 315: Calories chart card
- Line 345: Macro Split chart card
- Line 382: P/C/F chart cards
- Line 125 (ExerciseChart): Exercise chart card

---

### Visual Result

Before (many bordered boxes):
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Avg Cal │ │ Avg Pro │ │ Avg Crb │ │ Avg Fat │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
┌─────────────────┐ ┌─────────────────┐
│   Calories      │ │   Macro Split   │
└─────────────────┘ └─────────────────┘
```

After (cleaner, borderless):
```
  Avg Cal    Avg Pro    Avg Crb    Avg Fat
  
  Calories             Macro Split
  ▐█▌ ▐█▌ ▐█▌          ████████████
```

Color palette shifts from purple/teal mix to a harmonious blue-cyan gradient that works in both light and dark modes.
