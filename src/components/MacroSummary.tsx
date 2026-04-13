import { DailyTotals } from '@/types/food';
import { type DisplayMacros, DEFAULT_DISPLAY_MACROS, MACRO_META, getMacroValue } from '@/lib/macro-display';

interface MacroSummaryProps {
  totals: DailyTotals;
  size?: 'sm' | 'lg';
  displayMacros?: DisplayMacros;
}

export function MacroSummary({ totals, size = 'lg', displayMacros = DEFAULT_DISPLAY_MACROS }: MacroSummaryProps) {
  const items = [
    { label: 'Calories', value: Math.round(totals.calories), unit: '' },
    ...displayMacros.map(key => ({
      label: MACRO_META[key].label,
      value: Math.round(getMacroValue(totals, key)),
      unit: MACRO_META[key].unit,
    })),
  ];

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-4 text-sm-app text-muted-foreground">
        {items.map(({ label, value, unit }) => (
          <span key={label}>
            {value}{unit} {label.charAt(0).toLowerCase()}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(({ label, value, unit }) => (
        <div
          key={label}
          className="flex flex-col items-center rounded-lg bg-muted/50 p-2"
        >
          <span className="text-lg font-bold text-foreground">
            {value}
            <span className="text-sm font-normal text-muted-foreground">
              {unit}
            </span>
          </span>
          <span className="text-sm-app text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
