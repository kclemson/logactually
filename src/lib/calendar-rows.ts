export type CalendarMetric = 'calories' | 'protein' | 'carbs' | 'net_carbs' | 'fat' | 'none';
export type CalendarBottom = CalendarMetric | 'icons';

export type CalendarIcon = 'lifting' | 'runwalk' | 'cycling' | 'othercardio' | 'custom';
export const CALENDAR_ICON_LABELS: Record<CalendarIcon, string> = {
  lifting: 'Lifting',
  runwalk: 'Run / walk',
  cycling: 'Cycling',
  othercardio: 'Other cardio',
  custom: 'Custom logs',
};

/** null = all icons enabled. */
export function isCalendarIconEnabled(selected: string[] | null | undefined, icon: CalendarIcon): boolean {
  return selected == null || selected.includes(icon);
}

export interface CalendarRows {
  top: CalendarMetric;
  bottom: CalendarBottom;
}

export const CALENDAR_METRIC_LABELS: Record<CalendarBottom, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  net_carbs: 'Net carbs',
  fat: 'Fat',
  icons: 'Icons',
  none: 'Nothing',
};

/** Saved choice wins; otherwise default bottom depends on whether exercise tracking is on. */
export function resolveCalendarRows(
  saved: { top?: string; bottom?: string } | null | undefined,
  showWeights: boolean,
): CalendarRows {
  // Legacy saved value 'activity' was renamed to 'icons'.
  const savedBottom = saved?.bottom === 'activity' ? 'icons' : saved?.bottom;
  return {
    top: (saved?.top as CalendarMetric) ?? 'calories',
    bottom: (savedBottom as CalendarBottom) ?? (showWeights ? 'icons' : 'protein'),
  };
}

export interface DayMacros {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
}

export function formatDayMetric(metric: CalendarMetric, d: DayMacros): string {
  switch (metric) {
    case 'calories': return Math.round(d.calories).toLocaleString();
    case 'protein': return `${Math.round(d.protein)}g`;
    case 'carbs': return `${Math.round(d.carbs)}g`;
    case 'net_carbs': return `${Math.round(Math.max(0, d.carbs - d.fiber))}g`;
    case 'fat': return `${Math.round(d.fat)}g`;
    default: return '';
  }
}
