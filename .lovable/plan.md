

## Add "Create New Saved Meal" Flow from Saved Button

### Overview

This feature addresses user confusion about how to add new saved meals by making the "Saved" button an entry point for meal creation, not just selection. The flow will reuse the existing `FoodInput` component and `FoodItemsTable` to maintain unified code paths.

### User Flow

```text
1. User clicks "Saved" button
2. Popover shows:
   - "Add New Meal" button at top (always visible)
   - Existing saved meals list below
3. User clicks "Add New Meal"
4. Dialog opens with:
   - Meal name input field
   - FoodInput (textarea + Voice/Scan/Add buttons)
   - Custom placeholder: "Describe your meal or list its ingredients"
5. User describes food and clicks Add
6. AI analyzes food, returns items
7. Items displayed using FoodItemsTable (same as FoodLog page)
8. User can edit items if needed
9. User clicks "Save Meal" button
10. Meal is saved to database
11. Prompt appears: "Also add to today's log?"
    - Yes: Logs the meal and closes
    - No: Just closes
```

### Architecture Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Component structure | Create `CreateMealDialog` component | Keeps SavedMealsPopover focused on selection |
| FoodInput reuse | Pass custom `placeholder` prop | Maintains unified code path |
| Results display | Reuse `FoodItemsTable` with `editable={true}` | Same editing UX as FoodLog |
| State location | FoodLog page manages creation state | Same pattern as existing SaveMealDialog |
| Dialog vs Popover | Dialog (modal) for creation | More space for form + results table |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/FoodInput.tsx` | Modify | Add optional `placeholder` prop to override random placeholder |
| `src/components/CreateMealDialog.tsx` | Create | Dialog with meal name + FoodInput + FoodItemsTable |
| `src/components/SavedMealsPopover.tsx` | Modify | Add "Add New Meal" button that emits event |
| `src/pages/FoodLog.tsx` | Modify | Handle create meal dialog state + post-creation prompt |
| `src/pages/Settings.tsx` | Modify | Add "Add New Meal" button to Saved Meals section |

### Implementation Details

#### 1. Modify FoodInput to Accept Custom Placeholder

Add an optional `placeholder` prop that overrides the random selection:

```tsx
interface FoodInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  onScanResult?: (foodItem: ...) => void;
  onLogSavedMeal?: (foodItems: FoodItem[], mealId: string) => void;
  placeholder?: string;  // NEW: optional override
}
```

When `placeholder` is provided, use it instead of the random example. The placeholder text will be:
> "Describe your meal or list its ingredients"

No example foods included - keeps it simple and context-appropriate.

#### 2. Create CreateMealDialog Component

A dialog with three sections:

**Header Section:**
- Meal name input (pre-populated with AI suggestion after analysis)

**Input Section:**
- FoodInput with custom placeholder: "Describe your meal or list its ingredients"
- All existing functionality (voice, scan, barcode detection) works automatically

**Results Section (after analysis):**
- FoodItemsTable with `editable={true}`
- Same editing controls as FoodLog (inline edit calories, description, delete items)
- Uses `useEditableFoodItems` hook for local state management

**Footer Section:**
- "Save Meal" button (enabled after items are returned)
- After save: AlertDialog prompt "Also add to today's log?"

```tsx
interface CreateMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealCreated: (meal: SavedMeal, foodItems: FoodItem[]) => void;
  showLogPrompt?: boolean;  // true on FoodLog page, false on Settings
}
```

State machine inside dialog:
1. **input** - User entering description
2. **analyzing** - FoodInput shows "Adding..." spinner
3. **editing** - Items returned, shown in FoodItemsTable, user can edit
4. **saving** - "Saving meal..." after user clicks Save
5. **prompting** - "Also log to today?" (if showLogPrompt=true)
6. **done** - Close dialog

#### 3. Modify SavedMealsPopover

Add "Add New Meal" button at top of popover:

```tsx
interface SavedMealsPopoverProps {
  onSelectMeal: (foodItems: FoodItem[], mealId: string) => void;
  onClose?: () => void;
  onCreateNew?: () => void;  // NEW
}
```

The button appears always:
- When meals exist: Button at top, then meal list
- When no meals: Button with helper text explaining how it works

#### 4. Update FoodLog Page

Add state for create meal dialog:

```tsx
const [createMealDialogOpen, setCreateMealDialogOpen] = useState(false);
```

Pass `onCreateNew` handler to SavedMealsPopover that opens the dialog.

Handle `onMealCreated` callback to optionally log the meal to today's food log.

#### 5. Add Entry Point in Settings Page

Add "Add" button in Saved Meals section header:

```tsx
<div className="flex items-center justify-between">
  <h3 className="text-heading ...">Saved Meals</h3>
  <Button variant="outline" size="sm" onClick={() => setCreateMealDialogOpen(true)}>
    <Plus className="h-4 w-4 mr-1" />
    Add
  </Button>
</div>
```

Settings page uses `showLogPrompt={false}` since there's no date context.

### Component Structure

```text
FoodLog.tsx
├── FoodInput (main input)
│   └── SavedMealsPopover
│       ├── "Add New Meal" button → emits onCreateNew
│       └── Saved meals list
├── CreateMealDialog (NEW)
│   ├── Meal name input
│   ├── FoodInput (with custom placeholder)
│   ├── FoodItemsTable (editable, same as FoodLog)
│   └── Post-save prompt: "Also log to today?"
└── SaveMealDialog (existing - for saving from entry)

Settings.tsx
├── Saved Meals section
│   ├── "Add" button → opens CreateMealDialog
│   └── Meals list
└── CreateMealDialog (same component, showLogPrompt=false)
```

### CreateMealDialog Internal Flow

```text
┌─────────────────────────────────────────────┐
│  Create New Saved Meal              [X]     │
├─────────────────────────────────────────────┤
│  Meal name: [________________]              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Describe your meal or list its      │   │
│  │ ingredients                         │   │
│  └─────────────────────────────────────┘   │
│  [Voice] [Scan] [Add]                       │
│                                             │
│  ─── After analysis ───                     │
│                                             │
│  Total                    350     15/30/12  │
│  Grilled chicken (6 oz)   280     35/0/8    │
│  Steamed broccoli (1 cup)  70      5/10/1   │
│                                             │
│                        [Save Meal]          │
└─────────────────────────────────────────────┘
```

### Technical Considerations

1. **Unified FoodInput**: By passing a `placeholder` prop, we keep the same component and code path, ensuring UPC detection, voice input, and barcode scanning all work in the create meal context.

2. **Unified FoodItemsTable**: Reusing the same table component ensures:
   - Consistent editing UX (inline calories editing with Enter to save)
   - Same visual styling and responsive layout
   - Delete item functionality works out of the box

3. **Meal name pre-population**: Use the `useSuggestMealName` hook after AI returns items to suggest a name (same pattern as SaveMealDialog).

4. **Dialog sizing**: Use responsive pattern for mobile (same as SaveMealDialog).

5. **Loading states**: 
   - FoodInput shows "Adding..." during analysis
   - Save button shows "Saving..." during database write
   - Then show the log prompt

6. **Editable items state**: Use `useEditableFoodItems` hook within the dialog to manage local edits before saving, matching the FoodLog pattern.

