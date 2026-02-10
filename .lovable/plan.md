

## Simplify Apple Health Import Dialog

### 1. Remove "Skip duplicates" toggle -- always skip silently

The toggle and its subtitle ("Only detects prior Apple Health imports") will be removed entirely. Duplicate detection will always run automatically during preview and import. This means:

- Remove the `skipDuplicates` state variable
- Remove the toggle UI block
- In `handlePreview` and `handleImport`, always run the duplicate-check logic (remove the `if (skipDuplicates)` conditionals)

### 2. Fix default date showing just the month

The `defaultFromDate` function returns an ISO date string like `"2025-11-12"`, but the date input may be selecting just the month portion on some browsers. The real issue is the date is set asynchronously after mount -- during the initial render `fromDate` is `""`. This should be fine for the `<input type="date">`, so the likely fix is just cosmetic. However, looking at the screenshot, the date `11/12/2025` is actually correct (90 days back from ~Feb 2026). The user said the "month" is selected by default -- this appears to be browser behavior where the month portion of the date field is highlighted/focused. This is native browser behavior and not something we control. I'll note this in the plan but won't change anything for it.

### Technical Details

**File: `src/components/AppleHealthImport.tsx`**

- **Remove state**: Delete `const [skipDuplicates, setSkipDuplicates] = useState(true);`
- **Remove UI**: Delete the entire "Skip duplicates" toggle block (~15 lines in the config section)
- **`handlePreview`**: Remove the `if (!skipDuplicates)` early return -- always run the duplicate check
- **`handleImport`**: Remove the `if (skipDuplicates)` guard -- always filter out duplicates before inserting
- **Preview display**: Keep showing the "X already imported (will skip)" count in the preview phase so users know what's happening, but remove the `skipDuplicates &&` condition from that display

No changes needed for the date field -- the "month selected" appearance is native browser focus behavior on `<input type="date">`.

