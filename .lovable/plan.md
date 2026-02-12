

## Prevent Dialogs from Closing on Viewport Resize

### Problem

When switching viewport sizes in dev mode (or on orientation change on real devices), Radix UI dialogs close because the resize event triggers an "interact outside" dismissal. This affects multiple dialogs across the app.

### Solution

Add `onInteractOutside={(e) => e.preventDefault()}` to `DialogContent` in the affected dialogs. This prevents pointer/focus events outside the dialog from dismissing it, while still allowing the X button and Escape key to close normally.

### Technical Details

Add `onInteractOutside={(e) => e.preventDefault()}` to `DialogContent` in these files:

| File | Component |
|------|-----------|
| `src/components/AskTrendsAIDialog.tsx` | Ask AI dialog |
| `src/components/CreateSavedDialog.tsx` | Create meal/routine dialog |
| `src/components/CalorieBurnDialog.tsx` | Calorie burn config |
| `src/components/AppleHealthImport.tsx` | Apple Health import (already has this) |
| `src/components/ChangePasswordDialog.tsx` | Change password |
| `src/components/FeedbackForm.tsx` | Feedback form |
| `src/components/DemoPreviewDialog.tsx` | Demo preview |
| `src/components/PopulateDemoDataDialog.tsx` | Populate demo data |
| `src/components/DeleteAccountDialog.tsx` | Delete account |

Each change is a single prop addition to the existing `DialogContent` element. No layout or logic changes needed.

Dialogs will still close via the X button and Escape key -- only unintentional outside-click/resize dismissals are prevented.

