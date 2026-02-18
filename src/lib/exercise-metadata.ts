// Muscle group lookup for exercise charts on the Trends page
//
// SOURCES:
// - Primary: https://en.wikipedia.org/wiki/List_of_weight_training_exercises
// - Fallback: https://www.acefitness.org/resources/everyone/exercise-library/
//
// SYNC NOTE: This duplicates data from supabase/functions/_shared/exercises.ts
// Edge functions (Deno) and frontend (Vite) run in separate build contexts,
// so we cannot share imports. When adding/updating exercises, update BOTH files.

export interface ExerciseMuscles {
  primary: string;
  secondary?: string[];
  isCardio?: boolean;
}

export const EXERCISE_MUSCLE_GROUPS: Record<string, ExerciseMuscles> = {
  // Upper Body - Push
  bench_press: { primary: 'Chest', secondary: ['Triceps'] },
  incline_bench_press: { primary: 'Chest', secondary: ['Triceps', 'Shoulders'] },
  decline_bench_press: { primary: 'Chest', secondary: ['Triceps'] },
  dumbbell_press: { primary: 'Chest', secondary: ['Triceps', 'Shoulders'] },
  chest_fly: { primary: 'Chest', secondary: ['Shoulders'] },
  shoulder_press: { primary: 'Shoulders', secondary: ['Triceps'] },
  lateral_raise: { primary: 'Shoulders' },
  front_raise: { primary: 'Shoulders' },
  tricep_pushdown: { primary: 'Triceps' },
  tricep_extension: { primary: 'Triceps' },
  dips: { primary: 'Chest', secondary: ['Triceps', 'Shoulders'] },

  // Upper Body - Pull
  lat_pulldown: { primary: 'Back', secondary: ['Biceps'] },
  pull_up: { primary: 'Back', secondary: ['Biceps'] },
  seated_row: { primary: 'Back', secondary: ['Biceps'] },
  bent_over_row: { primary: 'Back', secondary: ['Biceps'] },
  dumbbell_row: { primary: 'Back', secondary: ['Biceps'] },
  t_bar_row: { primary: 'Back', secondary: ['Biceps'] },
  face_pull: { primary: 'Shoulders', secondary: ['Upper Back'] },
  rear_delt_fly: { primary: 'Shoulders', secondary: ['Upper Back'] },
  bicep_curl: { primary: 'Biceps' },
  hammer_curl: { primary: 'Biceps', secondary: ['Forearms'] },
  preacher_curl: { primary: 'Biceps' },
  cable_curl: { primary: 'Biceps' },
  diverging_low_row: { primary: 'Back', secondary: ['Biceps'] },
  shrugs: { primary: 'Upper Back' },

  // Lower Body
  squat: { primary: 'Quads', secondary: ['Glutes', 'Hips', 'Abs'] },
  front_squat: { primary: 'Quads', secondary: ['Glutes', 'Abs'] },
  goblet_squat: { primary: 'Quads', secondary: ['Glutes', 'Abs'] },
  leg_press: { primary: 'Quads', secondary: ['Glutes', 'Hips'] },
  hack_squat: { primary: 'Quads', secondary: ['Glutes'] },
  leg_extension: { primary: 'Quads' },
  leg_curl: { primary: 'Hamstrings' },
  seated_leg_curl: { primary: 'Hamstrings' },
  romanian_deadlift: { primary: 'Hamstrings', secondary: ['Glutes', 'Lower Back'] },
  hip_thrust: { primary: 'Glutes', secondary: ['Hamstrings'] },
  calf_raise: { primary: 'Calves' },
  seated_calf_raise: { primary: 'Calves' },
  lunge: { primary: 'Quads', secondary: ['Glutes', 'Hips'] },
  bulgarian_split_squat: { primary: 'Quads', secondary: ['Glutes'] },
  step_up: { primary: 'Quads', secondary: ['Glutes'] },

  // Compound / Full Body
  deadlift: { primary: 'Glutes', secondary: ['Hamstrings', 'Quads', 'Hips', 'Lower Back'] },
  sumo_deadlift: { primary: 'Glutes', secondary: ['Hamstrings', 'Quads', 'Hips'] },
  trap_bar_deadlift: { primary: 'Glutes', secondary: ['Hamstrings', 'Quads', 'Lower Back'] },
  clean: { primary: 'Quads', secondary: ['Hamstrings', 'Glutes', 'Shoulders', 'Upper Back'] },
  snatch: { primary: 'Quads', secondary: ['Hamstrings', 'Glutes', 'Shoulders', 'Upper Back'] },
  kettlebell_swing: { primary: 'Glutes', secondary: ['Hamstrings', 'Abs', 'Lower Back'] },

  // Core
  cable_crunch: { primary: 'Abs' },
  hanging_leg_raise: { primary: 'Abs', secondary: ['Hips'] },
  ab_wheel: { primary: 'Abs' },
  plank: { primary: 'Abs', secondary: ['Shoulders', 'Glutes'] },
  russian_twist: { primary: 'Abs' },
  sit_up: { primary: 'Abs', secondary: ['Hips'] },
  crunch: { primary: 'Abs' },

  // Machines
  chest_press_machine: { primary: 'Chest', secondary: ['Triceps'] },
  shoulder_press_machine: { primary: 'Shoulders', secondary: ['Triceps'] },
  pec_deck: { primary: 'Chest' },
  cable_crossover: { primary: 'Chest' },
  smith_machine_squat: { primary: 'Quads', secondary: ['Glutes'] },
  smith_machine_bench: { primary: 'Chest', secondary: ['Triceps'] },
  hip_abduction: { primary: 'Hips' },
  hip_adduction: { primary: 'Hips' },
  glute_kickback: { primary: 'Glutes' },
  assisted_dip_machine: { primary: 'Chest', secondary: ['Triceps'] },
  assisted_pullup_machine: { primary: 'Back', secondary: ['Biceps'] },

  // Cardio / Duration-Based
  walk_run: { primary: 'Cardio', isCardio: true },
  cycling: { primary: 'Cardio', isCardio: true },
  elliptical: { primary: 'Cardio', isCardio: true },
  rowing: { primary: 'Cardio', isCardio: true },
  stair_climber: { primary: 'Cardio', isCardio: true },
  swimming: { primary: 'Cardio', isCardio: true },
  jump_rope: { primary: 'Cardio', isCardio: true },
  functional_strength: { primary: 'Full Body' },
};

