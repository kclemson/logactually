-- 1. Add is_read_only column to profiles
ALTER TABLE profiles 
ADD COLUMN is_read_only BOOLEAN NOT NULL DEFAULT false;

-- 2. Create helper function for RLS (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_read_only_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_read_only FROM profiles WHERE id = _user_id),
    false
  )
$$;

-- 3. Update RLS policies for food_entries (3 policies)
DROP POLICY IF EXISTS "Users can insert own food entries" ON food_entries;
CREATE POLICY "Users can insert own food entries" 
ON food_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

DROP POLICY IF EXISTS "Users can update own food entries" ON food_entries;
CREATE POLICY "Users can update own food entries" 
ON food_entries FOR UPDATE 
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own food entries" ON food_entries;
CREATE POLICY "Users can delete own food entries" 
ON food_entries FOR DELETE 
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

-- 4. Update RLS policies for weight_sets (3 policies)
DROP POLICY IF EXISTS "Users can insert own weight sets" ON weight_sets;
CREATE POLICY "Users can insert own weight sets" 
ON weight_sets FOR INSERT 
WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

DROP POLICY IF EXISTS "Users can update own weight sets" ON weight_sets;
CREATE POLICY "Users can update own weight sets" 
ON weight_sets FOR UPDATE 
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own weight sets" ON weight_sets;
CREATE POLICY "Users can delete own weight sets" 
ON weight_sets FOR DELETE 
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

-- 5. Update RLS policies for saved_meals (3 policies)
DROP POLICY IF EXISTS "Users can insert own saved meals" ON saved_meals;
CREATE POLICY "Users can insert own saved meals" 
ON saved_meals FOR INSERT 
WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

DROP POLICY IF EXISTS "Users can update own saved meals" ON saved_meals;
CREATE POLICY "Users can update own saved meals" 
ON saved_meals FOR UPDATE 
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own saved meals" ON saved_meals;
CREATE POLICY "Users can delete own saved meals" 
ON saved_meals FOR DELETE 
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

-- 6. Update RLS policies for saved_routines (3 policies)
DROP POLICY IF EXISTS "Users can insert own saved routines" ON saved_routines;
CREATE POLICY "Users can insert own saved routines" 
ON saved_routines FOR INSERT 
WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

DROP POLICY IF EXISTS "Users can update own saved routines" ON saved_routines;
CREATE POLICY "Users can update own saved routines" 
ON saved_routines FOR UPDATE 
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own saved routines" ON saved_routines;
CREATE POLICY "Users can delete own saved routines" 
ON saved_routines FOR DELETE 
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

-- 7. Update RLS policy for feedback (1 policy - INSERT only)
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
CREATE POLICY "Users can insert own feedback" 
ON feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

