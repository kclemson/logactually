

# Apply consistent label alignment and compact inputs to the food detail dialog

## What changes

The food detail dialog currently has no `labelClassName`, so labels are natural width and inputs don't align vertically. The portion field stretches full width unnecessarily. We'll apply the same alignment pattern used for exercise dialogs, plus constrain the portion input.

## Changes

### 1. FoodLog.tsx -- pass `labelClassName` to both food DetailDialog usages

Add `labelClassName="min-w-[5.5rem]"` to both the group-mode and single-mode DetailDialog calls (lines 863 and 882). "Saturated Fat:" is the longest left-column label; 5.5rem accommodates it. The right column's longest label ("Sodium:") is shorter, so the same min-width works for both columns -- inputs will align at the same offset within each column.

### 2. DetailDialog.tsx -- constrain portion (text) input width

Currently all `type === 'text'` fields get `flex-1 min-w-0` and `col-span-2`. The Name field should stay full-width, but the Portion field doesn't need that much space. 

Add a `maxWidth` optional property to `FieldConfig`. Set `maxWidth: 'sm'` on the portion field in `buildFoodDetailFields`. In `FieldEditGrid`, when `field.maxWidth === 'sm'`, apply `max-w-[12rem]` instead of no constraint, keeping the input reasonably sized (about 12rem / 192px -- enough for "2 medium pieces" but not stretching edge to edge).

### Technical details

**`src/types/food.ts` or `src/components/DetailDialog.tsx`** -- FieldConfig interface:
- Add `maxWidth?: 'sm'` to FieldConfig

**`src/components/DetailDialog.tsx`** -- buildFoodDetailFields:
```tsx
{ key: 'portion', label: 'Portion', type: 'text', section: 'Basic', maxWidth: 'sm' },
```

**`src/components/DetailDialog.tsx`** -- FieldEditGrid input className (line 231):
```tsx
// Before
field.type === 'number' ? "w-12 text-center" : "flex-1 min-w-0"

// After  
field.type === 'number' ? "w-12 text-center" : cn("flex-1 min-w-0", field.maxWidth === 'sm' && "max-w-[12rem]")
```

**`src/pages/FoodLog.tsx`** -- both DetailDialog usages (lines 863, 882):
```tsx
labelClassName="min-w-[5.5rem]"
```

Four small edits across two files. Exercise dialog is unaffected (already has its own labelClassName).
