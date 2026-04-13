/**
 * Configurable macro display slots.
 *
 * Users can choose which 3 macros appear in the P/C/F columns throughout the UI.
 * Default is ['protein', 'carbs', 'fat'] — the classic trio.
 */

export type MacroKey =
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'fiber'
  | 'sugar'
  | 'net_carbs'
  | 'saturated_fat'
  | 'sodium'
  | 'cholesterol';

export interface MacroMeta {
  label: string;
  shortLabel: string;
  unit: string;
}

export const MACRO_META: Record<MacroKey, MacroMeta> = {
  protein:       { label: 'Protein',     shortLabel: 'P',  unit: 'g' },
  carbs:         { label: 'Carbs',       shortLabel: 'C',  unit: 'g' },
  fat:           { label: 'Fat',         shortLabel: 'F',  unit: 'g' },
  fiber:         { label: 'Fiber',       shortLabel: 'Fi', unit: 'g' },
  sugar:         { label: 'Sugar',       shortLabel: 'Su', unit: 'g' },
  net_carbs:     { label: 'Net Carbs',   shortLabel: 'NC', unit: 'g' },
  saturated_fat: { label: 'Sat. Fat',    shortLabel: 'SF', unit: 'g' },
  sodium:        { label: 'Sodium',      shortLabel: 'Na', unit: 'mg' },
  cholesterol:   { label: 'Cholesterol', shortLabel: 'Ch', unit: 'mg' },
};

export type DisplayMacros = [MacroKey, MacroKey, MacroKey];

export const DEFAULT_DISPLAY_MACROS: DisplayMacros = ['protein', 'carbs', 'fat'];

/**
 * Extract a macro value from any object with macro-named keys.
 * Handles the derived `net_carbs` = carbs - fiber calculation.
 */
export function getMacroValue(item: Record<string, any>, key: MacroKey): number {
  if (key === 'net_carbs') {
    return Number(item.carbs || 0) - Number(item.fiber || 0);
  }
  return Number(item[key] || 0);
}

/**
 * Check whether the display macros are the standard protein/carbs/fat trio.
 * Used to decide whether calorie-composition percentages make sense.
 */
export function isStandardMacros(macros: DisplayMacros): boolean {
  return macros[0] === 'protein' && macros[1] === 'carbs' && macros[2] === 'fat';
}
