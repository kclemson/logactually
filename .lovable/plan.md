

# Remove section grouping from food detail fields

## Problem

The food fields are split into two sections: "Basic" (Name, Portion) and "Nutrition" (Calories onward). Each section renders in its own grid container, which causes the Calories row to be crammed right below Portion in a new grid block instead of flowing naturally in the two-column layout.

## Fix

Remove the `section` property from all food fields in `buildFoodDetailFields`. When no section is specified, all fields land in a single unnamed section and render in one continuous grid. Name and Portion still span `col-span-2` (because they're `type: 'text'`), and the numeric fields flow into the two-column grid naturally after them.

## Technical details

**File: `src/components/DetailDialog.tsx`** -- `buildFoodDetailFields` (lines 536-549)

Remove `section: 'Basic'` from the Name and Portion fields, and `section: 'Nutrition'` from all the numeric fields. The result:

```tsx
export function buildFoodDetailFields(item: Record<string, any>): FieldConfig[] {
  return [
    { key: 'description', label: 'Name', type: 'text' },
    { key: 'portion', label: 'Portion', type: 'text', maxWidth: 'sm' },
    { key: 'calories', label: 'Calories', type: 'number', unit: 'cal', min: 0 },
    { key: 'protein', label: 'Protein', type: 'number', unit: 'g', min: 0 },
    { key: 'carbs', label: 'Carbs', type: 'number', unit: 'g', min: 0 },
    { key: 'fiber', label: 'Fiber', type: 'number', unit: 'g', min: 0 },
    { key: 'sugar', label: 'Sugar', type: 'number', unit: 'g', min: 0 },
    { key: 'fat', label: 'Fat', type: 'number', unit: 'g', min: 0 },
    { key: 'saturated_fat', label: 'Saturated Fat', type: 'number', unit: 'g', min: 0 },
    { key: 'sodium', label: 'Sodium', type: 'number', unit: 'mg', min: 0 },
    { key: 'cholesterol', label: 'Cholesterol', type: 'number', unit: 'mg', min: 0 },
  ];
}
```

One file, one function -- just delete the `section` keys. Everything else (grid layout, label alignment, input widths) stays the same.