// Human-friendly display names (sentence case, natural phrasing)
export const EXERCISE_DISPLAY_NAMES: Record<string, string> = {
  // Upper body – push
  bench_press: 'Bench press',
  incline_bench_press: 'Incline bench press',
  decline_bench_press: 'Decline bench press',
  dumbbell_press: 'Dumbbell press',
  chest_fly: 'Chest fly',
  shoulder_press: 'Shoulder press',
  lateral_raise: 'Lateral raise',
  front_raise: 'Front raise',
  tricep_pushdown: 'Tricep pushdown',
  tricep_extension: 'Tricep extension',
  dips: 'Dips',
  // Upper body – pull
  lat_pulldown: 'Lat pulldown',
  pull_up: 'Pull-up',
  seated_row: 'Seated row',
  bent_over_row: 'Bent-over row',
  dumbbell_row: 'Dumbbell row',
  t_bar_row: 'T-bar row',
  face_pull: 'Face pull',
  rear_delt_fly: 'Rear delt fly',
  bicep_curl: 'Bicep curl',
  hammer_curl: 'Hammer curl',
  preacher_curl: 'Preacher curl',
  cable_curl: 'Cable curl',
  diverging_low_row: 'Diverging low row',
  shrugs: 'Shrugs',
  // Lower body
  squat: 'Squat',
  front_squat: 'Front squat',
  goblet_squat: 'Goblet squat',
  leg_press: 'Leg press',
  hack_squat: 'Hack squat',
  leg_extension: 'Leg extension',
  leg_curl: 'Leg curl',
  seated_leg_curl: 'Seated leg curl',
  romanian_deadlift: 'Romanian deadlift',
  hip_thrust: 'Hip thrust',
  calf_raise: 'Calf raise',
  seated_calf_raise: 'Seated calf raise',
  lunge: 'Lunge',
  bulgarian_split_squat: 'Bulgarian split squat',
  step_up: 'Step-up',
  // Compound
  deadlift: 'Deadlift',
  sumo_deadlift: 'Sumo deadlift',
  trap_bar_deadlift: 'Trap bar deadlift',
  clean: 'Clean',
  snatch: 'Snatch',
  kettlebell_swing: 'Kettlebell swing',
  // Core
  cable_crunch: 'Cable crunch',
  hanging_leg_raise: 'Hanging leg raise',
  ab_wheel: 'Ab wheel',
  plank: 'Plank',
  russian_twist: 'Russian twist',
  sit_up: 'Sit-up',
  crunch: 'Crunch',
  // Machines
  chest_press_machine: 'Chest press (machine)',
  shoulder_press_machine: 'Shoulder press (machine)',
  pec_deck: 'Pec deck',
  cable_crossover: 'Cable crossover',
  smith_machine_squat: 'Squat (Smith machine)',
  smith_machine_bench: 'Bench press (Smith machine)',
  hip_abduction: 'Hip abduction',
  hip_adduction: 'Hip adduction',
  glute_kickback: 'Glute kickback',
  assisted_dip_machine: 'Assisted dips (machine)',
  assisted_pullup_machine: 'Assisted pull-up (machine)',
  // Cardio
  walk_run: 'Walk/run',
  cycling: 'Cycling',
  elliptical: 'Elliptical',
  rowing: 'Rowing',
  stair_climber: 'Stair climber',
  swimming: 'Swimming',
  jump_rope: 'Jump rope',
  // Other
  functional_strength: 'Functional strength',
};

