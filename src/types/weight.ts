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
  description: string;    // User-friendly name: "Lat Pulldown"
  sets: number;
  reps: number;
  weight_lbs: number;
  rawInput?: string | null; // Only present on first set of entry
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
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  raw_input: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Type for exercises returned by the analyze-weights edge function
 */
export interface AnalyzedExercise {
  exercise_key: string;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
}
