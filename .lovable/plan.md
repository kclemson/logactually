

## Fix: header transparency when charts scroll underneath

The header uses `bg-background/95` with `backdrop-blur`, dropping to `bg-background/60` when backdrop-filter is supported. Charts in `ChartCard` use `z-40` on their inner content, which matches the header's `z-40`, causing overlap where chart content renders on top of the semi-transparent header.

### Change in `src/components/Header.tsx`

- Increase header `z-index` from `z-40` to `z-50` so it always sits above chart content (which uses `z-40`)

One-line change on the `<header>` element's className.

