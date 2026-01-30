

## Tighten DevToolsPanel Column Widths

### Overview

The results table currently spans too wide, making it hard to read with content spread out. This change reduces the default column widths to create a more compact, readable layout while maintaining the ability to resize columns if needed.

---

### File Changes

#### `src/components/DevToolsPanel.tsx`

**Update columnWidths state (lines 79-96)**

| Column | Before | After | Change |
|--------|--------|-------|--------|
| input | 250 | 180 | -70 |
| source | 70 | 50 | -20 |
| prompt | 80 | 50 | -30 |
| description | 200 | 150 | -50 |
| portion | 80 | 100 | +20 (portion text needs room) |
| calories | 50 | 35 | -15 |
| protein | 40 | 30 | -10 |
| carbs | 40 | 30 | -10 |
| fiber | 40 | 30 | -10 |
| sugar | 40 | 30 | -10 |
| fat | 40 | 30 | -10 |
| satFat | 40 | 30 | -10 |
| sodium | 50 | 35 | -15 |
| cholesterol | 50 | 30 | -20 |
| confidence | 60 | 55 | -5 |
| sourceNote | 250 | 180 | -70 |

**Total width reduction:** ~355px narrower by default

```typescript
const [columnWidths, setColumnWidths] = useState({
  input: 180,
  source: 50,
  prompt: 50,
  description: 150,
  portion: 100,
  calories: 35,
  protein: 30,
  carbs: 30,
  fiber: 30,
  sugar: 30,
  fat: 30,
  satFat: 30,
  sodium: 35,
  cholesterol: 30,
  confidence: 55,
  sourceNote: 180,
});
```

---

### Result

The table will be significantly more compact while still readable. All columns remain individually resizable via the existing drag handles if you need more space for specific content.

