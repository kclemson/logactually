ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS sort_order integer;
ALTER TABLE public.weight_sets ADD COLUMN IF NOT EXISTS sort_order integer;
COMMENT ON COLUMN public.food_entries.sort_order IS 'User-chosen position within the day; null = append order by created_at';
COMMENT ON COLUMN public.weight_sets.sort_order IS 'User-chosen position within the day; shared by all rows of an entry_id; null = by created_at';