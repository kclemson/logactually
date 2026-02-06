

## Plan: Style Submit Buttons with Colors and Update Selected Date Styling

### Overview
Update the "Add Food" / "Adding..." button to have a blue background and the "Add Exercise" / "Adding..." button to have a purple background. Additionally, change the currently selected date in the calendar from a blue background (`bg-primary`) to a white underline instead.

### Changes Required

---

### Part 1: Colored Submit Buttons in LogInput

**File**: `src/components/LogInput.tsx`

Currently, the submit button uses the default Button styling (line 347):
```tsx
<Button onClick={handleSubmit} disabled={!text.trim() || isBusy} size="sm" className="flex-1 px-2">
```

**Change**: Add mode-aware background color classes:
- Food mode: `bg-blue-600 hover:bg-blue-700 text-white`
- Weights mode: `bg-purple-600 hover:bg-purple-700 text-white`

Update to:
```tsx
<Button 
  onClick={handleSubmit} 
  disabled={!text.trim() || isBusy} 
  size="sm" 
  className={cn(
    "flex-1 px-2",
    mode === 'food' 
      ? "bg-blue-600 hover:bg-blue-700 text-white" 
      : "bg-purple-600 hover:bg-purple-700 text-white"
  )}
>
```

This applies to both the "Add Food" / "Add Exercise" labels AND the "Adding..." / loader states since they share the same button.

---

### Part 2: Selected Date Styling - White Underline

**File**: `src/components/ui/calendar.tsx`

Currently, the selected date uses (line 42-43):
```tsx
day_selected:
  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
```

**Change**: Replace background with a white underline indicator:
```tsx
day_selected:
  "bg-transparent underline decoration-2 underline-offset-4 decoration-white hover:bg-transparent focus:bg-transparent",
```

**Note**: This changes the selected day to have no background but a thick white underline beneath the date number. The text will maintain its default foreground color, and "hasData" modifiers (blue for food, purple for weights) will still show through since we're not overriding the text color.

---

### Summary of Files to Modify

| File | Change |
|------|--------|
| `src/components/LogInput.tsx` | Add mode-aware blue/purple background to submit button |
| `src/components/ui/calendar.tsx` | Replace `day_selected` background with white underline |

### Visual Result
- Food page: Blue "Add Food" / "Adding..." button
- Weights page: Purple "Add Exercise" / "Adding..." button  
- Calendar: Selected date shows a white underline instead of a filled background, allowing the date's text color (blue/purple for dates with data) to remain visible

