

## Unify All Surfaces with Soft Warm Gray

Apply the same muted background color to cards and popovers so UI elements blend seamlessly with the page.

---

### Current State

| Variable | Current Value | Result |
|----------|---------------|--------|
| `--background` | `220 14% 96%` | Soft gray ✓ |
| `--card` | `0 0% 100%` | Pure white |
| `--popover` | `0 0% 100%` | Pure white |

The white cards create a stark contrast against the soft gray background, which you'd like to eliminate.

---

### Proposed Change

Set both `--card` and `--popover` to match the background color, so charts and UI elements appear to sit directly on the page:

| Variable | New Value | Hex |
|----------|-----------|-----|
| `--card` | `220 14% 96%` | `#F4F5F7` |
| `--popover` | `220 14% 96%` | `#F4F5F7` |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Update `--card` and `--popover` in `:root` section |

---

### Code Changes

**Lines 30-33 in src/index.css:**

Before:
```css
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;

--popover: 0 0% 100%;
```

After:
```css
--card: 220 14% 96%;
--card-foreground: 222.2 84% 4.9%;

--popover: 220 14% 96%;
```

---

### Visual Result

All surfaces will share the same soft warm gray. The charts, stat boxes, and other UI chrome will appear to sit directly on the background rather than floating on white cards. This creates a cleaner, more unified look that's easier on the eyes.

