

# Reduce exercise detail dialog label width

## Problem

In the exercise detail dialog (edit mode), there's excessive space between label text and input fields. The `min-w-[5.5rem]` (88px) label width is wider than needed -- labels like "Speed:", "Incline:", and "Effort:" are much shorter, and even the longest labels ("Cal Burned:", "Heart Rate:") have visible dead space before their inputs.

## Fix

Reduce `labelClassName` from `min-w-[5.5rem]` to `min-w-[5rem]` (80px) in both `DetailDialog` usages in `WeightLog.tsx`. This reclaims 16px total (8px per column), tightening the gap between labels and inputs while still fitting all label text comfortably.

## Technical details

**File: `src/pages/WeightLog.tsx`** -- two occurrences (lines 775 and 798)

Change:
```
labelClassName="min-w-[5.5rem]"
```
To:
```
labelClassName="min-w-[5rem]"
```

Two-line change in one file.

