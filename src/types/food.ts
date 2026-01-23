export type EditableField = 'description' | 'calories' | 'protein' | 'carbs' | 'fat';

export interface FoodItem {
  uid: string;
  description: string;  // Combined "Food Name (portion)" e.g. "Cheese Pizza (1 slice)"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  editedFields?: EditableField[];
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
