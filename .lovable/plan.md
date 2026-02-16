

# Fix: Bottom Nav Active Color Illegible in Light Theme

## Problem
Calendar, Trends, and Settings nav items use `text-white` as their active color. In dark mode this works fine, but in light mode the background is light gray, making white text invisible.

## Solution
Change the active color for these general-purpose nav items from `text-white` to `text-foreground`. This CSS variable resolves to near-black in light mode and near-white in dark mode, giving proper contrast in both themes.

Food (blue), Exercise (purple), and Custom (teal) keep their explicit theme colors — those have sufficient contrast in both modes.

## Technical Detail

**File: `src/components/BottomNav.tsx`**

Change lines 23-26 from:
```tsx
{ to: '/history', icon: CalendarDays, label: 'Calendar', activeColor: 'text-white' },
{ to: '/trends', icon: TrendingUp, label: 'Trends', activeColor: 'text-white' },
{ to: '/settings', icon: Settings, label: 'Settings', activeColor: 'text-white' },
...(showAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin', activeColor: 'text-white' }] : []),
```

To:
```tsx
{ to: '/history', icon: CalendarDays, label: 'Calendar', activeColor: 'text-foreground' },
{ to: '/trends', icon: TrendingUp, label: 'Trends', activeColor: 'text-foreground' },
{ to: '/settings', icon: Settings, label: 'Settings', activeColor: 'text-foreground' },
...(showAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin', activeColor: 'text-foreground' }] : []),
```

One file, 4 lines changed. No other files affected.
