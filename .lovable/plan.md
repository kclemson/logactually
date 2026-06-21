## Goal

Fix two pieces of user-facing copy in the importer:
1. It says "memories" where the feature is now called "photo scrapbook".
2. It tells people to add `.html` files specifically — make it format-agnostic and welcoming to exports from any platform.

This is copy-only. No parsing logic, file-acceptance rules, edge functions, or data flow change. The file input still technically accepts `.html` for now (that's the only supported parser), but the wording won't lock the user into one format.

## Changes

### `src/components/settings/ImportExportSection.tsx`
- Row label `Import memories from files` → `Import to photo scrapbook` (or similar scrapbook wording).
- Button text `Import Memories` → `Import to Scrapbook`.

### `src/components/custom/MemoryImportDialog.tsx`
- Dialog title `Import memories` → `Import to photo scrapbook`.
- Dialog description: replace the `.html`-specific text with general guidance, e.g. "Have content exported from another platform (like a blog or newsletter)? Upload the exported files here and we'll pull in the posts and photos. Review the list, then import them all at once."
- Parse-error message `...Make sure they are exported .html files.` → generic, e.g. "Could not read one or more files. Make sure they're the files you exported from the other platform."
- Summary line `Imported N memories` → `Imported N posts` (or "entries") so it no longer says "memories".

### Note on the word "memory" in code
Internal identifiers (`MemoryImportDialog`, `useImportMemories`, `memoryLogTypes`, etc.) stay as-is — these refer to the underlying memory-type custom log and aren't user-visible. Only user-facing strings change.

## Verification
- Visual check of Settings → Import and Export row and the opened dialog to confirm all visible text reads "photo scrapbook" / general format guidance and no visible "memories" wording remains.
