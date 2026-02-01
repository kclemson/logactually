

## Mobile Tap-to-Show Tooltip Pattern

### Overview

Implement a device-aware interaction model where:
- **Desktop**: Hover shows tooltip, click navigates directly (unchanged)
- **Mobile**: Tap shows persistent tooltip with "Go to day" button, tap outside dismisses

### Components to Update

| Component | Changes |
|-----------|---------|
| `CompactTooltip` | Add `isMobile`, `onGoToDay`, `rawDate`, `onDismiss` props; render "Go to day" button on mobile |
| `ExerciseChart` | Add `activeBarIndex` state, conditional click behavior, controlled tooltip mode |
| Food charts (Calories, Macro Split, Combined, Protein/Carbs/Fat) | Same pattern as ExerciseChart |
| Volume chart | Same pattern |

### Implementation Details

**1. Update CompactTooltip to support mobile mode**

Add new props and conditionally render a "Go to day" link:

```typescript
const CompactTooltip = ({ 
  active, 
  payload, 
  label, 
  formatter, 
  totalKey, 
  totalLabel, 
  totalColor,
  // New props for mobile
  isMobile,
  onGoToDay,
  rawDate,
}: CompactTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="...">
      {/* Existing tooltip content */}
      
      {/* Mobile "Go to day" button */}
      {isMobile && onGoToDay && rawDate && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onGoToDay(rawDate);
          }}
          className="mt-1.5 text-[10px] text-primary hover:underline"
        >
          Go to day →
        </button>
      )}
    </div>
  );
};
```

**2. Update ExerciseChart for mobile**

```typescript
const ExerciseChart = ({ exercise, unit, onBarClick }: Props) => {
  const isMobile = useIsMobile();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  
  // Reset active bar when chart data changes (e.g., mph toggle)
  useEffect(() => {
    setActiveBarIndex(null);
  }, [showMph]);

  const handleBarClick = (data: any, index: number) => {
    if (isMobile) {
      // Toggle: tap same bar to close, different bar to switch
      setActiveBarIndex(prev => prev === index ? null : index);
    } else {
      onBarClick(data.rawDate);
    }
  };

  const handleGoToDay = (date: string) => {
    setActiveBarIndex(null);
    onBarClick(date);
  };

  return (
    <Card className="relative">
      {/* Click-away overlay to dismiss tooltip */}
      {isMobile && activeBarIndex !== null && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveBarIndex(null)}
        />
      )}
      
      {/* Chart content with relative z-index */}
      <div className="relative z-20">
        <BarChart>
          <Tooltip
            active={isMobile ? activeBarIndex !== null : undefined}
            payload={isMobile && activeBarIndex !== null 
              ? [{ payload: chartData[activeBarIndex] }] 
              : undefined}
            content={
              <CompactTooltip
                isMobile={isMobile}
                onGoToDay={handleGoToDay}
                rawDate={activeBarIndex !== null ? chartData[activeBarIndex]?.rawDate : undefined}
                formatter={...}
              />
            }
          />
          <Bar onClick={(data, index) => handleBarClick(data, index)} />
        </BarChart>
      </div>
    </Card>
  );
};
```

**3. Apply same pattern to food charts**

The Trends component has multiple chart sections that need this treatment:
- Calories chart (line 616-625)
- Macro Split chart (line 648-678)
- Combined Calories + Macros chart (line 702-742)
- Protein/Carbs/Fat charts (line 768-781)
- Total Volume chart (line 822-860)

Each will need:
- Local `activeBarIndex` state (or share state per section)
- Conditional click handler
- Click-away overlay
- Updated tooltip props

**4. Stacked bar charts (special handling)**

For stacked charts (Macro Split, Combined), clicking any segment in the stack should select that date's bar group. The index from the click event maps to the chartData array.

### File Changes

| File | Lines | Description |
|------|-------|-------------|
| `src/pages/Trends.tsx` | 1-21 | Add `useIsMobile` import |
| `src/pages/Trends.tsx` | 66-105 | Enhance `CompactTooltip` with mobile props |
| `src/pages/Trends.tsx` | 115-326 | Update `ExerciseChart` with mobile state and handlers |
| `src/pages/Trends.tsx` | 597-788 | Update food chart sections |
| `src/pages/Trends.tsx` | 805-865 | Update volume chart |

### User Experience

```text
Mobile Flow:
1. User taps bar for Feb 1
2. Tooltip appears with data + "Go to day →" link
3. User can:
   a. Read data and tap elsewhere → tooltip dismisses
   b. Tap "Go to day →" → navigates to /weights?date=2026-02-01
   c. Tap different bar → switches tooltip to that bar

Desktop Flow (unchanged):
1. User hovers bar → tooltip shows
2. User clicks bar → navigates immediately
```

### Edge Cases

- **Scroll**: Overlay uses `fixed inset-0` so scrolling doesn't break dismissal
- **Multiple charts**: Each chart manages its own `activeBarIndex` independently
- **90-day view**: Many bars, but tap target is the bar itself - works fine
- **mph/time toggle**: Reset `activeBarIndex` when chart mode changes

