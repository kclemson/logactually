

# Reclaim horizontal space in Detail Dialog edit mode

## Problem
On mobile edit mode, fields like Distance are still cramped. Two targeted fixes:

## Changes

### 1. Tighten label-to-input gap (`src/components/DetailDialog.tsx`)
In both `FieldViewItem` (line 165) and `FieldEditItem` (line 211), reduce `gap-2` (8px) to `gap-1.5` (6px) on the flex container. This saves 2px per gap instance, roughly 4-6px per row across label, value, and unit elements.

### 2. Shrink dropdown font size (`src/components/DetailDialog.tsx`)
The `<select>` element (line 226) currently uses `text-sm` (14px). Safari's auto-zoom only triggers on `<input>` fields below 16px, not `<select>`. Change to `text-xs` (12px) on the select, which saves a few more pixels of rendered text width for Category/Exercise type/Subtype values like "Walk/ru..." that currently clip.

## Files changed

| File | What |
|------|------|
| `src/components/DetailDialog.tsx` | `gap-2` to `gap-1.5` in FieldViewItem and FieldEditItem; `text-sm` to `text-xs` on select element |

