import { forwardRef } from 'react';
import { DailyTotals } from '@/types/food';

interface MacroSummaryProps {
  totals: DailyTotals;
  size?: 'sm' | 'lg';
}

export const MacroSummary = forwardRef<HTMLDivElement, MacroSummaryProps>(
  ({ totals, size = 'lg' }, ref) => {
    const items = [
      { label: 'Calories', value: Math.round(totals.calories), unit: '' },
      { label: 'Protein', value: Math.round(totals.protein), unit: 'g' },
      { label: 'Carbs', value: Math.round(totals.carbs), unit: 'g' },
      { label: 'Fat', value: Math.round(totals.fat), unit: 'g' },
    ];

    if (size === 'sm') {
      return (
        <div
          ref={ref}
          className="flex items-center gap-4 text-size-compact text-muted-foreground"
        >
          {items.map(({ label, value, unit }) => (
            <span key={label}>
              {value}{unit} {label.charAt(0).toLowerCase()}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div ref={ref} className="grid grid-cols-4 gap-2">
        {items.map(({ label, value, unit }) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-lg bg-muted/50 p-2"
          >
            <span className="text-body font-bold text-foreground">
              {value}
              <span className="text-size-caption font-normal text-muted-foreground">
                {unit}
              </span>
            </span>
            <span className="text-size-caption text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    );
  }
);

MacroSummary.displayName = 'MacroSummary';
