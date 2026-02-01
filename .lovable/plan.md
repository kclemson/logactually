

## Add `useHasHover` for Chart Tooltip Behavior

A focused change that adds input capability detection without modifying existing working code.

---

### Overview

| What | Action |
|------|--------|
| `useIsMobile` | **Leave unchanged** - works fine for layout |
| `useHasHover` | **Add new** - simple constant for input detection |
| Chart components | **Update** - use `useHasHover` for tooltip behavior |
| Tailwind `can-hover` variant | **Add** - useful for future CSS patterns |

---

### File Changes

#### 1. Create `useHasHover` hook

**New file: `src/hooks/use-has-hover.tsx`**

```typescript
// Read once at module load - device capabilities don't change mid-session
const HAS_HOVER = typeof window !== "undefined"
  ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
  : true; // SSR: assume desktop

export function useHasHover(): boolean {
  return HAS_HOVER;
}
```

#### 2. Add Tailwind `can-hover` variant

**Update: `tailwind.config.ts`**

```typescript
plugins: [
  require("tailwindcss-animate"),
  function({ addVariant }: { addVariant: (name: string, definition: string) => void }) {
    addVariant('can-hover', '@media (hover: hover) and (pointer: fine)');
  },
],
```

#### 3. Update chart components

**Update: `src/components/trends/FoodChart.tsx`**

- Replace `import { useIsMobile }` with `import { useHasHover }`
- In each component (`FoodChart`, `StackedMacroChart`, `VolumeChart`):
  - Replace `const isMobile = useIsMobile()` with `const isTouchDevice = !useHasHover()`
  - Update all references from `isMobile` to `isTouchDevice`

**Update: `src/pages/Trends.tsx`**

- In `ExerciseChart` component:
  - Add `import { useHasHover }` 
  - Replace `const isMobile = useIsMobile()` with `const isTouchDevice = !useHasHover()`
  - Update all references from `isMobile` to `isTouchDevice`

---

### Summary

| File | Action |
|------|--------|
| `src/hooks/use-has-hover.tsx` | Create |
| `src/hooks/use-mobile.tsx` | **No change** |
| `tailwind.config.ts` | Add plugin |
| `src/components/trends/FoodChart.tsx` | Use `useHasHover` |
| `src/pages/Trends.tsx` | Use `useHasHover` in ExerciseChart |

---

### Expected Behavior

| Device | Chart Behavior |
|--------|----------------|
| Desktop (any viewport width) | Hover shows tooltip, click navigates |
| Mobile/tablet | Tap shows persistent tooltip with "Go to day" button |

