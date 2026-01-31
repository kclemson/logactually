

## Replace Login Page Logo with Updated Version

### Summary

Replace the current horizontal logo file with the new version that has pixel-level refinements.

### Changes Required

**1. Replace the logo asset**

Copy `user-uploads://logactually-logo-horiz-2.png` to `public/logactually-logo-horiz.png`, overwriting the existing file.

This maintains the same filename so no code changes are needed - the three references in `src/pages/Auth.tsx` (password update form, password reset form, and main login form) will automatically use the updated image.

### No Code Changes Required

Since we're replacing the file with the same name, all existing `<img src="/logactually-logo-horiz.png" ... />` references will pick up the new version without any modifications.

