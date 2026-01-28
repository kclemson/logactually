

## Split Weight Label: Above Bar + Inside Bar

Instead of stacking all text inside the bar, we'll split the label into two parts:
1. **Weight (e.g., "160")** - Displayed ABOVE the bar in purple (same color as bar)
2. **Sets × Reps (e.g., "3×10")** - Displayed INSIDE the bar in white, stacked vertically

---

### Changes to `src/pages/Trends.tsx`

Update `renderGroupedLabel` (lines 57-97):

```typescript
const renderGroupedLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  
  const centerX = x + width / 2;
  
  // Parse the label "3×10×160" into parts
  const parts = value.split('×');
  if (parts.length !== 3) return null;
  
  const [sets, reps, weight] = parts;
  
  // Weight label appears ABOVE the bar in purple
  const weightY = y - 4; // Position above the bar top
  
  // Sets×reps inside the bar (stacked: "3", "×", "10")
  const insideLines = [sets, '×', reps];
  const lineHeight = 8;
  const totalTextHeight = insideLines.length * lineHeight;
  const startY = y + ((height || 0) - totalTextHeight) / 2 + lineHeight / 2;
  
  return (
    <g>
      {/* Weight label above bar - purple color matching bar */}
      <text
        x={centerX}
        y={weightY}
        fill="hsl(262 83% 58%)"
        textAnchor="middle"
        fontSize={7}
        fontWeight={500}
      >
        {weight}
      </text>
      
      {/* Sets×reps inside bar - white color */}
      <text
        x={centerX}
        fill="#FFFFFF"
        textAnchor="middle"
        fontSize={7}
        fontWeight={500}
      >
        {insideLines.map((line, i) => (
          <tspan
            key={i}
            x={centerX}
            y={startY + i * lineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};
```

---

### Visual Result

```
     160      ← purple text above bar
  ┌──────┐
  │  3   │   ← white text inside
  │  ×   │
  │  10  │
  └──────┘
```

---

### Key Changes

| Element | Position | Color |
|---------|----------|-------|
| Weight (e.g., "160") | Above bar (`y - 4`) | Purple (`hsl(262 83% 58%)`) - matches bar color |
| Sets×Reps (e.g., "3×10") | Centered inside bar | White (`#FFFFFF`) |

---

### Technical Notes

- Use `<g>` (SVG group) to return multiple text elements
- Weight positioned at `y - 4` places it just above the bar top (with some padding)
- Inside text uses same stacking logic but only 3 lines now instead of 5
- Purple color matches the existing bar fill: `hsl(262 83% 58%)`

---

### File to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/pages/Trends.tsx` | 57-97 | Update `renderGroupedLabel` to split weight above, sets×reps inside |

