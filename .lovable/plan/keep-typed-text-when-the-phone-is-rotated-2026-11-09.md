# Keep typed text when the phone is rotated

## What's going on
When a phone turns to landscape, the screen becomes wider than 768px, and the app switches from its "phone" layout to its "desktop" layout. The only difference between the two is the pull-down-to-refresh feature, which is only on in the phone layout. But turning it on or off rebuilds the whole page underneath it. A rebuilt page starts fresh, so the text box goes back to empty.

This affects more than the food box: anything in progress on the page is lost the same way, such as the exercise box, a half-filled custom log, or an open edit.

## Fix
Keep the page structure the same on phones and desktops: pull-to-refresh is always set up, so rotating the phone no longer rebuilds the page. Desktop behavior doesn't change, because pull-to-refresh only reacts to touch gestures, which a mouse and keyboard never produce.

## Technical notes
- In `src/components/Layout.tsx`, remove the `isMobile ? <PullToRefresh>… : mainContent` branch and always wrap the main content in `PullToRefresh`. Remove the unused `useIsMobile` import.
- Check on a phone-sized screen in the browser: type in the food box, resize to landscape width (more than 768px), and confirm the text is still there.
