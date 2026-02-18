

# Fix vertical alignment of values after adding unit suffixes to labels

## Problem

The `min-w-[5rem]` (80px) on labels is too narrow now that labels include unit suffixes like "(min):", "(mi):", "(bpm):". Longer labels like "Cal Burned (cal):" and "Heart Rate (bpm):" overflow the minimum width, pushing values to different horizontal positions across rows.

## Solution

Increase the label minimum width in both `FieldViewGrid` and `FieldEditGrid` to accommodate the longest label with its unit suffix. The longest label is "Heart Rate (bpm):" or "Cal Burned (cal):" -- roughly 120px at text-xs size.

## Changes

**`src/components/DetailDialog.tsx`**

- `FieldViewGrid` (line 143): Change `min-w-[5rem]` to `min-w-[7.5rem]` on the label `<span>`
- `FieldEditGrid` (line ~179): Change `min-w-[5rem]` to `min-w-[7.5rem]` on the label `<span>`

This ensures all labels occupy the same minimum width, so values align vertically regardless of label length.

