// Canonical exercise reference list for consistent exercise_key mapping
// The AI should prefer these keys when the user's input matches,
// but can create new keys for exercises not covered here.
//
// SOURCES:
// - Primary: https://en.wikipedia.org/wiki/List_of_weight_training_exercises
// - Fallback: https://www.acefitness.org/resources/everyone/exercise-library/
//
// SYNC NOTE: Muscle group data is duplicated in src/lib/exercise-metadata.ts
// for frontend use. When adding/updating exercises, update BOTH files.

export interface CanonicalExercise {
  key: string;
  name: string;
  aliases: string[];
  primaryMuscle: string;
  secondaryMuscles?: string[];
  isCardio?: boolean;
}

export const CANONICAL_EXERCISES: CanonicalExercise[] = [
  // Upper Body - Push
  { key: 'bench_press', name: 'Bench Press', aliases: ['flat bench', 'barbell bench', 'chest press barbell'], primaryMuscle: 'Chest', secondaryMuscles: ['Triceps'] },
  { key: 'incline_bench_press', name: 'Incline Bench Press', aliases: ['incline bench', 'incline press'], primaryMuscle: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'] },
  { key: 'decline_bench_press', name: 'Decline Bench Press', aliases: ['decline bench'], primaryMuscle: 'Chest', secondaryMuscles: ['Triceps'] },
  { key: 'dumbbell_press', name: 'Dumbbell Press', aliases: ['db press', 'dumbbell bench'], primaryMuscle: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'] },
  { key: 'chest_fly', name: 'Chest Fly', aliases: ['pec fly', 'fly machine', 'cable fly', 'dumbbell fly'], primaryMuscle: 'Chest', secondaryMuscles: ['Shoulders'] },
  { key: 'shoulder_press', name: 'Shoulder Press', aliases: ['overhead press', 'OHP', 'military press'], primaryMuscle: 'Shoulders', secondaryMuscles: ['Triceps'] },
  { key: 'lateral_raise', name: 'Lateral Raise', aliases: ['side raise', 'shoulder raise', 'side lateral'], primaryMuscle: 'Shoulders' },
  { key: 'front_raise', name: 'Front Raise', aliases: ['front delt raise'], primaryMuscle: 'Shoulders' },
  { key: 'tricep_pushdown', name: 'Tricep Pushdown', aliases: ['cable pushdown', 'tricep cable', 'rope pushdown'], primaryMuscle: 'Triceps' },
  { key: 'tricep_extension', name: 'Tricep Extension', aliases: ['skull crusher', 'overhead tricep', 'french press'], primaryMuscle: 'Triceps' },
  { key: 'dips', name: 'Dips', aliases: ['tricep dips', 'chest dips', 'parallel bar dips'], primaryMuscle: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'] },
  
  // Upper Body - Pull
  { key: 'lat_pulldown', name: 'Lat Pulldown', aliases: ['pulldown', 'cable pulldown', 'pull down machine', 'wide grip pulldown'], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
  { key: 'pull_up', name: 'Pull Up', aliases: ['pullup', 'chin up', 'chinup', 'assisted pull up'], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
  { key: 'seated_row', name: 'Seated Row', aliases: ['cable row', 'row machine', 'low row', 'seated cable row'], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
  { key: 'bent_over_row', name: 'Bent Over Row', aliases: ['barbell row', 'bb row', 'pendlay row'], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
  { key: 'dumbbell_row', name: 'Dumbbell Row', aliases: ['db row', 'one arm row', 'single arm row'], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
  { key: 't_bar_row', name: 'T-Bar Row', aliases: ['t bar', 'landmine row'], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
  { key: 'face_pull', name: 'Face Pull', aliases: ['cable face pull', 'rear delt pull'], primaryMuscle: 'Shoulders', secondaryMuscles: ['Upper Back'] },
  { key: 'rear_delt_fly', name: 'Rear Delt Fly', aliases: ['reverse fly', 'rear delt', 'reverse pec deck'], primaryMuscle: 'Shoulders', secondaryMuscles: ['Upper Back'] },
  { key: 'bicep_curl', name: 'Bicep Curl', aliases: ['curls', 'arm curls', 'barbell curl', 'dumbbell curl', 'ez bar curl'], primaryMuscle: 'Biceps' },
  { key: 'hammer_curl', name: 'Hammer Curl', aliases: ['hammer curls', 'neutral grip curl'], primaryMuscle: 'Biceps', secondaryMuscles: ['Forearms'] },
  { key: 'preacher_curl', name: 'Preacher Curl', aliases: ['preacher bench curl', 'scott curl'], primaryMuscle: 'Biceps' },
  { key: 'cable_curl', name: 'Cable Curl', aliases: ['cable bicep curl'], primaryMuscle: 'Biceps' },
  { key: 'diverging_low_row', name: 'Diverging Low Row', aliases: ['diverging row', 'low row machine', 'plate loaded row'], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
  { key: 'shrugs', name: 'Shrugs', aliases: ['shoulder shrugs', 'trap shrugs', 'dumbbell shrugs', 'barbell shrugs'], primaryMuscle: 'Upper Back' },
  
  // Lower Body
  { key: 'squat', name: 'Squat', aliases: ['back squat', 'barbell squat', 'squats'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes', 'Hips', 'Abs'] },
  { key: 'front_squat', name: 'Front Squat', aliases: ['front squats'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes', 'Abs'] },
  { key: 'goblet_squat', name: 'Goblet Squat', aliases: ['goblet squats', 'dumbbell squat'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes', 'Abs'] },
  { key: 'leg_press', name: 'Leg Press', aliases: ['leg press machine', 'sled press', 'horizontal leg press', '45 degree leg press'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes', 'Hips'] },
  { key: 'hack_squat', name: 'Hack Squat', aliases: ['hack squat machine', 'reverse hack squat'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes'] },
  { key: 'leg_extension', name: 'Leg Extension', aliases: ['quad extension', 'leg ext', 'knee extension'], primaryMuscle: 'Quads' },
  { key: 'leg_curl', name: 'Leg Curl', aliases: ['hamstring curl', 'lying leg curl', 'seated leg curl', 'prone leg curl'], primaryMuscle: 'Hamstrings' },
  { key: 'romanian_deadlift', name: 'Romanian Deadlift', aliases: ['RDL', 'stiff leg deadlift', 'SLDL'], primaryMuscle: 'Hamstrings', secondaryMuscles: ['Glutes', 'Lower Back'] },
  { key: 'hip_thrust', name: 'Hip Thrust', aliases: ['glute bridge', 'barbell hip thrust', 'weighted glute bridge'], primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings'] },
  { key: 'calf_raise', name: 'Calf Raise', aliases: ['standing calf raise', 'calf machine', 'calf press'], primaryMuscle: 'Calves' },
  { key: 'seated_calf_raise', name: 'Seated Calf Raise', aliases: ['seated calf', 'bent knee calf raise'], primaryMuscle: 'Calves' },
  { key: 'lunge', name: 'Lunge', aliases: ['lunges', 'walking lunge', 'dumbbell lunge', 'barbell lunge'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes', 'Hips'] },
  { key: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', aliases: ['split squat', 'rear foot elevated', 'BSS'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes'] },
  { key: 'step_up', name: 'Step Up', aliases: ['step ups', 'box step up', 'weighted step up'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes'] },
  
  // Compound / Full Body
  { key: 'deadlift', name: 'Deadlift', aliases: ['conventional deadlift', 'barbell deadlift', 'dead lift'], primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Quads', 'Hips', 'Lower Back'] },
  { key: 'sumo_deadlift', name: 'Sumo Deadlift', aliases: ['sumo', 'wide stance deadlift'], primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Quads', 'Hips'] },
  { key: 'trap_bar_deadlift', name: 'Trap Bar Deadlift', aliases: ['hex bar deadlift', 'hex bar'], primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Quads', 'Lower Back'] },
  { key: 'clean', name: 'Clean', aliases: ['power clean', 'hang clean', 'clean and jerk'], primaryMuscle: 'Quads', secondaryMuscles: ['Hamstrings', 'Glutes', 'Shoulders', 'Upper Back'] },
  { key: 'snatch', name: 'Snatch', aliases: ['power snatch', 'hang snatch'], primaryMuscle: 'Quads', secondaryMuscles: ['Hamstrings', 'Glutes', 'Shoulders', 'Upper Back'] },
  { key: 'kettlebell_swing', name: 'Kettlebell Swing', aliases: ['kb swing', 'russian swing', 'american swing'], primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Abs', 'Lower Back'] },
  
  // Core
  { key: 'cable_crunch', name: 'Cable Crunch', aliases: ['kneeling cable crunch', 'rope crunch'], primaryMuscle: 'Abs' },
  { key: 'hanging_leg_raise', name: 'Hanging Leg Raise', aliases: ['leg raise', 'hanging knee raise', 'captain chair'], primaryMuscle: 'Abs', secondaryMuscles: ['Hips'] },
  { key: 'ab_wheel', name: 'Ab Wheel', aliases: ['ab roller', 'rollout', 'ab wheel rollout'], primaryMuscle: 'Abs' },
  { key: 'plank', name: 'Plank', aliases: ['planks', 'front plank'], primaryMuscle: 'Abs', secondaryMuscles: ['Shoulders', 'Glutes'] },
  { key: 'russian_twist', name: 'Russian Twist', aliases: ['russian twists', 'seated twist'], primaryMuscle: 'Abs' },
  { key: 'sit_up', name: 'Sit Up', aliases: ['sit ups', 'situp', 'situps'], primaryMuscle: 'Abs', secondaryMuscles: ['Hips'] },
  { key: 'crunch', name: 'Crunch', aliases: ['crunches', 'ab crunch'], primaryMuscle: 'Abs' },
  
  // Machines (common gym machines)
  { key: 'chest_press_machine', name: 'Chest Press Machine', aliases: ['machine chest press', 'seated chest press', 'hammer strength chest'], primaryMuscle: 'Chest', secondaryMuscles: ['Triceps'] },
  { key: 'shoulder_press_machine', name: 'Shoulder Press Machine', aliases: ['machine shoulder press', 'seated shoulder press machine'], primaryMuscle: 'Shoulders', secondaryMuscles: ['Triceps'] },
  { key: 'pec_deck', name: 'Pec Deck', aliases: ['pec fly machine', 'butterfly', 'butterfly machine'], primaryMuscle: 'Chest' },
  { key: 'cable_crossover', name: 'Cable Crossover', aliases: ['cable fly', 'high cable fly', 'low cable fly'], primaryMuscle: 'Chest' },
  { key: 'smith_machine_squat', name: 'Smith Machine Squat', aliases: ['smith squat', 'smith machine'], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes'] },
  { key: 'smith_machine_bench', name: 'Smith Machine Bench', aliases: ['smith bench', 'smith machine press'], primaryMuscle: 'Chest', secondaryMuscles: ['Triceps'] },
  { key: 'hip_abduction', name: 'Hip Abduction', aliases: ['abductor machine', 'outer thigh', 'hip abductor'], primaryMuscle: 'Hips' },
  { key: 'hip_adduction', name: 'Hip Adduction', aliases: ['adductor machine', 'inner thigh', 'hip adductor'], primaryMuscle: 'Hips' },
  { key: 'glute_kickback', name: 'Glute Kickback', aliases: ['cable kickback', 'glute machine', 'donkey kick machine'], primaryMuscle: 'Glutes' },
  { key: 'assisted_dip_machine', name: 'Assisted Dip Machine', aliases: ['dip assist', 'gravitron dips'], primaryMuscle: 'Chest', secondaryMuscles: ['Triceps'] },
  { key: 'assisted_pullup_machine', name: 'Assisted Pull-up Machine', aliases: ['pullup assist', 'gravitron'], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },

  // Cardio / Duration-Based
  { key: 'walk_run', name: 'Walk/Run', aliases: ['treadmill', 'treadmill walk', 'treadmill run', 'treadmill jog', 'walking', 'walk', 'running', 'run', 'jog', 'jogging', 'speedwalk', 'outdoor walk', 'outdoor run', 'incline walk'], primaryMuscle: 'Cardio', isCardio: true },
  { key: 'cycling', name: 'Cycling', aliases: ['bike', 'stationary bike', 'spin bike', 'spin class', 'exercise bike', 'recumbent bike', 'outdoor bike', 'bicycle'], primaryMuscle: 'Cardio', isCardio: true },
  { key: 'elliptical', name: 'Elliptical', aliases: ['elliptical machine', 'cross trainer'], primaryMuscle: 'Cardio', isCardio: true },
  { key: 'rowing', name: 'Rowing', aliases: ['rowing machine', 'row machine', 'erg', 'rower', 'concept 2', 'ergometer'], primaryMuscle: 'Cardio', isCardio: true },
  { key: 'stair_climber', name: 'Stair Climber', aliases: ['stairmaster', 'stair stepper', 'step machine'], primaryMuscle: 'Cardio', isCardio: true },
  { key: 'swimming', name: 'Swimming', aliases: ['swim', 'laps', 'pool'], primaryMuscle: 'Cardio', isCardio: true },
  { key: 'jump_rope', name: 'Jump Rope', aliases: ['skipping', 'skip rope'], primaryMuscle: 'Cardio', isCardio: true },
];

// Format the weight exercise list for prompt injection
export function getWeightExerciseReferenceForPrompt(): string {
  return CANONICAL_EXERCISES
    .filter(e => !e.isCardio)
    .map(e => {
      const aliasText = e.aliases.length > 0 ? e.aliases.join(', ') : 'no common aliases';
      const secondary = e.secondaryMuscles?.length 
        ? ` + ${e.secondaryMuscles.join(', ')}` 
        : '';
      return `  - ${e.key}: "${e.name}" [${e.primaryMuscle}${secondary}] (also: ${aliasText})`;
    })
    .join('\n');
}

// Format the cardio exercise list for prompt injection
export function getCardioExerciseReferenceForPrompt(): string {
  return CANONICAL_EXERCISES
    .filter(e => e.isCardio === true)
    .map(e => {
      const aliasText = e.aliases.length > 0 ? e.aliases.join(', ') : 'no common aliases';
      return `  - ${e.key}: "${e.name}" (also: ${aliasText})`;
    })
    .join('\n');
}

// Legacy function for backwards compatibility
export function getExerciseReferenceForPrompt(): string {
  return getWeightExerciseReferenceForPrompt();
}
