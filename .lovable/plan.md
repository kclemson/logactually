
## Remove Redundant useEffects

Following the project's event-driven architecture pattern, we can eliminate several unnecessary useEffects that sync state when simpler approaches exist.

---

### Changes Summary

| File | Change | Rationale |
|------|--------|-----------|
| **SaveRoutineDialog.tsx** | Remove reset useEffect, use `useState` initializer | Component unmounts on close anyway |
| **SaveMealDialog.tsx** | Remove reset useEffect, keep the async name sync one | Component unmounts on close anyway |
| **CollapsibleSection.tsx** | Move localStorage persist to click handler | Event-driven is simpler |

---

### 1. SaveRoutineDialog.tsx

**Remove lines 46-52 (the reset useEffect):**

Since this dialog is conditionally rendered (`{saveRoutineDialogData && <SaveRoutineDialog />}`), it unmounts when closed. When it remounts, `useState` initializes fresh. We just need to compute the initial value correctly:

```tsx
// Before
const [name, setName] = useState('');
const [userHasTyped, setUserHasTyped] = useState(false);

useEffect(() => {
  if (open) {
    setName(getDefaultName(exerciseSets));
    setUserHasTyped(false);
  }
}, [open, exerciseSets]);

// After - use useState initializer function
const [name, setName] = useState(() => getDefaultName(exerciseSets));
const [userHasTyped, setUserHasTyped] = useState(false);
// No useEffect needed - state is fresh on each mount
```

---

### 2. SaveMealDialog.tsx

**Remove lines 53-59 (the reset useEffect), keep lines 61-69 (async name suggestion):**

Same pattern - the dialog unmounts on close, so reset is unnecessary. But we must keep the second useEffect that handles the async `suggestedName` prop arriving after mount.

```tsx
// Before
const [name, setName] = useState('');

useEffect(() => {
  if (open) {
    setName('');
    setUserHasTyped(false);
  }
}, [open]);

// After - just remove the reset useEffect
const [name, setName] = useState('');  // Fresh on each mount
const [userHasTyped, setUserHasTyped] = useState(false);  // Fresh on each mount

// KEEP: This one handles async prop updates
useEffect(() => {
  if (!userHasTyped && suggestedName) {
    setName(suggestedName);
  } else if (!userHasTyped && !isSuggestingName && !suggestedName && foodItems.length > 0) {
    setName(getFallbackName(foodItems));
  }
}, [suggestedName, isSuggestingName, userHasTyped, foodItems]);
```

---

### 3. CollapsibleSection.tsx

**Move localStorage persist from useEffect to click handler:**

```tsx
// Before
useEffect(() => {
  if (isOpen !== defaultOpen) {
    localStorage.setItem(key, String(isOpen));
  } else {
    localStorage.removeItem(key);
  }
}, [key, isOpen, defaultOpen]);

// After - persist in the toggle handler
const handleToggle = () => {
  const newValue = !isOpen;
  setIsOpen(newValue);
  
  // Persist to localStorage
  if (newValue !== defaultOpen) {
    localStorage.setItem(key, String(newValue));
  } else {
    localStorage.removeItem(key);
  }
};
```

Then update the onClick to use `handleToggle` instead of inline `() => setIsOpen(!isOpen)`.

---

### What We're NOT Changing

| File | Reason to Keep |
|------|----------------|
| **Settings.tsx** `setMounted` | Required by next-themes for hydration |
| **Layout.tsx** theme sync | Just added, handles new device scenario |
| **useAuth.tsx** | External subscription (Supabase auth listener) |
| **useUserSettings.ts** | Data fetching - could convert to React Query later |
| **use-mobile.tsx** | External subscription (media query) |
| **BarcodeScanner.tsx** | Hardware resource lifecycle |
| **NotFound.tsx** | Harmless logging, not worth refactoring |
| **FoodLog/WeightLog pending entry** | Would require complex alternative |
| **SaveMealDialog async name** | Legitimate async prop handling |

---

### Files to Modify

1. `src/components/SaveRoutineDialog.tsx` - Remove useEffect, use useState initializer
2. `src/components/SaveMealDialog.tsx` - Remove first useEffect only  
3. `src/components/CollapsibleSection.tsx` - Move persist logic to handler
