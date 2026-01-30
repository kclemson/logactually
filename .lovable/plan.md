
## Improve Saved Meals/Routines "Add" Button Layout

### Problem
The current layout places the "Add" buttons for Saved Meals and Saved Routines floating on the far right side of the header row. This creates:
1. **Visual disconnect** - When collapsed, the button appears orphaned from its section
2. **Ambiguity** - The button just says "Add" without specifying what's being added
3. **Poor hierarchy** - Difficult to see that the button relates to its section

### Layout Options to Consider

**Option A: Move button next to section title (inline)**
```
☆ Saved Meals > [+ Add Saved Meal]
```
- Button sits right after the chevron, not floating right
- Keeps everything on one line but grouped together
- Button uses full label "Add Saved Meal"

**Option B: Move button inside section content (first item)**
```
☆ Saved Meals v
  [+ Add Saved Meal]       ← Ghost/outline button as first "row"
  > Banana Bread           1 item 🗑
  > Yogurt + strawberries  2 items 🗑
```
- Button appears as first item when section is expanded
- Invisible when collapsed (cleaner collapsed state)
- Similar pattern to how SavedMealsPopover shows "Add New Meal" as first row

**Option C: Keep floating right but add full labels**
```
☆ Saved Meals v                    [+ Add Saved Meal]
```
- Minimal layout change, just longer button labels
- Still has the disconnect issue but slightly improved

### Recommendation: Option B (Button inside content)

This approach:
- Eliminates the floating disconnect entirely
- Matches the pattern already used in `SavedMealsPopover` (where "Add New Meal" is the first row)
- Creates a cleaner collapsed state
- Button is contextually placed within the list it affects

### Implementation

**File: `src/pages/Settings.tsx`**

1. Remove `headerAction` prop from both CollapsibleSection usages

2. Add the "Add" button as the first item inside the section content, styled as a list row:

```tsx
<CollapsibleSection title="Saved Meals" icon={Star}>
  {/* Add button as first row - visible when section is expanded */}
  {!isReadOnly && (
    <button
      onClick={() => setCreateMealDialogOpen(true)}
      className="w-full text-left py-2 hover:bg-accent/50 transition-colors flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <Plus className="h-4 w-4" />
      <span>Add Saved Meal</span>
    </button>
  )}
  
  {/* Existing meal list... */}
</CollapsibleSection>
```

Same pattern for Saved Routines with "Add Saved Routine" label.

**Visual Result:**
```
☆ Saved Meals v
  + Add Saved Meal
  > Banana Bread           1 item 🗑
  > Yogurt + strawberries  2 items 🗑

🏋 Saved Routines >           (collapsed - no floating button visible)
```

### Alternative if you prefer Option A

If you'd rather keep the button in the header but grouped with the title:

**File: `src/components/CollapsibleSection.tsx`**

Change header layout from `justify-between` to keep action next to title:

```tsx
<div className="flex items-center gap-3">
  <button onClick={handleToggle} ...>
    <Icon /><span>{title}</span><ChevronDown />
  </button>
  {headerAction}
</div>
```

And update button in Settings to use full label:
```tsx
<Button variant="ghost" size="sm">
  <Plus className="h-4 w-4 mr-1" />
  Add Saved Meal
</Button>
```

### Technical Details

- Uses ghost/subtle styling to match existing row patterns
- Maintains consistent padding with existing SavedMealRow/SavedRoutineRow components
- Full labels ("Add Saved Meal" / "Add Saved Routine") provide clear context
- No changes needed to `CollapsibleSection.tsx` for Option B
