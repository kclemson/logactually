/**
 * Per-chart visibility on the Trends page.
 *
 * Each built-in chart has a stable string ID. The user's hidden charts are
 * stored as an array of these IDs in `settings.hiddenCharts`. A chart is
 * visible when its ID is NOT present in that array, so new charts (new
 * exercises, new custom-log types) default to visible.
 */

// ── Stable ID builders ────────────────────────────────────────────────

export const CHART_IDS = {
  foodCalories: 'food:calories',
  foodMacroSplit: 'food:macroSplit',
  foodCombined: 'food:combined',
  exerciseCalorieBurn: 'exercise:calorieBurn',
} as const;

export function foodMacroChartId(macroKey: string): string {
  return `food:macro:${macroKey}`;
}

export function exerciseChartId(exerciseKey: string, subtype?: string | null): string {
  return `exercise:${exerciseKey}:${subtype ?? ''}`;
}

export function customLogChartId(logTypeId: string): string {
  return `customlog:${logTypeId}`;
}

export function bloodworkChartId(chartId: string): string {
  return `bloodwork:${chartId}`;
}

// ── Visibility helpers ────────────────────────────────────────────────

export function isChartHidden(id: string, hidden: readonly string[]): boolean {
  return hidden.includes(id);
}

/**
 * Returns the next hiddenCharts array with `id` toggled. Adds the ID when
 * currently visible, removes it when currently hidden.
 */
export function toggleChartId(id: string, hidden: readonly string[]): string[] {
  return hidden.includes(id)
    ? hidden.filter((h) => h !== id)
    : [...hidden, id];
}
