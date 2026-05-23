I’ll tighten the bloodwork upload dialog for mobile instead of just capping height.

Plan:
1. Update the panel dialog wrapper on `/custom` so it uses nearly the full mobile viewport width, top-anchored positioning, and an explicit viewport-safe max height instead of the default centered dialog behavior.
2. Reduce mobile padding inside the bloodwork panel container so the dropzone and list have enough usable width.
3. Fix horizontal overflow in `BloodworkUploadInput` by making every level `min-w-0`, shortening the mobile dropzone height, and preventing long filenames/actions from forcing the dialog wider than the screen.
4. Make duplicate/error rows mobile-first: filename truncates cleanly, status/actions wrap within the row, and the job list scrolls internally while the header/dropzone/Done button stay visible.
5. Verify visually against the 390×844 mobile viewport shown in your screenshot.