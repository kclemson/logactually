## Goal

Make all 5 unitless items in your (user #1) saved meals editable again by giving each a sensible `portion` string. This is a surgical data-only fix — no code changes, and historical logs are left untouched.

## Scope confirmed

- **Saved meals (fix):** 5 items across 5 meals.
- **Historical logs (skip):** 198 items — intentionally left alone.

## The fix

Update the `food_items` JSONB on these 5 saved-meal rows, setting `portion` on the one offending item in each. Values use my suggestions (whole single-serving units):

| Saved meal (id) | Item index | Item | Portion to set |
|---|---|---|---|
| `05592e96…` Barebell bar – Cookies & Caramel | 0 | Barebell protein bar | `1 bar` |
| `c35bf65f…` Edamame (bag) | 0 | Salted Edamame In Pod | `1 bag` |
| `a6b0d660…` Egg & Cheese Pita Snack Sandwich | 0 | Egg & Cheese Pita Snack Sandwich | `1 sandwich` |
| `29a4a78b…` Red Baron french bread pizza | 0 | French bread five cheese & garlic | `1 piece` |
| `18a528eb…` strawberries + cottage cheese | 0 | Cottage Cheese | `0.458 cup` |

## How it will be applied

A single targeted data update (via the database insert/update tool) that uses `jsonb_set` to write `portion` into the exact item index of each of the 5 rows — matched by `id` to avoid touching any other meal. Macros/calories are unchanged; only the missing portion label is added, which re-enables the existing amount/scaling stepper.

## Verification

After the update, re-query these 5 rows to confirm each target item now has a non-empty `portion`, and confirm the global count of unitless items on your account in saved meals is `0`.

## Out of scope

- Historical `food_entries` (198 items) — not modified.
- Any code change to `FoodItemsTable.tsx` rendering logic.
- Other users' data.
