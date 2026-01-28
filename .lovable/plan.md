

## Reverse Tooltip Order to Match Visual Stack (Top-First)

A simple one-line change: reverse the payload array before rendering so the tooltip shows items in "top of bar first" order.

---

### Approach

The `payload` array comes from Recharts in the order the `<Bar>` components are defined (Fat → Carbs → Protein). Since Protein is visually on top, we just reverse the array so the tooltip reads Protein → Carbs → Fat.

---

### File to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Add `.slice().reverse()` to payload before mapping |

---

### Code Change (line 41)

**Before:**
```tsx
{payload.map((entry: any, index: number) => {
```

**After:**
```tsx
{payload.slice().reverse().map((entry: any, index: number) => {
```

---

### Why This Works

- The visual bar stacking stays exactly the same (Fat at bottom, Protein on top with rounded corners)
- The tooltip order flips to show the top bar first
- `.slice()` creates a shallow copy so we don't mutate the original array
- No complexity added - just a simple array reversal

