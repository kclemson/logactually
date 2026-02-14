

## Refine Log Template Picker List Design

### Changes

**1. Units inline after name (not right-aligned)**

Show the unit in lighter gray text immediately after the template name, like: `Body Weight lbs` instead of pushing units to the far right.

**2. Reorder templates -- group unit-bearing ones together**

Move Water Intake up so all templates with units are consecutive, then the unit-less ones follow:

```text
Body Weight          lbs
Body Measurements     in
Body Fat %             %
Blood Pressure      mmHg
Sleep                hrs
Water Intake          oz
Mood
Journal
```

This means reordering the `LOG_TEMPLATES` array in `log-templates.ts` to swap Water Intake (currently index 7) with Mood (currently index 5).

**3. "Create your own" styled more like a regular row**

Give it the same row layout as the templates (icon left, text left-aligned, same padding/hover treatment) so it reads as the last item in the list rather than a separate footnote link.

### Technical Details

**File: `src/lib/log-templates.ts`** (lines 17-20)

Reorder the array entries so Water Intake comes after Sleep and before Mood:

```
Sleep        (index 5)
Water Intake (index 6)  -- moved up from 7
Mood         (index 7)  -- moved down from 5
Journal      (index 8)
```

**File: `src/components/LogTemplatePickerDialog.tsx`**

1. **Container** (line 33): Change from `grid grid-cols-2 gap-2` to `flex flex-col`

2. **Template buttons** (lines 38-53): Restyle each from centered bordered cards to horizontal rows:
   - `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-accent`
   - Icon: `h-4 w-4 text-teal-500` (slightly smaller)
   - Name + unit inline: `<span className="font-medium">{name}</span>` followed by `<span className="text-xs text-muted-foreground ml-1">{unit}</span>`
   - "Already added" shown the same way as unit text (inline, muted)
   - No `border border-border`, no `flex-col items-center`

3. **"Create your own" button** (lines 57-63): Match the template row styling:
   - Same `flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-accent` as other rows
   - Wrench icon same size as template icons (`h-4 w-4`)
   - Remove `justify-center` and `pt-1`; keep `text-muted-foreground`

Two files, layout-only changes.
