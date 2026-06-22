## Goal

Fix the import review list so it works on mobile and shows enough content to identify each post. The current `<Table>` overflows horizontally on mobile (forcing a scrollbar, screenshot 1) and truncates the post text to a few words. Replace it with a vertical list (one stacked card per post) that shows the date with shorthand metadata and a multi-line content preview.

## New row layout (per post)

```text
[✓]  2023-02-01 · 279 words · 4 photos              New
     Text from the imported content that goes on for
     a couple of lines so the user can actually
     identify which post this is…
     #BestThingsToday
```

- Leading checkbox (include/skip), vertically aligned to the top.
- Metadata line: date + shorthand `· N words · N photos`, in small muted text. Status indicator (New / Already imported / Needs date / Importing / Imported / Failed) sits at the right of this same line.
- Content preview: ~2–3 lines of the note text via `line-clamp`, normal foreground color, so posts are identifiable.
- Category tag (e.g. `#BestThingsToday`) shown below in small muted text when present.
- Rows separated by a divider (`divide-y`), no horizontal scrolling — everything wraps within the dialog width.

A "Select all / none" control moves to a single row above the list (checkbox + "Select all" label + included count), replacing the table header checkbox.

## Changes

### `src/components/custom/MemoryImportDialog.tsx`
- Remove the `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell`/`TableHead` import and markup.
- Render the review rows as a `div` list (`divide-y divide-border`), each row a flex layout: checkbox column + content column.
- Update `previewText` usage to show more text — render the note preview with `line-clamp-3` (multi-line) instead of just the first line. Keep falling back to `sourceName` when the note is empty.
- Build the metadata string inline: `{date} · {wordCount} words · {photos} photos` (omit gracefully when date missing → show "Needs date" via status).
- Keep `renderStatus` logic; reposition it to the top-right of each row.
- Replace the header-row select-all checkbox with a compact select-all control above the list.
- No changes to parsing, import logic, hooks, or the dialog title/description copy.

## Verification
- Drive the preview with Playwright at mobile width (≈390px): open Settings → Import and Export → Import to Scrapbook, load sample export files, and screenshot to confirm no horizontal scroll, readable multi-line previews, and correct metadata/status. Repeat at desktop width.