// Ordered groups for dropdown rendering
export const EXERCISE_GROUPS: { label: string; keys: string[] }[] = [
  { label: 'Upper body – push', keys: ['bench_press', 'incline_bench_press', 'decline_bench_press', 'dumbbell_press', 'chest_fly', 'shoulder_press', 'lateral_raise', 'front_raise', 'tricep_pushdown', 'tricep_extension', 'dips'] },
  { label: 'Upper body – pull', keys: ['lat_pulldown', 'pull_up', 'seated_row', 'bent_over_row', 'dumbbell_row', 't_bar_row', 'face_pull', 'rear_delt_fly', 'bicep_curl', 'hammer_curl', 'preacher_curl', 'cable_curl', 'diverging_low_row', 'shrugs'] },
  { label: 'Lower body', keys: ['squat', 'front_squat', 'goblet_squat', 'leg_press', 'hack_squat', 'leg_extension', 'leg_curl', 'seated_leg_curl', 'romanian_deadlift', 'hip_thrust', 'calf_raise', 'seated_calf_raise', 'lunge', 'bulgarian_split_squat', 'step_up'] },
  { label: 'Compound', keys: ['deadlift', 'sumo_deadlift', 'trap_bar_deadlift', 'clean', 'snatch', 'kettlebell_swing'] },
  { label: 'Core', keys: ['cable_crunch', 'hanging_leg_raise', 'ab_wheel', 'plank', 'russian_twist', 'sit_up', 'crunch'] },
  { label: 'Machines', keys: ['chest_press_machine', 'shoulder_press_machine', 'pec_deck', 'cable_crossover', 'smith_machine_squat', 'smith_machine_bench', 'hip_abduction', 'hip_adduction', 'glute_kickback', 'assisted_dip_machine', 'assisted_pullup_machine'] },
  { label: 'Cardio', keys: ['walk_run', 'cycling', 'elliptical', 'rowing', 'stair_climber', 'swimming', 'jump_rope'] },
  { label: 'Other', keys: ['functional_strength'] },
];

// Helper to get display name with fallback
export function getExerciseDisplayName(key: string): string {
  return EXERCISE_DISPLAY_NAMES[key] || key.replace(/_/g, ' ');
}

