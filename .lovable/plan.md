

## Calendar Calorie Display Improvements

Two issues to fix:
1. The "cal" label is causing text to wrap, making cells taller than rounded squares
2. Red text implies something is wrong - should use blue for neutral reference

---

### Current State

- Font size: `text-xs` (12px)
- Format: `1,428 cal` (with space before "cal")
- Color: `text-rose-500 dark:text-rose-400` (red)
- Cell has `p-2` padding

---

### Changes

**1. Reduce font size and tighten format**
- Change from `text-xs` to `text-[10px]` for a more compact display
- Remove space before "cal" to save horizontal space: `1,428cal`

**2. Change color from red to blue**
- Use `text-blue-500 dark:text-blue-400` to match the focus/link color convention
- Blue is neutral/informational rather than warning/error

**3. Reduce cell padding**
- Change from `p-2` to `p-1.5` to give more room for content

---

### Code Changes

| Line | Current | New |
|------|---------|-----|
| 187 | `p-2 min-h-[68px]` | `p-1.5 min-h-[64px]` |
| 199 | `text-xs` | `text-[10px]` |
| 201 | `text-rose-500 dark:text-rose-400` | `text-blue-500 dark:text-blue-400` |
| 205 | `${...} cal` | `${...}cal` (no space) |

---

### Visual Result

Before:
```
1,428
 cal     <- wraps to second line
 22
```

After:
```
1,428cal  <- single line, smaller, blue
   22
```

---

### File to Modify

| File | Changes |
|------|---------|
| `src/pages/History.tsx` | Reduce font size, padding, remove space before "cal", change color to blue |

