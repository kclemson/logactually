## Goal
In `BloodworkPanelGroup.tsx`, replace the header label (currently `panel_title || source_filename`) with a single-row "{N} results: SectionA · SectionB · SectionC" string, preserving the result count and using CSS truncation when it overflows.

## Change — `src/components/BloodworkPanelRow` header (line ~82–97)

The `sections` array is already derived just above the JSX. Build:

- `count = panel.results.length`
- `sectionNames = sections.map(s => s.title).filter(Boolean)`
- `summary = sectionNames.length ? `${count} result${s}: ${sectionNames.join(' · ')}` : `${count} result${s}``
- Fallback when no results yet / no sections: keep `panel.panel_title || source_filename || 'Bloodwork'`.

Render as a single `<span className="text-sm truncate" title={summary}>` filling the middle grid column. Drop the separate "· N results" muted span (count is now inline). Keep the pending/failed sibling spans unchanged.

The existing `grid-cols-[auto_1fr_auto]` + `min-w-0` + `truncate` already gives native ellipsis behavior — no manual character cap needed. Browser tooltip via `title` shows the full string on hover.

## Out of scope
Expanded body, filename display elsewhere (DuplicateBlockedDialog etc.), success card in `BloodworkUploadInput`.
