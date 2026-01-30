// Muscle group lookup for exercise charts on the Trends page
//
// SYNC NOTE: This duplicates data from supabase/functions/_shared/exercises.ts
// Edge functions (Deno) and frontend (Vite) run in separate build contexts,
// so we cannot share imports. When adding/updating exercises, update BOTH files.

export const EXERCISE_MUSCLE_GROUPS: Record<string, string> = {
  // Upper Body - Push
  bench_press: 'Chest',
  incline_bench_press: 'Chest',
  decline_bench_press: 'Chest',
  dumbbell_press: 'Chest',
  chest_fly: 'Chest',
  shoulder_press: 'Shoulders',
  lateral_raise: 'Shoulders',
  front_raise: 'Shoulders',
  tricep_pushdown: 'Triceps',
  tricep_extension: 'Triceps',
  dips: 'Chest',

  // Upper Body - Pull
  lat_pulldown: 'Back',
  pull_up: 'Back',
  seated_row: 'Back',
  bent_over_row: 'Back',
  dumbbell_row: 'Back',
  t_bar_row: 'Back',
  face_pull: 'Shoulders',
  rear_delt_fly: 'Shoulders',
  bicep_curl: 'Biceps',
  hammer_curl: 'Biceps',
  preacher_curl: 'Biceps',
  cable_curl: 'Biceps',
  diverging_low_row: 'Back',
  shrugs: 'Traps',

  // Lower Body
  squat: 'Quads',
  front_squat: 'Quads',
  goblet_squat: 'Quads',
  leg_press: 'Quads',
  hack_squat: 'Quads',
  leg_extension: 'Quads',
  leg_curl: 'Hamstrings',
  romanian_deadlift: 'Hamstrings',
  hip_thrust: 'Glutes',
  calf_raise: 'Calves',
  seated_calf_raise: 'Calves',
  lunge: 'Quads',
  bulgarian_split_squat: 'Quads',
  step_up: 'Quads',

  // Compound / Full Body
  deadlift: 'Full Body',
  sumo_deadlift: 'Full Body',
  trap_bar_deadlift: 'Full Body',
  clean: 'Full Body',
  snatch: 'Full Body',
  kettlebell_swing: 'Full Body',

  // Core
  cable_crunch: 'Core',
  hanging_leg_raise: 'Core',
  ab_wheel: 'Core',
  plank: 'Core',
  russian_twist: 'Core',
  sit_up: 'Core',
  crunch: 'Core',

  // Machines
  chest_press_machine: 'Chest',
  shoulder_press_machine: 'Shoulders',
  pec_deck: 'Chest',
  cable_crossover: 'Chest',
  smith_machine_squat: 'Quads',
  smith_machine_bench: 'Chest',
  hip_abduction: 'Hips',
  hip_adduction: 'Hips',
  glute_kickback: 'Glutes',
  assisted_dip_machine: 'Chest',
  assisted_pullup_machine: 'Back',
};

export function getMuscleGroup(exerciseKey: string): string | null {
  return EXERCISE_MUSCLE_GROUPS[exerciseKey] || null;
}
