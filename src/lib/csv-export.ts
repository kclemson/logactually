import { FoodEntry } from '@/types/food';
import { format } from 'date-fns';

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Trigger a CSV file download in the browser
 */
function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export daily totals - one row per date with aggregated macros
 */
export function exportDailyTotals(entries: FoodEntry[]) {
  const byDate: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};

  entries.forEach((entry) => {
    const date = entry.eaten_date;
    if (!byDate[date]) {
      byDate[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    byDate[date].calories += entry.total_calories;
    byDate[date].protein += entry.total_protein;
    byDate[date].carbs += entry.total_carbs;
    byDate[date].fat += entry.total_fat;
  });

  const headers = ['Date', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];
  const rows = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, totals]) => [
      date,
      totals.calories,
      totals.protein,
      totals.carbs,
      totals.fat,
    ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const timestamp = format(new Date(), 'yyyy-MM-dd');
  downloadCSV(csv, `daily-totals-${timestamp}.csv`);
}

/**
 * Export detailed food log - one row per food item
 */
export function exportFoodLog(entries: FoodEntry[]) {
  const headers = [
    'Date', 'Time', 'Food Item', 'Calories',
    'Protein (g)', 'Carbs (g)', 'Fiber (g)', 'Sugar (g)',
    'Fat (g)', 'Saturated Fat (g)',
    'Sodium (mg)', 'Cholesterol (mg)',
    'Raw Input'
  ];

  const rows: (string | number)[][] = [];

  const sorted = [...entries].sort((a, b) => {
    if (a.eaten_date !== b.eaten_date) {
      return b.eaten_date.localeCompare(a.eaten_date);
    }
    return b.created_at.localeCompare(a.created_at);
  });

  sorted.forEach((entry) => {
    const time = format(new Date(entry.created_at), 'HH:mm');

    entry.food_items.forEach((item) => {
      rows.push([
        entry.eaten_date,
        time,
        item.description,
        item.calories,
        item.protein,
        item.carbs,
        item.fiber || 0,
        item.sugar || 0,
        item.fat,
        item.saturated_fat || 0,
        item.sodium || 0,
        item.cholesterol || 0,
        entry.raw_input || '',
      ]);
    });
  });

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const timestamp = format(new Date(), 'yyyy-MM-dd');
  downloadCSV(csv, `food-log-${timestamp}.csv`);
}

/**
 * Weight set data for CSV export
 */
export interface WeightSetExport {
  logged_date: string;
  created_at: string;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  raw_input: string | null;
}

/**
 * Export weight log - one row per exercise set
 */
const LBS_TO_KG = 0.453592;

export function exportWeightLog(sets: WeightSetExport[]) {
  const headers = ['Date', 'Time', 'Exercise', 'Sets', 'Reps', 'Weight (lbs)', 'Weight (kg)', 'Raw Input'];

  const sorted = [...sets].sort((a, b) => {
    if (a.logged_date !== b.logged_date) {
      return b.logged_date.localeCompare(a.logged_date);
    }
    return b.created_at.localeCompare(a.created_at);
  });

  const rows = sorted.map((set) => [
    set.logged_date,
    format(new Date(set.created_at), 'HH:mm'),
    set.description,
    set.sets,
    set.reps,
    set.weight_lbs,
    Math.round(set.weight_lbs * LBS_TO_KG),
    set.raw_input || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const timestamp = format(new Date(), 'yyyy-MM-dd');
  downloadCSV(csv, `weight-log-${timestamp}.csv`);
}
