/**
 * Short, canonical labels for the custom-log view toggle's "featured type" segment.
 *
 * Built-in types get a hand-tuned short label so the toggle stays compact on
 * mobile. User-named types fall back to a generic trim + truncation rule, with
 * the full name surfaced via title/aria-label by the caller.
 */

const CANONICAL_LABELS: Record<string, string> = {
  'Photo Scrapbook': 'Scrapbook',
  // Legacy name kept so existing "Memories" types still map cleanly.
  'Memories': 'Scrapbook',
  'Body Weight': 'Weight',
  'Body Fat %': 'Body Fat',
  'Blood Pressure': 'BP',
  'Water Intake': 'Water',
  'Medication': 'Meds',
};

const DEFAULT_MAX_LEN = 11;

/**
 * Returns a compact label for the toggle segment of a featured custom log type.
 * @param name The stored log type name.
 * @param maxLen Max characters before truncation (default 11).
 */
export function getToggleLabel(name: string, maxLen: number = DEFAULT_MAX_LEN): string {
  const trimmed = (name ?? '').trim();

  const canonical = CANONICAL_LABELS[trimmed];
  if (canonical) return canonical;

  // Body measurements read better without the redundant " Measurement" suffix.
  const withoutMeasurement = trimmed.replace(/\s+Measurement$/i, '');

  if (withoutMeasurement.length <= maxLen) return withoutMeasurement;
  return withoutMeasurement.slice(0, maxLen - 1).trimEnd() + '…';
}
