

## Apple Health Import Dialog Tweaks

### 1. Center the "Select export.xml" button

Add `flex justify-center` to the wrapper div around the file picker button so it's horizontally centered in the dialog.

### 2. Move "see how" instructions into the dialog

Replace the static `DialogDescription` ("Select your exported Apple Health XML file...") with a collapsible "see how" link inside the dialog's description area. This reuses the same instructions text currently shown on the Settings page, but places it where it's contextually relevant -- right in the import dialog.

The instructions on the Settings row can stay as-is (they're useful there too), or we can keep only the dialog version. Since the dialog is the entry point for the action, having it there makes most sense. I'll keep both for now since they serve slightly different contexts.

### Technical Details

**File: `src/components/AppleHealthImport.tsx`**

**Center button** (line 359): Change `<div>` to `<div className="flex justify-center">` around the file picker button.

**Add "see how" to dialog description** (lines 549-552): Replace the static DialogDescription with a version that includes a collapsible "see how" link and the instructions block. This requires:
- Add a `showInstructions` state to `AppleHealthImportDialog`
- Replace DialogDescription content with: "Select your exported Apple Health XML file to import workouts." followed by a "(see how)" toggle link
- When expanded, show the same instructions paragraph below the description (inside the dialog header area)

