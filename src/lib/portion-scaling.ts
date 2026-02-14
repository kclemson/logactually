import type { FoodItem } from '@/types/food';

/**
 * Multiplier step sequence for portion scaling.
 * Below 2x: 0.25 increments. Above 2x: larger jumps.
 */
export const MULTIPLIER_STEPS = [
  0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0, 5.0,
] as const;

/**
 * Step to the next/previous multiplier in the sequence.
 * Returns the same value if already at min/max.
 */
export function stepMultiplier(
  current: number,
  direction: 'up' | 'down'
): number {
  const idx = MULTIPLIER_STEPS.indexOf(current as (typeof MULTIPLIER_STEPS)[number]);
  if (idx === -1) {
    // Current value not in steps — snap to nearest
    if (direction === 'up') {
      const next = MULTIPLIER_STEPS.find((s) => s > current);
      return next ?? MULTIPLIER_STEPS[MULTIPLIER_STEPS.length - 1];
    }
    const prev = [...MULTIPLIER_STEPS].reverse().find((s) => s < current);
    return prev ?? MULTIPLIER_STEPS[0];
  }
  if (direction === 'up') {
    return idx < MULTIPLIER_STEPS.length - 1
      ? MULTIPLIER_STEPS[idx + 1]
      : current;
  }
  return idx > 0 ? MULTIPLIER_STEPS[idx - 1] : current;
}

/**
 * Best-effort scaling of a portion string.
 * Parses a leading number (int, decimal, or fraction like "1/2"),
 * multiplies it, and reconstructs with basic pluralisation.
 * Falls back to appending "(x<multiplier>)" for unparseable text.
 */
export function scalePortion(
  portion: string,
  multiplier: number
): string {
  if (!portion || multiplier === 1) return portion;

  // Match leading number: integer, decimal, or simple fraction (e.g. "1/2")
  const match = portion.match(
    /^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(.*)/
  );

  if (!match) {
    // Unparseable — append multiplier tag
    return `${portion} (x${multiplier})`;
  }

  const [, numStr, rest] = match;
  let originalNum: number;

  if (numStr.includes('/')) {
    const [num, den] = numStr.split('/').map(Number);
    originalNum = num / den;
  } else {
    originalNum = parseFloat(numStr);
  }

  const scaled = originalNum * multiplier;

  // Format: use integer when whole, otherwise one decimal
  const formatted =
    scaled === Math.floor(scaled) ? String(scaled) : scaled.toFixed(1);

  // Basic pluralisation: "1 cup" → "2 cups", "1 slice" → "2 slices"
  let unit = rest.trim();
  if (unit && originalNum === 1 && scaled !== 1) {
    // Simple English plural rules
    if (unit.endsWith('ch') || unit.endsWith('sh') || unit.endsWith('ss') || unit.endsWith('x')) {
      unit = unit + 'es';
    } else if (!unit.endsWith('s')) {
      unit = unit + 's';
    }
  } else if (unit && originalNum !== 1 && scaled === 1) {
    // Reverse: remove trailing 's' for singular
    if (unit.endsWith('ses') || unit.endsWith('xes') || unit.endsWith('ches') || unit.endsWith('shes')) {
      unit = unit.slice(0, -2);
    } else if (unit.endsWith('s') && !unit.endsWith('ss')) {
      unit = unit.slice(0, -1);
    }
  }

  return unit ? `${formatted} ${unit}` : formatted;
}

/** Numeric nutritional fields that should be scaled proportionally. */
const NUTRIENT_KEYS = [
  'calories',
  'protein',
  'carbs',
  'fat',
  'fiber',
  'sugar',
  'saturated_fat',
  'sodium',
  'cholesterol',
] as const;

/**
 * Scale all numeric nutritional fields and portion text by a multiplier.
 * Returns a partial FoodItem with updated values suitable for onUpdateItemBatch.
 */
export function scaleItemByMultiplier(
  item: FoodItem,
  multiplier: number
): Partial<FoodItem> {
  const updates: Partial<FoodItem> = {};

  for (const key of NUTRIENT_KEYS) {
    const val = item[key];
    if (typeof val === 'number') {
      (updates as Record<string, number>)[key] = Math.round(val * multiplier);
    }
  }

  if (item.portion) {
    updates.portion = scalePortion(item.portion, multiplier);
  }

  return updates;
}
