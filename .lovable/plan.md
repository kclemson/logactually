# Remove duplicated text on media-less memory slides

## Problem

In the immersive memory viewer, a text-only entry (no photo/video) renders its note **twice**: large in the main stage (`SlideContent`) and again as the small caption below the date.

## Fix

In `src/pages/MemoryViewer.tsx`, only build the `caption` when the current item has media. The caption exists to caption a photo/video; for text-only items the stage already shows the note.

- Change the `caption` definition (currently keyed only on `currentItem.entry.text_value`) to also require `currentItem.media` to be non-null. When `media` is null, render no caption.

No other behavior changes: text-only slide styling, photo/video slides, date row, dots, and action bar all stay the same.

## Verification

- Open a text-only memory: note shows once (in the stage), no duplicate below the date.
- Open a photo/video memory that has a caption: caption still shows below the date as before.
