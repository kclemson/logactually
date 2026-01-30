export type EditableField = 'description' | 'calories' | 'protein' | 'carbs' | 'fat';

export interface FoodItem {
  uid: string;
  entryId?: string;  // tracks which entry this item belongs to
  description: string;  // Food name, e.g. "Cheese Pizza"
  portion?: string;  // Optional portion size, e.g. "1 slice" - rendered separately in smaller font
  calories: number;
  protein: number;
  carbs: number;
  fiber?: number;  // Dietary fiber (optional for backwards compat)
  net_carbs?: number;  // Calculated: carbs - fiber (optional for backwards compat)
  sugar?: number;  // Grams of sugar (optional for backwards compat)
  fat: number;
  saturated_fat?: number;  // Grams of saturated fat
  sodium?: number;  // Milligrams of sodium
  cholesterol?: number;  // Milligrams of cholesterol
  editedFields?: EditableField[];
  confidence?: 'high' | 'medium' | 'low';  // AI confidence level (experimental prompt only)
  source_note?: string;  // Optional note about data source/estimation
}

export interface FoodEntry {
  id: string;
  user_id: string;
  eaten_date: string;
  raw_input: string | null;
  food_items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
  updated_at: string;
  source_meal_id: string | null;  // Tracks if entry came from a saved meal
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugar: number;
  fat: number;
  saturated_fat: number;
  sodium: number;
  cholesterol: number;
}

export interface ScaledMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Scale macros proportionally when calories change.
 * Single source of truth for this calculation - used for both preview and save.
 */
export function scaleMacrosByCalories(
  originalCalories: number,
  originalProtein: number,
  originalCarbs: number,
  originalFat: number,
  newCalories: number
): ScaledMacros {
  // Edge case: can't scale from 0
  if (originalCalories === 0) {
    return {
      calories: newCalories,
      protein: originalProtein,
      carbs: originalCarbs,
      fat: originalFat,
    };
  }

  const ratio = newCalories / originalCalories;
  return {
    calories: newCalories,
    protein: Math.round(originalProtein * ratio),
    carbs: Math.round(originalCarbs * ratio),
    fat: Math.round(originalFat * ratio),
  };
}

export function calculateTotals(items: FoodItem[]): DailyTotals {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fiber: acc.fiber + (item.fiber || 0),
      sugar: acc.sugar + (item.sugar || 0),
      fat: acc.fat + (item.fat || 0),
      saturated_fat: acc.saturated_fat + (item.saturated_fat || 0),
      sodium: acc.sodium + (item.sodium || 0),
      cholesterol: acc.cholesterol + (item.cholesterol || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0, fat: 0, saturated_fat: 0, sodium: 0, cholesterol: 0 }
  );
}

export interface SavedMeal {
  id: string;
  user_id: string;
  name: string;
  original_input: string | null;
  food_items: FoodItem[];
  input_signature: string | null;
  items_signature: string | null;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}
