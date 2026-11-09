export type CalendarMetric = 'calories' | 'protein' | 'carbs' | 'net_carbs' | 'fat' | 'none';
export type CalendarBottom = CalendarMetric | 'activity';

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
  activity: 'Activity icons',
  none: 'Nothing',
};

/** Saved choice wins; otherwise default bottom depends on whether exercise tracking is on. */
export function resolveCalendarRows(
  saved: Partial<CalendarRows> | null | undefined,
  showWeights: boolean,
): CalendarRows {
  return {
    top: saved?.top ?? 'calories',
    bottom: saved?.bottom ?? (showWeights ? 'activity' : 'protein'),
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
