

## Expand DevToolsPanel Width for Large Monitors

### Overview

The DevToolsPanel is currently constrained to `max-w-4xl` (896px), which is quite narrow on a large monitor. Since this is a desktop-only developer tool, we can remove the width constraint entirely and let it use the full viewport width with just some horizontal padding.

---

### Changes

#### `src/components/DevToolsPanel.tsx`

**Current (line 244):**
```tsx
<div className="mx-auto max-w-4xl px-3">
```

**Updated:**
```tsx
<div className="px-6">
```

This change:
- Removes `mx-auto max-w-4xl` which was limiting the panel to 896px centered
- Increases horizontal padding from `px-3` (12px) to `px-6` (24px) for breathing room on large screens
- The table and all controls will now use the full available width

---

#### Increase Default Column Widths

Since there's more space available, we should also increase the default column widths:

**Current (lines 54-60):**
```tsx
const [columnWidths, setColumnWidths] = useState({
  input: 200,
  source: 60,
  prompt: 80,
  output: 250,
  sourceNote: 200,
});
```

**Updated:**
```tsx
const [columnWidths, setColumnWidths] = useState({
  input: 350,
  source: 80,
  prompt: 100,
  output: 400,
  sourceNote: 350,
});
```

This roughly doubles the space for content, making it much easier to see full inputs and outputs without truncation.

---

### Summary

| Change | Before | After |
|--------|--------|-------|
| Container width | `max-w-4xl` (896px) | Full width |
| Horizontal padding | `px-3` (12px) | `px-6` (24px) |
| Input column | 200px | 350px |
| Source column | 60px | 80px |
| Prompt column | 80px | 100px |
| Output column | 250px | 400px |
| Source Note column | 200px | 350px |

The resizable columns feature is already in place, so you can still drag to adjust if needed.

