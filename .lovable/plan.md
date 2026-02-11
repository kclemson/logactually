

## Standardize Input Widths and Left-Align

### Problem
The height input is narrower (`w-12`) than the others (`w-16`), causing misalignment. Also, the inputs are right-aligned within their column, but they should be left-aligned so the input boxes line up vertically.

### Solution
Two small fixes:

1. **Make height input use the shared `inputClass`** so all four inputs (weight, height, age, intensity) are the same `w-16` width.
2. **Left-align the right column** by changing `rightColClass` from `justify-end` to `justify-start`, so the input boxes start at the same horizontal position.

### Technical Details (`src/components/CalorieBurnDialog.tsx`)

- **Line 221** (`inputClass`): No change needed, already `w-16`.
- **Line 222** (`rightColClass`): Change `justify-end` to `justify-start`.
- **Line ~298-301** (height input): Replace the inline class string `"w-12 h-8 text-center text-sm rounded-md border border-input bg-background px-1 ..."` with `{inputClass}` so it matches all the others.

### Files Changed
- `src/components/CalorieBurnDialog.tsx` only
