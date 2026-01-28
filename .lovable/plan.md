

## Rotate Weight Trend Labels 90 Degrees

Now that labels are rendering on every bar, we'll rotate them vertically to improve readability and reduce overlap.

---

### SVG Text Rotation

In SVG, we rotate text using the `transform` attribute with `rotate(angle, centerX, centerY)`. For vertical text reading from bottom-to-top, we use -90 degrees (counter-clockwise).

---

### Changes to `src/pages/Trends.tsx`

Update `renderGroupedLabel` to add rotation:

```typescript
const renderGroupedLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  
  // Center position of the bar
  const centerX = x + width / 2;
  const centerY = y + (height || 0) / 2;
  
  return (
    <text
      x={centerX}
      y={centerY}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={7}
      fontWeight={500}
      transform={`rotate(-90, ${centerX}, ${centerY})`}
    >
      {value}
    </text>
  );
};
```

---

### Key Changes

| Before | After |
|--------|-------|
| Horizontal text at `y + 10` (near top of bar) | Vertical text centered in bar |
| `textAnchor="middle"` only | Add `dominantBaseline="middle"` for vertical centering |
| No transform | `rotate(-90, centerX, centerY)` for vertical orientation |
| Text reads left-to-right | Text reads bottom-to-top |

---

### Visual Result

- Labels will appear vertically inside each bar
- Text will read from bottom to top (like a book spine)
- Less overlap between adjacent bars since text runs parallel to bar height
- Centered both horizontally and vertically within the bar

---

### File to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/pages/Trends.tsx` | 57-78 | Update `renderGroupedLabel` to add rotation transform |

