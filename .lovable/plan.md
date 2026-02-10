

## Apple Health Import Dialog UX Improvements

### 1. Reduce dialog header/subheader font size

The DialogTitle and DialogDescription are using default sizes that feel oversized for this utility dialog. Shrink the title and remove or shrink the description so the content feels proportional.

### 2. Replace native file input with a styled button

The native `<input type="file">` shows "No file chosen" text which is unnecessary since the UI transitions away once a file is picked. Replace it with a hidden file input triggered by a styled Button, showing just "Choose File" (or "Select export.xml").

### 3. Make scanning/results feel like a continuation, not a new dialog

Currently the date picker and header/description persist across phases, making it feel like the dialog reset. The fix:
- Only show the date picker and file chooser in the `config` phase
- Once scanning starts, hide those and show progress inline
- After scanning, show results (type selection, preview, import progress, done) without the date/file UI cluttering things up

This means changing the condition `(phase === "config" || phase === "select" || phase === "preview")` for the date picker to just `phase === "config"`.

### Technical Details

**File: `src/components/AppleHealthImport.tsx`**

- **Dialog header**: Add `className="text-base"` to DialogTitle and `className="text-xs"` to DialogDescription to reduce visual weight
- **File input**: Replace the native `<input type="file">` with a hidden ref-based input and a `<Button>` that triggers it. Label: "Select export.xml"
- **Phase visibility**: Change line 344 from `(phase === "config" || phase === "select" || phase === "preview")` to just `phase === "config"` so the date picker and file chooser disappear after scanning begins. The results phases (select, preview, importing, done) will show their content without the config UI, making the dialog feel like a smooth progression

