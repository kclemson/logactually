-- Create saved_meals table
CREATE TABLE public.saved_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  original_input TEXT,
  food_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  input_signature TEXT,
  items_signature TEXT,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_saved_meals_user_id ON public.saved_meals(user_id);

-- Enable RLS
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own saved meals"
  ON public.saved_meals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved meals"
  ON public.saved_meals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved meals"
  ON public.saved_meals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved meals"
  ON public.saved_meals FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_meals_updated_at
  BEFORE UPDATE ON public.saved_meals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update get_usage_stats function to include saved meals metrics
CREATE OR REPLACE FUNCTION public.get_usage_stats(user_timezone text DEFAULT 'America/Los_Angeles'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  local_now timestamp;
  local_today date;
BEGIN
  local_now := NOW() AT TIME ZONE user_timezone;
  local_today := local_now::date;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'users_with_entries', (SELECT COUNT(DISTINCT user_id) FROM food_entries),
    'total_entries', (SELECT COUNT(*) FROM food_entries),
    'active_last_7_days', (
      SELECT COUNT(DISTINCT user_id) 
      FROM food_entries 
      WHERE (created_at AT TIME ZONE user_timezone)::date > local_today - 7
    ),
    'users_created_last_7_days', (
      SELECT COUNT(*) FROM profiles 
      WHERE (created_at AT TIME ZONE user_timezone)::date > local_today - 7
    ),
    'entries_created_last_7_days', (
      SELECT COUNT(*) FROM food_entries 
      WHERE (created_at AT TIME ZONE user_timezone)::date > local_today - 7
    ),
    'total_saved_meals', (SELECT COUNT(*) FROM saved_meals),
    'users_with_saved_meals', (SELECT COUNT(DISTINCT user_id) FROM saved_meals),
    'avg_saved_meals_per_user', (
      SELECT COALESCE(
        ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_id), 0), 1),
        0
      ) FROM saved_meals
    ),
    'saved_meals_used_last_7_days', (
      SELECT COUNT(*) FROM saved_meals 
      WHERE last_used_at IS NOT NULL 
        AND (last_used_at AT TIME ZONE user_timezone)::date > local_today - 7
    ),
    'daily_stats', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.stat_date DESC), '[]'::json)
      FROM (
        SELECT 
          d.stat_date::text,
          COALESCE(e.entry_count, 0) as entry_count,
          (SELECT COUNT(*) FROM profiles 
           WHERE (created_at AT TIME ZONE user_timezone)::date <= d.stat_date) as total_users,
          (SELECT COUNT(DISTINCT user_id) FROM food_entries 
           WHERE eaten_date <= d.stat_date) as users_with_entries,
          COALESCE(p.users_created, 0) as users_created
        FROM (
          SELECT generate_series(
            local_today - INTERVAL '13 days', 
            local_today, 
            '1 day'
          )::date as stat_date
        ) d
        LEFT JOIN (
          SELECT eaten_date, COUNT(*) as entry_count
          FROM food_entries
          GROUP BY eaten_date
        ) e ON d.stat_date = e.eaten_date
        LEFT JOIN (
          SELECT (created_at AT TIME ZONE user_timezone)::date as created_date, 
                 COUNT(*) as users_created
          FROM profiles
          GROUP BY (created_at AT TIME ZONE user_timezone)::date
        ) p ON d.stat_date = p.created_date
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$function$;