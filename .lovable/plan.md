# Tighten row spacing in the "Add a Log Type" picker

The picker rows currently have more vertical space than needed for mobile tap targets. Reduce it for a denser list while keeping comfortable, accessible hit areas.

## Context: is the spacing needed?

No. The recommended minimum touch target is ~44px (Apple) / 48px (Material), but each row is fully tappable (the `<label>`/`<button>` spans the full width). The current look comes from two sources stacked together:
- Each row uses `py-2` (8px top + 8px bottom).
- Every group is separated by `gap-4` (16px) **and** the group header adds its own bottom padding.

That combination is what makes it feel airy. We can tighten without dropping below a usable target.

## Changes (all in `src/components/LogTemplatePickerDialog.tsx`)

- **Row padding:** change each row's `py-2` to `py-1.5` (≈6px), giving ~32-34px rows. Keep `gap-3` between checkbox/icon/label so they stay easy to read and tap. The full-row tap area keeps it usable on mobile.
- **Group spacing:** reduce the outer container from `gap-4` to `gap-2` so sections sit closer together.
- **Group header:** keep the uppercase label but tighten its bottom padding (`pb-1` → `pb-0.5`) and add a small `mt` only where needed so headers don't crowd the previous group.
- **Footer buttons:** slightly reduce the gap above "Add selected" / "Create your own" so the bottom of the dialog matches the tighter rhythm (e.g. trim the container `gap` and the "Create your own" vertical padding).

No logic, behavior, or wording changes — purely spacing/density. After the change I'll verify on the 390px mobile viewport via a screenshot to confirm rows still look tappable and the whole list fits more compactly.
