

## Fix Changelog Image Alignment

### Problem
Images are nested inside the same flex child as the text. Since that child's width depends on text length (whether it wraps or not), `items-center` causes images to shift horizontally per entry. Even switching to `items-start` would still leave images indented by the date label width.

### Solution
Restructure each entry so the image renders **outside** the date+text flex row, at the full width of the list item. This guarantees all images share the same left edge regardless of text length.

### Technical Change

**`src/pages/Changelog.tsx` (lines 96-124)**

Current structure:
```
<li>
  <div class="flex gap-2">        <!-- date + text side by side -->
    <span>date</span>
    <div class="flex-col">         <!-- text AND image together -->
      <span>text</span>
      <img />                      <!-- image position depends on text width -->
    </div>
  </div>
</li>
```

New structure:
```
<li>
  <div class="flex gap-2">        <!-- date + text side by side -->
    <span>date</span>
    <span>text</span>
  </div>
  <img class="mt-2 ml-[52px]" />  <!-- image outside the flex row, fixed indent -->
</li>
```

The `ml-[52px]` (or similar value matching the date label width + gap) will align all images to the same left edge. Add `loading="lazy"` to images as well to reduce the "text loads then images pop in" effect.

For entries with multiple images, the wrapper div also moves outside the flex row with the same left margin.
