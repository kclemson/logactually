

# Fix: Only write back fields the user actually edited in DetailDialog

## Problem
When you open the detail dialog and toggle a unit (e.g. mi to km) without changing the number, the save logic still converts the displayed value back to storage units and writes it. The round-trip conversion (2dp display rounding, then 4dp back-conversion) introduces floating-point drift.

## Insight
The current code copies ALL values into `draft` when entering edit mode, then on save it compares every draft value against the original. For unit-toggle fields, the draft starts with a rounded converted value, so the comparison always detects a "change" even when the user didn't touch anything.

The cleaner fix: track which fields the user actually typed into, and only write those back. This works uniformly for all fields, not just unit-toggle ones.

## Why this is safe
- All user input goes through `updateDraft()` (selects, text inputs, number inputs)
- Unit toggling uses `setDraft()` directly -- it's a display-only recalculation, not a user edit
- The initial `enterEditMode` / `enterItemEdit` also use `setDraft()` directly
- So `updateDraft` is already the single funnel for real user edits

## Technical Details

**File: `src/components/DetailDialog.tsx`**

### 1. Add a `dirtyKeys` state (next to the existing `draft` state, line 378)
```typescript
const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
```

### 2. Update `updateDraft` to also record the key (line 543)
```typescript
const updateDraft = (key: string, value: any) => {
  setDirtyKeys(prev => new Set(prev).add(key));
  setDraft(prev => ({ ...prev, [key]: value }));
};
```

### 3. Clear `dirtyKeys` alongside `draft` in all reset points
Add `setDirtyKeys(new Set())` next to every `setDraft({})` call:
- `handleOpenChange` (line 415)
- `cancelEdit` (line 440)
- `handleSave` (line 474)
- `toggleExpanded` collapse branch (line 486)
- `enterItemEdit` (line 506) -- reset before new edit
- `cancelItemEdit` (line 513)
- `saveItemEdit` (line 540)

### 4. In `handleSave`, skip non-dirty fields (line 446-448)
```typescript
for (const field of fieldsFlat) {
  if (field.readOnly) continue;
  if (!dirtyKeys.has(field.key)) continue;  // <-- new line
  const edited = draft[field.key];
  if (edited === undefined) continue;
  // ... rest stays the same
}
```

### 5. In `saveItemEdit`, same change (line 520-523)
```typescript
for (const field of itemFieldsFlat) {
  if (field.readOnly) continue;
  if (!dirtyKeys.has(field.key)) continue;  // <-- new line
  const edited = draft[field.key];
  if (edited === undefined) continue;
  // ... rest stays the same
}
```

### 6. In the second loop of `handleSave` (line 463), also check dirtyKeys
```typescript
for (const [key, val] of Object.entries(draft)) {
  if (key.startsWith('_')) continue;
  if (!dirtyKeys.has(key)) continue;  // <-- new line
  if (updates[key] !== undefined) continue;
  if (val !== values[key]) {
    updates[key] = val;
  }
}
```

## What this fixes
- Unit toggling without editing no longer causes phantom writes
- No floating-point drift from round-trip conversions
- Works uniformly for all fields (distance, speed, weight, and any future unit-toggle fields)
- Zero risk of breaking existing behavior since we're only skipping writes for things the user never touched
