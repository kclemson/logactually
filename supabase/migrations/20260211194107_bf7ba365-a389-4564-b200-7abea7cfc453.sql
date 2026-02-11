CREATE OR REPLACE FUNCTION public.get_top_exercises(p_user_id uuid, p_cardio_keys text[], p_limit_per_group integer DEFAULT 2)
 RETURNS TABLE(exercise_key text, exercise_subtype text, sets integer, reps integer, weight_lbs numeric, duration_minutes numeric, distance_miles numeric, exercise_metadata jsonb, description text, is_cardio boolean, frequency bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  (
    SELECT ws.exercise_key, ws.exercise_subtype, ws.sets, ws.reps,
           ws.weight_lbs, ws.duration_minutes, ws.distance_miles,
           ws.exercise_metadata, ws.description,
           true as is_cardio, sub.cnt as frequency
    FROM (
      SELECT exercise_key, exercise_subtype, COUNT(*) as cnt
      FROM weight_sets WHERE user_id = p_user_id
        AND exercise_key = ANY(p_cardio_keys)
      GROUP BY exercise_key, exercise_subtype
      ORDER BY cnt DESC
      LIMIT p_limit_per_group
    ) sub
    JOIN LATERAL (
      SELECT * FROM weight_sets
      WHERE user_id = p_user_id
        AND exercise_key = sub.exercise_key
        AND (exercise_subtype IS NOT DISTINCT FROM sub.exercise_subtype)
      ORDER BY created_at DESC LIMIT 1
    ) ws ON true
  )
  UNION ALL
  (
    SELECT ws.exercise_key, ws.exercise_subtype, ws.sets, ws.reps,
           ws.weight_lbs, ws.duration_minutes, ws.distance_miles,
           ws.exercise_metadata, ws.description,
           false as is_cardio, sub.cnt as frequency
    FROM (
      SELECT exercise_key, exercise_subtype, COUNT(*) as cnt
      FROM weight_sets WHERE user_id = p_user_id
        AND NOT (exercise_key = ANY(p_cardio_keys))
      GROUP BY exercise_key, exercise_subtype
      ORDER BY cnt DESC
      LIMIT p_limit_per_group
    ) sub
    JOIN LATERAL (
      SELECT * FROM weight_sets
      WHERE user_id = p_user_id
        AND exercise_key = sub.exercise_key
        AND (exercise_subtype IS NOT DISTINCT FROM sub.exercise_subtype)
      ORDER BY created_at DESC LIMIT 1
    ) ws ON true
  )
$$;