// Subtype display names: maps exercise_subtype values to user-friendly labels
export const EXERCISE_SUBTYPE_DISPLAY: Record<string, string> = {
  walking: 'Walking',
  running: 'Running',
  hiking: 'Hiking',
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  pool: 'Pool',
  open_water: 'Open Water',
};

// Returns a user-friendly display name for a subtype, or null
export function getSubtypeDisplayName(subtype: string | null | undefined): string | null {
  if (!subtype) return null;
  return EXERCISE_SUBTYPE_DISPLAY[subtype] || subtype.charAt(0).toUpperCase() + subtype.slice(1);
}

// Check if an exercise is cardio-based
export function isCardioExercise(exerciseKey: string): boolean {
  return EXERCISE_MUSCLE_GROUPS[exerciseKey]?.isCardio === true;
}

// Returns formatted string for chart display: "Back, Biceps"
export function getMuscleGroupDisplay(exerciseKey: string): string | null {
  const muscles = EXERCISE_MUSCLE_GROUPS[exerciseKey];
  if (!muscles) return null;
  
  if (muscles.secondary?.length) {
    return `${muscles.primary}, ${muscles.secondary.join(', ')}`;
  }
  return muscles.primary;
}

// Returns truncated display with full text for tooltip
export function getMuscleGroupDisplayWithTooltip(exerciseKey: string): { display: string; full: string } | null {
  const muscles = EXERCISE_MUSCLE_GROUPS[exerciseKey];
  if (!muscles) return null;
  
  if (!muscles.secondary?.length) {
    return { display: muscles.primary, full: muscles.primary };
  }
  
  const full = `${muscles.primary}, ${muscles.secondary.join(', ')}`;
  
  // If 2 or fewer secondary muscles, no truncation needed
  if (muscles.secondary.length <= 2) {
    return { display: full, full };
  }
  
  // Truncate: show primary + 2 secondary + indicator
  const shownSecondary = muscles.secondary.slice(0, 2);
  const remainingCount = muscles.secondary.length - 2;
  const display = `${muscles.primary}, ${shownSecondary.join(', ')} +${remainingCount}`;
  
  return { display, full };
}

// Returns just primary muscle (backwards compatibility)
export function getMuscleGroup(exerciseKey: string): string | null {
  return EXERCISE_MUSCLE_GROUPS[exerciseKey]?.primary || null;
}

// Returns full muscle data object
export function getExerciseMuscles(exerciseKey: string): ExerciseMuscles | null {
  return EXERCISE_MUSCLE_GROUPS[exerciseKey] || null;
}

// Map a category selection to the correct exercise_key value for persistence
export function applyCategoryChange(
  newCategory: 'strength' | 'cardio' | 'other'
): { exercise_key: string } {
  return { exercise_key: newCategory === 'other' ? 'other' : '' };
}

// Check if an exercise tracks distance (mph toggle supported)
export function hasDistanceTracking(exerciseKey: string): boolean {
  return ['walk_run', 'cycling'].includes(exerciseKey);
}

// ============================================================================
// KNOWN METADATA KEYS REGISTRY
// Drives the DetailDialog UI for exercise metadata fields
// ============================================================================

export interface MetadataKeyConfig {
  key: string;
  label: string;
  unit: string;
  appliesTo: 'cardio' | 'strength' | 'both';
  min?: number;
  max?: number;
}

export const KNOWN_METADATA_KEYS: MetadataKeyConfig[] = [
  { key: 'effort', label: 'Effort', unit: '/10', appliesTo: 'both', min: 1, max: 10 },
  { key: 'calories_burned', label: 'Burned', unit: 'cal', appliesTo: 'both', min: 1 },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', appliesTo: 'both', min: 30, max: 250 },
  { key: 'incline_pct', label: 'Incline', unit: '%', appliesTo: 'cardio', min: 0, max: 30 },
  { key: 'cadence_rpm', label: 'Cadence', unit: 'rpm', appliesTo: 'cardio', min: 1 },
  { key: 'speed_mph', label: 'Speed', unit: 'mph', appliesTo: 'cardio', min: 0.1 },
];
