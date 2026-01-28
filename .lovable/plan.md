

## Soften the Light Mode Background

Replace the pure white background with a gentler, warmer off-white that's easier on the eyes.

---

### Current State

The light mode uses pure white (`0 0% 100%` = `#FFFFFF`) for:
- `--background` (main page background)
- `--card` (card surfaces)
- `--popover` (dropdown menus, dialogs)

---

### Recommended Options

Here are three softer alternatives (all in HSL format as required by the design system):

| Option | HSL Value | Hex Equivalent | Description |
|--------|-----------|----------------|-------------|
| **A - Warm Gray** | `220 14% 96%` | `#F4F5F7` | Subtle cool-gray tint, very common in modern apps |
| **B - Warm Cream** | `40 20% 97%` | `#F9F8F5` | Slight warm/cream undertone, cozy feel |
| **C - Cool Blue-Gray** | `210 20% 98%` | `#F8FAFB` | Very subtle blue tint, matches the app's blue accent |

**Recommendation**: Option A (`220 14% 96%`) — provides noticeable relief from pure white while staying neutral and professional.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Update `--background`, `--card`, and `--popover` in the `:root` section |

---

### Code Changes (lines 27, 30, 33)

**Before:**
```css
--background: 0 0% 100%;
...
--card: 0 0% 100%;
...
--popover: 0 0% 100%;
```

**After (Option A - Warm Gray):**
```css
--background: 220 14% 96%;
...
--card: 0 0% 100%;      /* Keep cards white for contrast */
...
--popover: 0 0% 100%;   /* Keep popovers white for clarity */
```

Alternatively, if you want cards to blend with the background:
```css
--background: 220 14% 96%;
--card: 220 14% 98%;    /* Slightly lighter than background */
--popover: 0 0% 100%;   /* Keep popovers crisp white */
```

---

### Visual Result

The page will have a soft gray-blue tint instead of harsh white. Cards can either stay white (for contrast) or match the background (for a more unified look).

---

### Your Choice

Would you like me to:
1. **Just the background** — Keep cards and popovers white for contrast
2. **Background + cards** — Both use the soft gray, popovers stay white
3. **All surfaces** — Everything gets the soft treatment

