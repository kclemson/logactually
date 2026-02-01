

## Fix Chart Label Thresholds for High-Density Views

The current thresholds are still too aggressive for 65+ data point views. Need to increase intervals significantly.

---

### Problem

Looking at the screenshots with ~65-70 data points:
- Labels are appearing approximately every 3rd bar (way too dense)
- Even interval = 7 or 10 would still produce ~7-10 labels, which may overlap at this density

---

### Proposed Threshold Changes

**ExerciseChart (half-width):**

| Data Points | Current Interval | Proposed Interval | Labels Shown |
|-------------|-----------------|-------------------|--------------|
| 1-12 | 1 | 1 | All |
| 13-20 | 2 | 2 | ~10 |
| 21-35 | 3 | 4 | ~9 |
| 36-50 | 5 | 6 | ~8 |
| 51-70 | 7 | 10 | ~7 |
| 71-90 | 10 | 15 | ~6 |
| 91+ | 10 | 20 | ~5 |

**Key change:** For 65 data points, go from interval=7 (showing ~9 labels) to interval=10 (showing ~7 labels). For 90+ points, use interval=20 (showing ~5 labels).

---

### File Changes

**`src/pages/Trends.tsx`** - ExerciseChart labelInterval (~line 148):

```typescript
const labelInterval = 
  dataLength <= 12 ? 1 : 
  dataLength <= 20 ? 2 : 
  dataLength <= 35 ? 4 :    // was 3
  dataLength <= 50 ? 6 :    // was 5
  dataLength <= 70 ? 10 :   // was 7
  dataLength <= 90 ? 15 : 20;  // was 10
```

---

### Expected Result

At 65 data points with interval = 10:
- Labels shown at positions: 64, 54, 44, 34, 24, 14, 4 (7 labels total)
- Clear spacing between labels
- Rightmost bar always labeled

