

# Align category value/dropdown with Subtype value/dropdown

## Problem

The "Cardio/Strength/Other" text and dropdown are slightly misaligned with the "Walking" Subtype value/dropdown below them. Two causes:

1. **View mode** (line 162): The paired field span uses `text-right`, pushing the text to the right edge instead of left-aligning with the Subtype value below.
2. **Edit mode** (line 268): The paired field select uses `px-1 text-xs` while the Subtype select (line 225) uses `px-1.5 text-sm`, causing a slight horizontal offset.

## Fix

### 1. View mode: left-align the paired field value

**Line 162** -- change:
```
w-[7.5rem] text-right
```
to:
```
w-[7.5rem] text-left pl-2
```
The `pl-2` matches the `pl-2` already used on read-only values (line 158) for consistent alignment with edit-mode inputs.

### 2. Edit mode: match paired field select styling to regular selects

**Line 268** -- change:
```
px-1 py-0 text-xs
```
to:
```
px-1.5 py-0 text-sm
```
This matches the regular select styling on line 225, so both dropdowns render text at the same size and internal padding, ensuring their text baselines and left edges align.

### Files changed
- `src/components/DetailDialog.tsx` (2 small class changes)

