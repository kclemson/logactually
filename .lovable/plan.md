

## Add Purple Icon Color for Weights Trends Section

Currently, `CollapsibleSection` hardcodes all icons to blue (`hsl(217 91% 60%)`). To match the purple color scheme of the weight charts, we'll add an optional `iconClassName` prop.

### Changes

**File: `src/components/CollapsibleSection.tsx`**

1. Add optional `iconClassName` prop to the interface
2. Apply it to the Icon component, defaulting to the existing blue if not provided

```tsx
interface CollapsibleSectionProps {
  // ... existing props
  /** Optional className for icon (default: blue focus color) */
  iconClassName?: string;
}

// In the component:
<Icon className={cn("h-4 w-4", iconClassName || "text-[hsl(217_91%_60%)]")} />
```

**File: `src/pages/Trends.tsx`**

Update the Weights Trends section to pass a purple icon class matching the training volume color:

```tsx
<CollapsibleSection 
  title="Weights Trends" 
  icon={Dumbbell} 
  iconClassName="text-[hsl(262_83%_58%)]"  // Match CHART_COLORS.trainingVolume
  defaultOpen={true}
>
```

### Result

- Food Trends section: Blue icon (default)
- Weights Trends section: Purple icon (matches the weight charts color scheme)

