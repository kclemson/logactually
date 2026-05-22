# Custom Log top section: minimal recenter

## Goal

Make the top of the Custom Log page feel intentional next to Food/Exercise by (1) swapping the view-mode dropdown for a pill toggle and (2) centering both controls in the reserved top-section space, stacked.

## Layout

```text
        [ By Date | By Type ]      ← pill toggle, centered

           [ + Log New ▾ ]         ← existing button, centered

   ──────── Today, May 22 ‹ › ────────
```

Both controls sit inside the existing `min-h-[148px]` top section, centered horizontally and vertically as a stacked pair. Date nav below is untouched, so it stays anchored in the same vertical position as Food/Exercise.

## Changes

### 1. Pill toggle replaces the view-mode Select

Two-segment pill: `[ By Date | By Type ]`
- Rounded-full container with muted background; active segment gets a solid surface + stronger text weight.
- Compact height (~`h-8`), same `handleViewModeChange` wiring.
- Inline Tailwind, no new dependency.

### 2. Center the stacked pair

Update the top section wrapper:
- `flex flex-col items-center justify-center gap-3` (replacing `justify-start` row + `gap-2`).
- Pill toggle on row 1, existing `+ Log New ▾` Select on row 2.

### 3. Leave everything else alone

- `+ Log New` dropdown keeps its current behavior, including the "New Custom Log Type" submenu item.
- Onboarding empty-state branch (template grid + "Create your own") unchanged.
- Read-only behavior unchanged.

## Files

- `src/pages/OtherLog.tsx` — in the `hasLogTypes` branch (lines ~224–268), swap the view-mode `Select` for the pill toggle and adjust the outer flex container to center both rows. No other files touched.

## Out of scope

- Chip rail / promoting type creation out of the dropdown.
- Modal positioning for the input form.
- Any By-Type or By-Date internals.
