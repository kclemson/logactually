

## Fix macro dropdowns to match other settings dropdowns

### Problem
The three macro `Select` dropdowns use `w-full`, making them span the entire row width. They should match the `w-[150px]` width used by Theme, Weight Units, Distance Units, and First day of week dropdowns, and be right-aligned.

### Change — `src/components/settings/PreferencesSection.tsx`

Change the flex container from `flex flex-col gap-1.5` to `flex flex-col gap-1.5 items-end` so dropdowns right-align, and change each `SelectTrigger` from `w-full` to `w-[150px]` to match the other settings selects.

- Line 217: `<div className="flex flex-col gap-1.5">` → `<div className="flex flex-col gap-1.5 items-end">`
- Line 230: `<SelectTrigger className="w-full h-8 text-xs">` → `<SelectTrigger className="w-[150px] h-8 text-xs">`

Two tiny edits in one file.

