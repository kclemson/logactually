-- 1. Add user_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_number INTEGER;

-- 2. Backfill existing users based on signup order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as num
  FROM public.profiles
)
UPDATE public.profiles p
SET user_number = n.num
FROM numbered n
WHERE p.id = n.id;

-- 3. Update the handle_new_user trigger to assign next number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(user_number), 0) + 1 INTO next_number FROM public.profiles;
  
  INSERT INTO public.profiles (id, user_number)
  VALUES (NEW.id, next_number);
  
  RETURN NEW;
END;
$function$;

-- 4. Add NOT NULL constraint after backfill
ALTER TABLE public.profiles 
ALTER COLUMN user_number SET NOT NULL;

-- 5. Add unique index for fast lookups
CREATE UNIQUE INDEX idx_profiles_user_number ON public.profiles(user_number);

-- 6. Update get_user_stats to return stored user_number
CREATE OR REPLACE FUNCTION public.get_user_stats(
  user_timezone text DEFAULT 'America/Los_Angeles'
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
  local_today := (NOW() AT TIME ZONE user_timezone)::date;
  
  SELECT json_agg(row_to_json(t) ORDER BY t.total_entries DESC)
  INTO result
  FROM (
    SELECT 
      p.id as user_id,
      p.user_number,
      COUNT(fe.id) as total_entries,
      COUNT(CASE WHEN fe.eaten_date = local_today THEN 1 END) as entries_today
    FROM profiles p
    LEFT JOIN food_entries fe ON p.id = fe.user_id
    GROUP BY p.id, p.user_number
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$;