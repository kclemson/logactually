-- Add source_meal_id column to track entries created from saved meals
ALTER TABLE public.food_entries
ADD COLUMN source_meal_id UUID REFERENCES public.saved_meals(id) ON DELETE SET NULL;