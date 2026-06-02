## Goal

Add the new changelog entry for the trends chart change, date-stamped today (Jun-02), and update the "last updated" date references.

## Changes

**1. `src/pages/Changelog.tsx`**
- Add a new entry at the top of `CHANGELOG_ENTRIES`:
  ```
  { date: "Jun-02", text: "Tweaked trends charts for certain custom logs like body weight or body fat %, they now show as line charts zoomed in to your range instead of columns starting at zero, to make gradual changes easier to spot." },
  ```
- Update `LAST_UPDATED` from `"May-09-26"` to `"Jun-02-26"`.

**2. `src/components/settings/AboutSection.tsx`**
- Update the link label from `Changelog (last updated May-09)` to `Changelog (last updated Jun-02)`.

No image is attached to this entry (text-only, like several existing entries).
