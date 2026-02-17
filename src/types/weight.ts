/**
 * Weight tracking types for the normalized weight_sets schema
 */

export type WeightEditableField = 'description' | 'sets' | 'reps' | 'weight_lbs';

/**
 * Represents a single exercise set as displayed in the UI.
 * Maps to one row in the weight_sets table.
 */
export interface WeightSet {
  id: string;             // Database row ID
  uid: string;            // Client-side tracking for React keys
  entryId: string;        // Groups exercises logged together (maps to entry_id)
  exercise_key: string;   // Canonical identifier for trending: 'lat_pulldown', 'bench_press'
  exercise_subtype?: string | null; // Optional granularity: 'walking', 'running', 'hiking' within walk_run
  description: string;    // User-friendly name: "Lat Pulldown"
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_minutes?: number | null;  // For cardio exercises
  distance_miles?: number | null;    // For cardio (future)
  exercise_metadata?: Record<string, number> | null; // Optional metadata (incline, effort, calories_burned)
  rawInput?: string | null; // Only present on first set of entry
  sourceRoutineId?: string | null; // Links to saved_routines.id when entry originated from a routine
  groupName?: string | null; // Editable group name, stored on first set of entry
  createdAt?: string;     // Database created_at timestamp (optional for non-DB objects)
  editedFields?: WeightEditableField[];
}

/**
 * Represents a workout entry (group of exercises logged at once).
 * This is a UI concept - in the database, each WeightSet is its own row
 * linked by entry_id.
 */
export interface WeightEntry {
  entry_id: string;
  logged_date: string;
  raw_input: string | null;
  weight_sets: WeightSet[];
  created_at: string;
}

/**
 * Type for weight sets coming from the database before client-side processing
 */
export interface WeightSetRow {
  id: string;
  user_id: string;
  entry_id: string;
  logged_date: string;
  exercise_key: string;
  exercise_subtype: string | null;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_minutes: number | null;
  distance_miles: number | null;
  exercise_metadata: Record<string, number> | null;
  raw_input: string | null;
  source_routine_id: string | null;
  group_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Type for exercises returned by the analyze-weights edge function
 */
export interface AnalyzedExercise {
  exercise_key: string;
  exercise_subtype?: string | null;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_minutes?: number | null;
  distance_miles?: number | null;
  exercise_metadata?: Record<string, number> | null;
}

/**
 * Type for exercise sets stored in a saved routine (without client-side metadata)
 */
export interface SavedExerciseSet {
  exercise_key: string;
  exercise_subtype?: string | null;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_minutes?: number | null;
  distance_miles?: number | null;
  exercise_metadata?: Record<string, number> | null;
}

/**
 * Saved routine for quick logging of common workouts
 */
export interface SavedRoutine {
  id: string;
  user_id: string;
  name: string;
  original_input: string | null;
  exercise_sets: SavedExerciseSet[];
  use_count: number;
  last_used_at: string | null;
  is_auto_named: boolean;
  created_at: string;
  updated_at: string;
}
