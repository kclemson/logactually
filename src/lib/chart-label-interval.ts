/**
 * Shared label interval utilities for Trends charts.
 *
 * Determines how often to render a date label on the X-axis,
 * counting from the right (most recent data point always labeled).
 */

/** Half-width charts (~50% viewport): used in exercise charts, custom log charts, etc. */
export function getLabelInterval(dataLength: number): number {
  if (dataLength <= 7) return 1;
  if (dataLength <= 14) return 2;
  if (dataLength <= 21) return 3;
  if (dataLength <= 35) return 4;
  if (dataLength <= 50) return 5;
  if (dataLength <= 70) return 7;
  return 10;
}

/** Full-width charts (~100% viewport): more generous thresholds since there's more horizontal space. */
export function getFullWidthLabelInterval(dataLength: number): number {
  if (dataLength <= 14) return 1;
  if (dataLength <= 28) return 2;
  if (dataLength <= 42) return 3;
  if (dataLength <= 70) return 4;
  if (dataLength <= 90) return 5;
  return 7;
}

/**
 * Exercise charts use higher density thresholds (up to 90 data points)
 * since they can have many weight×date combinations.
 */
export function getExerciseLabelInterval(dataLength: number): number {
  if (dataLength <= 12) return 1;
  if (dataLength <= 20) return 2;
  if (dataLength <= 35) return 4;
  if (dataLength <= 50) return 6;
  if (dataLength <= 70) return 10;
  if (dataLength <= 90) return 15;
  return 20;
}
