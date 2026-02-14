

## Fix Custom Logs Changelog Image

The file `public/changelog/custom-logs.png` exists and is correctly referenced, but it appears the previous copy may not have replaced the content properly (or a stale cached version persists).

### Fix

1. Re-copy the user's uploaded image (`user-uploads://customlog.png`) to `public/changelog/custom-logs.png`, overwriting the existing file.

Single file copy, no code changes needed.

