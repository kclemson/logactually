export type EditableField = 'description' | 'calories' | 'protein' | 'carbs' | 'fat';

export interface FoodItem {
  uid: string;
  entryId?: string;  // tracks which entry this item belongs to
  description: string;  // Combined "Food Name (portion)" e.g. "Cheese Pizza (1 slice)"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
      fat: acc.fat + (item.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
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
