

## Improve Login Screen Visual Hierarchy

The login screen currently has low contrast between the card and background, making it feel flat and "weird" in both light and dark modes.

---

### Problem Analysis

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `hsl(220 14% 96%)` - very light gray | `hsl(222.2 84% 4.9%)` - very dark |
| Card | `hsl(220 14% 96%)` - same as background | `hsl(222.2 84% 4.9%)` - same as background |
| Separation | Thin 1px border only | Thin 1px border only |

The card and background use the **same color**, relying only on a subtle border for separation.

---

### Solution Options

**Option A: Add subtle shadow to card** (Recommended)
- Add a soft shadow to the login card to create depth
- Works well in both light and dark modes
- Minimal change, keeps existing color scheme

**Option B: Give card a distinct background**
- Make the card slightly lighter/darker than the page background
- Requires careful color selection for both themes

**Option C: Remove the card border, use only shadow**
- Cleaner, more modern look
- Shadow provides sufficient separation

---

### Recommended Approach

Use **Option A** with enhanced shadow for the auth card specifically:

**Changes to `src/pages/Auth.tsx`:**
- Add a stronger shadow class to the Card component on the login page
- Use `shadow-lg` or a custom shadow for more pronounced depth
- Consider removing or softening the border since shadow provides separation

**Example styling:**
```tsx
<Card className="w-full max-w-md shadow-lg border-0">
```

Or with a softer border:
```tsx
<Card className="w-full max-w-md shadow-lg border-border/50">
```

---

### Visual Result

| Before | After |
|--------|-------|
| Flat card with thin border | Card "lifts" off the page with shadow |
| Low visual hierarchy | Clear depth and focus on the form |

---

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Update Card className to add shadow and optionally adjust border (in 3 places: main form, reset mode, password update mode) |

---

### Technical Notes

- The `shadow-lg` class from Tailwind provides: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- Works well in dark mode as shadows still provide depth perception
- Alternatively, could use `shadow-xl` for even more pronounced effect
- Keeping a subtle border (`border-border/50`) can help in dark mode where shadows are less visible

