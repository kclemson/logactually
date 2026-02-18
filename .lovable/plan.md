

# Right-size label min-width to 6rem

## Problem
`min-w-[7.5rem]` (120px) is too wide, squishing inputs. The original `min-w-[5rem]` (80px) was too narrow. We just need the Goldilocks value.

## Solution
Change `min-w-[7.5rem]` to `min-w-[6rem]` (96px) on both label spans. At `text-xs` (12px), "Cal Burned (cal):" measures ~95px, so 96px is a snug fit -- just enough for the longest label without wasting space.

## Changes

**`src/components/DetailDialog.tsx`**

- Line 143 (FieldViewGrid label): `min-w-[7.5rem]` -> `min-w-[6rem]`
- Line 178 (FieldEditGrid label): `min-w-[7.5rem]` -> `min-w-[6rem]`

Two single-character edits. No structural changes.
