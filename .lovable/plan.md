

## Improve SimilarMealPrompt UX

### Changes Overview

1. **Add X button** to allow dismissing without choosing an action
2. **Auto-dismiss** when user starts a new input action (scan, voice, saved, or submit)
3. **Update copy** with clearer text
4. **Remove "Save as New"** button to simplify

---

### Header Text Options

| Option | Word Count |
|--------|-----------|
| "This looks like one of your saved meals:" | 8 |
| "Looks like your saved meal:" | 5 |
| "Matches saved meal:" | 3 |

**Recommendation:** "Looks like your saved meal:" - keeps the friendly "looks like" tone while being concise and clearly indicating it's from their saved meals.

---

### Updated Component UI

**Before:**
```
This looks like "Yogurt + strawberries" (88% match)
[ Use Saved ] [ Keep This ] [ Save as New ]
```

**After:**
```
                                                    [X]
Looks like your saved meal: "Yogurt + strawberries" (88%)
[ Use Saved Meal ] [ Dismiss ]
```

---

### Copy Changes Summary

| Element | Current | Proposed |
|---------|---------|----------|
| Header text | `This looks like` | `Looks like your saved meal:` |
| Primary button | `Use Saved` | `Use Saved Meal` |
| Secondary button | `Keep This` | `Dismiss` |
| Third button | `Save as New` | *(removed)* |
| Close button | *(none)* | X button in top-right |

---

### Auto-Dismiss Behavior

The prompt should automatically dismiss when the user takes any of these actions:
- Clicks **Voice** button
- Clicks **Scan** button  
- Clicks **Saved** button (opens saved meals popover)
- Clicks **Add Food** button (submits new input)
- Starts a new barcode scan

**Implementation approach:**
- Add a new `onDismiss` callback prop to `LogInput` component
- Call it at the start of: `toggleListening`, `setScannerOpen(true)`, `setSavedMealsOpen(true)`, and `handleSubmit`
- In `FoodLog.tsx`, pass a callback that clears `similarMatch` and `pendingAiResult`

This is cleaner than having FoodLog try to detect state changes in LogInput.

---

### Technical Changes

**File: `src/components/SimilarMealPrompt.tsx`**

| Change | Description |
|--------|-------------|
| Add `onDismiss` prop | New optional prop for X button and parent-triggered dismiss |
| Remove `onSaveAsNew` prop | No longer needed |
| Add X button | Position absolute in top-right corner |
| Update header text | "Looks like your saved meal:" |
| Update button labels | "Use Saved Meal" and "Dismiss" |
| Remove third button | Delete the "Save as New" button entirely |

**File: `src/components/LogInput.tsx`**

| Change | Description |
|--------|-------------|
| Add `onDismissSimilarMatch` prop | Optional callback for auto-dismiss |
| Call dismiss on Voice click | Call before starting voice |
| Call dismiss on Scan click | Call before opening scanner |
| Call dismiss on Saved click | Call before opening popover |
| Call dismiss on Submit | Call at start of handleSubmit |

**File: `src/pages/FoodLog.tsx`**

| Change | Description |
|--------|-------------|
| Add `dismissSimilarMatch` callback | Clears `similarMatch` and `pendingAiResult` state |
| Remove `handleSaveAsNew` | No longer needed (can keep if you want, but unused) |
| Pass dismiss callback to LogInput | Wire up the auto-dismiss |
| Pass dismiss callback to SimilarMealPrompt | For X button |
| Remove `onSaveAsNew` prop | From SimilarMealPrompt usage |

---

### Implementation Notes

The auto-dismiss on viewport resize behavior you noticed already exists because the component is conditionally rendered (`{similarMatch && ...}`). If a resize causes a re-render that clears the state somehow, it would dismiss. But that's likely coincidental - the explicit dismiss logic will make this behavior intentional and consistent.

