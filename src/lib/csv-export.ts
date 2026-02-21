import { FoodEntry } from '@/types/food';
import { format } from 'date-fns';
import { isCardioExercise } from '@/lib/exercise-metadata';

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
 * Custom log data for CSV export
 */
export interface CustomLogExportRow {
  logged_date: string;
  created_at: string;
  log_type_name: string;
  value_type: string;
  numeric_value: number | null;
  numeric_value_2: number | null;
  text_value: string | null;
  unit: string | null;
  dose_time: string | null;
  entry_notes: string | null;
}

/**
 * Export custom logs - one row per entry, with conditional BP columns
 */
export function exportCustomLog(rows: CustomLogExportRow[]) {
  const sorted = [...rows].sort((a, b) => {
    if (a.logged_date !== b.logged_date) return b.logged_date.localeCompare(a.logged_date);
    return b.created_at.localeCompare(a.created_at);
  });

  const hasBP = sorted.some(r => r.value_type === 'dual_numeric');

  // Column order: Date | Time | Dose Time | Log Type | Value | Unit | [Systolic | Diastolic | Reading |] Notes
  const headers = hasBP
    ? ['Date', 'Time', 'Dose Time', 'Log Type', 'Value', 'Unit', 'Systolic', 'Diastolic', 'Reading', 'Notes']
    : ['Date', 'Time', 'Dose Time', 'Log Type', 'Value', 'Unit', 'Notes'];

  function formatDoseTime(dose_time: string | null): string {
    if (!dose_time) return '';
    const [h, m] = dose_time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const dataRows = sorted.map((row) => {
    const isBP = row.value_type === 'dual_numeric';
    const time = format(new Date(row.created_at), 'HH:mm');
    const doseTime = formatDoseTime(row.dose_time);
    const value = isBP ? '' : (row.numeric_value ?? row.text_value ?? '');
    const base: (string | number)[] = [row.logged_date, time, doseTime, row.log_type_name, value, row.unit ?? ''];
    if (hasBP) {
      base.push(
        isBP ? (row.numeric_value ?? '') : '',
        isBP ? (row.numeric_value_2 ?? '') : '',
        isBP && row.numeric_value != null && row.numeric_value_2 != null
          ? `${row.numeric_value}/${row.numeric_value_2}`
          : '',
      );
    }
    base.push(row.entry_notes ?? '');
    return base;
  });

  const csv = [
    headers.join(','),
    ...dataRows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  downloadCSV(csv, `custom-log-${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
  // Promoted metadata columns
  calories_burned_override?: number | null;
  effort?: number | null;
  heart_rate?: number | null;
  incline_pct?: number | null;
  cadence_rpm?: number | null;
  speed_mph?: number | null;
  exercise_metadata?: Record<string, number> | null;
  duration_minutes?: number | null;
  distance_miles?: number | null;
  exercise_key: string;
  exercise_subtype?: string | null;
}

/**
 * Export weight log - one row per exercise set
 */
const LBS_TO_KG = 0.453592;
const MI_TO_KM = 1.60934;

export function exportWeightLog(sets: WeightSetExport[]) {
  const headers = ['Date', 'Time', 'Category', 'Type', 'Subtype', 'Exercise', 'Sets', 'Reps', 'Weight (lbs)', 'Weight (kg)', 'Duration (min)', 'Distance (mi)', 'Distance (km)', 'Incline (%)', 'Effort (1-10)', 'Calories Burned', 'Heart Rate (bpm)', 'Cadence (rpm)', 'Speed (mph)', 'Speed (km/h)', 'Raw Input'];

  const sorted = [...sets].sort((a, b) => {
    if (a.logged_date !== b.logged_date) {
      return b.logged_date.localeCompare(a.logged_date);
    }
    return b.created_at.localeCompare(a.created_at);
  });

  const rows = sorted.map((set) => {
    // Column-first with JSONB fallback
    const incline = set.incline_pct ?? set.exercise_metadata?.incline_pct ?? '';
    const effortVal = set.effort ?? set.exercise_metadata?.effort ?? '';
    const calBurned = set.calories_burned_override ?? set.exercise_metadata?.calories_burned ?? '';
    const hr = set.heart_rate ?? set.exercise_metadata?.heart_rate ?? '';
    const cadence = set.cadence_rpm ?? set.exercise_metadata?.cadence_rpm ?? '';
    const speed = set.speed_mph ?? set.exercise_metadata?.speed_mph ?? null;
    const distMi = set.distance_miles;
    const category = isCardioExercise(set.exercise_key) ? 'Cardio' : set.exercise_key === 'other' ? 'Other' : 'Strength';
    return [
      set.logged_date,
      format(new Date(set.created_at), 'HH:mm'),
      category,
      set.exercise_key,
      set.exercise_subtype ?? '',
      set.description,
      set.sets,
      set.reps,
      set.weight_lbs,
      Math.round(set.weight_lbs * LBS_TO_KG),
      set.duration_minutes ?? '',
      distMi ?? '',
      distMi != null ? Number((distMi * MI_TO_KM).toFixed(2)) : '',
      incline,
      effortVal,
      calBurned,
      hr,
      cadence,
      speed ?? '',
      speed != null ? Number((speed * MI_TO_KM).toFixed(1)) : '',
      set.raw_input || '',
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const timestamp = format(new Date(), 'yyyy-MM-dd');
  downloadCSV(csv, `weight-log-${timestamp}.csv`);
}