-- 8. Update get_user_stats function with include_read_only parameter
DROP FUNCTION IF EXISTS public.get_user_stats(text);
CREATE OR REPLACE FUNCTION public.get_user_stats(
  user_timezone text DEFAULT 'America/Los_Angeles',
  include_read_only boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  local_today date;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  local_today := (NOW() AT TIME ZONE user_timezone)::date;
  
  SELECT json_agg(row_to_json(t) ORDER BY t.user_number ASC)
  INTO result
  FROM (
    SELECT 
      p.id as user_id,
      p.user_number,
      p.is_read_only,
      COUNT(DISTINCT fe.id) as total_entries,
      COUNT(DISTINCT CASE WHEN fe.eaten_date = local_today THEN fe.id END) as entries_today,
      COUNT(DISTINCT ws.id) as total_weight_entries,
      COUNT(DISTINCT CASE WHEN ws.logged_date = local_today THEN ws.id END) as weight_today,
      COUNT(DISTINCT sm.id) as saved_meals_count,
      COUNT(DISTINCT sr.id) as saved_routines_count,
      GREATEST(MAX(fe.created_at), MAX(ws.created_at)) as last_active
    FROM profiles p
    LEFT JOIN food_entries fe ON p.id = fe.user_id
    LEFT JOIN weight_sets ws ON p.id = ws.user_id
    LEFT JOIN saved_meals sm ON p.id = sm.user_id
    LEFT JOIN saved_routines sr ON p.id = sr.user_id
    WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    GROUP BY p.id, p.user_number, p.is_read_only
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$;

-- 9. Update get_usage_stats function with include_read_only parameter
DROP FUNCTION IF EXISTS public.get_usage_stats(text);
CREATE OR REPLACE FUNCTION public.get_usage_stats(
  user_timezone text DEFAULT 'America/Los_Angeles',
  include_read_only boolean DEFAULT false
)
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
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  local_now := NOW() AT TIME ZONE user_timezone;
  local_today := local_now::date;
  
  SELECT json_build_object(
    'total_users', (
      SELECT COUNT(*) FROM profiles 
      WHERE include_read_only OR NOT COALESCE(is_read_only, false)
    ),
    'read_only_users', (SELECT COUNT(*) FROM profiles WHERE is_read_only = true),
    'users_with_entries', (
      SELECT COUNT(DISTINCT fe.user_id) FROM food_entries fe
      JOIN profiles p ON fe.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'total_entries', (
      SELECT COUNT(*) FROM food_entries fe
      JOIN profiles p ON fe.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'active_last_7_days', (
      SELECT COUNT(DISTINCT fe.user_id) 
      FROM food_entries fe
      JOIN profiles p ON fe.user_id = p.id
      WHERE (fe.created_at AT TIME ZONE user_timezone)::date > local_today - 7
        AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
    ),
    'users_created_last_7_days', (
      SELECT COUNT(*) FROM profiles 
      WHERE (created_at AT TIME ZONE user_timezone)::date > local_today - 7
        AND (include_read_only OR NOT COALESCE(is_read_only, false))
    ),
    'entries_created_last_7_days', (
      SELECT COUNT(*) FROM food_entries fe
      JOIN profiles p ON fe.user_id = p.id
      WHERE (fe.created_at AT TIME ZONE user_timezone)::date > local_today - 7
        AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
    ),
    'total_saved_meals', (
      SELECT COUNT(*) FROM saved_meals sm
      JOIN profiles p ON sm.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'users_with_saved_meals', (
      SELECT COUNT(DISTINCT sm.user_id) FROM saved_meals sm
      JOIN profiles p ON sm.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'avg_saved_meals_per_user', (
      SELECT COALESCE(
        ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT sm.user_id), 0), 1),
        0
      ) FROM saved_meals sm
      JOIN profiles p ON sm.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'saved_meals_used_last_7_days', (
      SELECT COUNT(*) FROM saved_meals sm
      JOIN profiles p ON sm.user_id = p.id
      WHERE sm.last_used_at IS NOT NULL 
        AND (sm.last_used_at AT TIME ZONE user_timezone)::date > local_today - 7
        AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
    ),
    'daily_stats', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.stat_date DESC), '[]'::json)
      FROM (
        SELECT 
          d.stat_date::text,
          COALESCE(e.entry_count, 0) as entry_count,
          COALESCE(w.weight_count, 0) as weight_count,
          (SELECT COUNT(*) FROM profiles 
           WHERE (created_at AT TIME ZONE user_timezone)::date <= d.stat_date
             AND (include_read_only OR NOT COALESCE(is_read_only, false))) as total_users,
          (SELECT COUNT(DISTINCT fe.user_id) FROM food_entries fe
           JOIN profiles p ON fe.user_id = p.id
           WHERE fe.eaten_date <= d.stat_date
             AND (include_read_only OR NOT COALESCE(p.is_read_only, false))) as users_with_entries,
          COALESCE(p.users_created, 0) as users_created
        FROM (
          SELECT generate_series(
            local_today - INTERVAL '13 days', 
            local_today, 
            '1 day'
          )::date as stat_date
        ) d
        LEFT JOIN (
          SELECT fe.eaten_date, COUNT(*) as entry_count
          FROM food_entries fe
          JOIN profiles p ON fe.user_id = p.id
          WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
          GROUP BY fe.eaten_date
        ) e ON d.stat_date = e.eaten_date
        LEFT JOIN (
          SELECT ws.logged_date, COUNT(*) as weight_count
          FROM weight_sets ws
          JOIN profiles p ON ws.user_id = p.id
          WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
          GROUP BY ws.logged_date
        ) w ON d.stat_date = w.logged_date
        LEFT JOIN (
          SELECT (created_at AT TIME ZONE user_timezone)::date as created_date, 
                 COUNT(*) as users_created
          FROM profiles
          WHERE include_read_only OR NOT COALESCE(is_read_only, false)
          GROUP BY (created_at AT TIME ZONE user_timezone)::date
        ) p ON d.stat_date = p.created_date
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$function$;