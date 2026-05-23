Add a search link icon next to each bloodwork analyte name that opens a browser search for `{display_name} blood test`.

Changes in `src/components/BloodworkPanelGroup.tsx`:

1. Import `Link` icon from lucide-react (or reuse `ExternalLink`).
2. Add a small inline link element after each `display_name` span in both rendering paths:
   - The flat filtering view (line ~233)
   - The expanded section view (line ~368)
3. The link `href` opens `https://www.google.com/search?q={encodeURIComponent(displayName + ' blood test')}` in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).
4. Desktop hover behavior: add a `group/row` class to the parent flex container so the link icon is hidden by default (`md:opacity-0`) and appears on row hover (`md:group-hover/row:opacity-100`).
5. Mobile behavior: always visible (`opacity-100`).
6. Call `e.stopPropagation()` on click so expanding/collapsing the panel is not triggered.

No backend or database changes required.