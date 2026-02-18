

## Center Changelog Images Consistently

### Problem
Images are left-aligned with a fixed `ml-[52px]` margin. The user wants them horizontally centered within the content area, but consistently -- not dependent on text length like the old layout.

### Solution
Remove `ml-[52px]` from images and instead use `flex justify-center` wrappers (or simply `mx-auto` / `block mx-auto`) to center them. Since images are now outside the date+text flex row, their centering will be consistent regardless of text length.

### Technical Changes

**`src/pages/Changelog.tsx`**

1. **Line 106** -- Single image: change class from `ml-[52px] max-h-[200px] max-w-[280px] w-auto object-contain cursor-pointer` to `mx-auto max-h-[200px] max-w-[280px] w-auto object-contain cursor-pointer block` (replace fixed left margin with auto horizontal centering).

2. **Line 111** -- Multiple images wrapper: change class from `flex flex-wrap gap-2 mt-2 ml-[52px]` to `flex flex-wrap gap-2 mt-2 justify-center` (replace fixed left margin with centered flex layout).

### Result
All images will be horizontally centered within the full width of each list item, consistently across all entries regardless of text length.
