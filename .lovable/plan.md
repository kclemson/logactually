
## Fix Two Issues: Calendar Dark Theme Colors + Bottom Nav Layout

---

### Issue #1: Calendar Dark Theme Colors

**Problem**: The calendar cell background colors (rose for food, purple for weights, gradient for both) are barely visible in dark mode because they use very low opacity values (20-30%).

**Current dark mode classes**:
- `dark:bg-rose-900/20` - food entries (barely visible)
- `dark:bg-purple-900/20` - weight entries (barely visible)  
- `dark:from-rose-900/20 dark:to-purple-900/20` - both (gradient invisible)

**Solution**: Increase the opacity significantly for dark mode backgrounds to make them visually distinct like the light theme.

**File:** `src/pages/History.tsx` (lines 191-193)

| Type | Current | New |
|------|---------|-----|
| Food only | `dark:bg-rose-900/20` | `dark:bg-rose-900/40` |
| Food hover | `dark:hover:bg-rose-800/30` | `dark:hover:bg-rose-800/50` |
| Weights only | `dark:bg-purple-900/20` | `dark:bg-purple-900/40` |
| Weights hover | `dark:hover:bg-purple-800/30` | `dark:hover:bg-purple-800/50` |
| Both (gradient from) | `dark:from-rose-900/20` | `dark:from-rose-900/40` |
| Both (gradient to) | `dark:to-purple-900/20` | `dark:to-purple-900/40` |
| Both hover from | `dark:hover:from-rose-800/30` | `dark:hover:from-rose-800/50` |
| Both hover to | `dark:hover:to-purple-800/30` | `dark:hover:to-purple-800/50` |

---

### Issue #2: Bottom Nav Icon/Text Sizing Regression

**Problem**: After the recent layout change, the weights icon appears much smaller than other icons, and there may be inconsistent font sizes. The user wants the balanced layout from the "before" screenshot without dynamic shrinking.

**Root Cause Analysis**: The layout change introduced `h-14` fixed height with `flex-1`, but the real issue is that the previous layout used `gap-1` between icon and text, while the new layout uses `mt-1` on the label. This shouldn't cause icon shrinking, but let me check what specifically needs to be reverted.

Looking at the "before" image (image-325), the layout was:
- Icons are vertically centered within the nav item
- All icons appear the same size
- Text appears below with consistent sizing

**Solution**: Revert to a simpler, non-dynamic layout that maintains consistent sizing:

1. Remove `flex-1` which causes items to stretch/shrink based on available space
2. Use explicit padding and sizing that doesn't change based on content
3. Keep the icon size at `h-4 w-4` (fixed)
4. Keep text at `text-xs` (fixed)
5. Use `py-2.5` for vertical padding like before, or a fixed approach

**File:** `src/components/BottomNav.tsx`

```tsx
// Revert className to simpler fixed layout (lines 28-35)
className={({ isActive }) =>
  cn(
    'flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors',
    isActive
      ? 'text-primary'
      : 'text-muted-foreground hover:text-foreground'
  )
}

// Revert label to simpler styling (line 38)
<span className="text-xs text-center">{label}</span>
```

This reverts to the original layout that was working, while keeping the new Utensils icon for food.

---

### Files to Modify

1. **src/pages/History.tsx** - Increase dark mode calendar cell opacity
2. **src/components/BottomNav.tsx** - Revert layout to pre-change styling

---

### Technical Details

**Calendar opacity rationale**: The light mode uses solid colors (rose-100, purple-100) which have ~90% lightness. For dark mode, we need higher opacity against the dark background (~4.9% lightness) to achieve similar visual differentiation. Going from 20% to 40% opacity doubles the visibility.

**Nav layout rationale**: The previous `gap-1 py-2.5` layout provided consistent spacing without any dynamic sizing behavior. The `h-14` fixed height combined with `flex-1` may be causing browser layout quirks where flex children don't maintain their intrinsic sizes.
