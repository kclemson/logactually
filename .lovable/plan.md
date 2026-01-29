

## Fix Voice Button Hover State While Recording

### Problem

When voice recording is active (`isListening` is true), the button should stay red. Currently:
- **Without hover**: Button is red (correct)
- **With hover**: The `outline` variant's hover styles (`hover:bg-accent`) override the red background
- **On mobile**: Since there's no "un-hover", the button never appears red after tapping

### Root Cause

The button uses `variant="outline"` which includes hover styles:
```css
hover:bg-accent hover:text-accent-foreground
```

These hover styles override the conditional `bg-destructive text-destructive-foreground` classes because hover states take precedence in the cascade.

### Solution

Override the hover styles when recording is active by adding `hover:bg-destructive hover:text-destructive-foreground` alongside the base destructive styles.

---

### File to Modify

**`src/components/LogInput.tsx`**

---

### Change

**Line 301** - Add hover overrides to the className:

From:
```tsx
className={cn("px-2", isListening && "bg-destructive text-destructive-foreground")}
```

To:
```tsx
className={cn(
  "px-2", 
  isListening && "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground"
)}
```

This ensures that when recording is active, the button stays red regardless of hover state.

---

### Summary

| Change | Details |
|--------|---------|
| Fix | Add `hover:bg-destructive hover:text-destructive-foreground` when `isListening` |
| Result | Button stays red while recording, on both desktop and mobile |
| No behavior change | Just visual consistency |

