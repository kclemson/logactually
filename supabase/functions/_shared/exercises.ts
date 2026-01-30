// Canonical exercise reference list for consistent exercise_key mapping
// The AI should prefer these keys when the user's input matches,
// but can create new keys for exercises not covered here.
//
// SYNC NOTE: Muscle group data is duplicated in src/lib/exercise-metadata.ts
// for frontend use. When adding/updating exercises, update BOTH files.

export interface CanonicalExercise {
  key: string;
  name: string;
  aliases: string[];
  muscleGroup: string;
}

export const CANONICAL_EXERCISES: CanonicalExercise[] = [
  // Upper Body - Push
  { key: 'bench_press', name: 'Bench Press', aliases: ['flat bench', 'barbell bench', 'chest press barbell'], muscleGroup: 'Chest' },
  { key: 'incline_bench_press', name: 'Incline Bench Press', aliases: ['incline bench', 'incline press'], muscleGroup: 'Chest' },
  { key: 'decline_bench_press', name: 'Decline Bench Press', aliases: ['decline bench'], muscleGroup: 'Chest' },
  { key: 'dumbbell_press', name: 'Dumbbell Press', aliases: ['db press', 'dumbbell bench'], muscleGroup: 'Chest' },
  { key: 'chest_fly', name: 'Chest Fly', aliases: ['pec fly', 'fly machine', 'cable fly', 'dumbbell fly'], muscleGroup: 'Chest' },
  { key: 'shoulder_press', name: 'Shoulder Press', aliases: ['overhead press', 'OHP', 'military press'], muscleGroup: 'Shoulders' },
  { key: 'lateral_raise', name: 'Lateral Raise', aliases: ['side raise', 'shoulder raise', 'side lateral'], muscleGroup: 'Shoulders' },
  { key: 'front_raise', name: 'Front Raise', aliases: ['front delt raise'], muscleGroup: 'Shoulders' },
  { key: 'tricep_pushdown', name: 'Tricep Pushdown', aliases: ['cable pushdown', 'tricep cable', 'rope pushdown'], muscleGroup: 'Triceps' },
  { key: 'tricep_extension', name: 'Tricep Extension', aliases: ['skull crusher', 'overhead tricep', 'french press'], muscleGroup: 'Triceps' },
  { key: 'dips', name: 'Dips', aliases: ['tricep dips', 'chest dips', 'parallel bar dips'], muscleGroup: 'Chest' },
  
  // Upper Body - Pull
  { key: 'lat_pulldown', name: 'Lat Pulldown', aliases: ['pulldown', 'cable pulldown', 'pull down machine', 'wide grip pulldown'], muscleGroup: 'Back' },
  { key: 'pull_up', name: 'Pull Up', aliases: ['pullup', 'chin up', 'chinup', 'assisted pull up'], muscleGroup: 'Back' },
  { key: 'seated_row', name: 'Seated Row', aliases: ['cable row', 'row machine', 'low row', 'seated cable row'], muscleGroup: 'Back' },
  { key: 'bent_over_row', name: 'Bent Over Row', aliases: ['barbell row', 'bb row', 'pendlay row'], muscleGroup: 'Back' },
  { key: 'dumbbell_row', name: 'Dumbbell Row', aliases: ['db row', 'one arm row', 'single arm row'], muscleGroup: 'Back' },
  { key: 't_bar_row', name: 'T-Bar Row', aliases: ['t bar', 'landmine row'], muscleGroup: 'Back' },
  { key: 'face_pull', name: 'Face Pull', aliases: ['cable face pull', 'rear delt pull'], muscleGroup: 'Shoulders' },
  { key: 'rear_delt_fly', name: 'Rear Delt Fly', aliases: ['reverse fly', 'rear delt', 'reverse pec deck'], muscleGroup: 'Shoulders' },
  { key: 'bicep_curl', name: 'Bicep Curl', aliases: ['curls', 'arm curls', 'barbell curl', 'dumbbell curl', 'ez bar curl'], muscleGroup: 'Biceps' },
  { key: 'hammer_curl', name: 'Hammer Curl', aliases: ['hammer curls', 'neutral grip curl'], muscleGroup: 'Biceps' },
  { key: 'preacher_curl', name: 'Preacher Curl', aliases: ['preacher bench curl', 'scott curl'], muscleGroup: 'Biceps' },
  { key: 'cable_curl', name: 'Cable Curl', aliases: ['cable bicep curl'], muscleGroup: 'Biceps' },
  { key: 'diverging_low_row', name: 'Diverging Low Row', aliases: ['diverging row', 'low row machine', 'plate loaded row'], muscleGroup: 'Back' },
  { key: 'shrugs', name: 'Shrugs', aliases: ['shoulder shrugs', 'trap shrugs', 'dumbbell shrugs', 'barbell shrugs'], muscleGroup: 'Traps' },
  
  // Lower Body
  { key: 'squat', name: 'Squat', aliases: ['back squat', 'barbell squat', 'squats'], muscleGroup: 'Quads' },
  { key: 'front_squat', name: 'Front Squat', aliases: ['front squats'], muscleGroup: 'Quads' },
  { key: 'goblet_squat', name: 'Goblet Squat', aliases: ['goblet squats', 'dumbbell squat'], muscleGroup: 'Quads' },
  { key: 'leg_press', name: 'Leg Press', aliases: ['leg press machine', 'sled press', 'horizontal leg press', '45 degree leg press'], muscleGroup: 'Quads' },
  { key: 'hack_squat', name: 'Hack Squat', aliases: ['hack squat machine', 'reverse hack squat'], muscleGroup: 'Quads' },
  { key: 'leg_extension', name: 'Leg Extension', aliases: ['quad extension', 'leg ext', 'knee extension'], muscleGroup: 'Quads' },
  { key: 'leg_curl', name: 'Leg Curl', aliases: ['hamstring curl', 'lying leg curl', 'seated leg curl', 'prone leg curl'], muscleGroup: 'Hamstrings' },
  { key: 'romanian_deadlift', name: 'Romanian Deadlift', aliases: ['RDL', 'stiff leg deadlift', 'SLDL'], muscleGroup: 'Hamstrings' },
  { key: 'hip_thrust', name: 'Hip Thrust', aliases: ['glute bridge', 'barbell hip thrust', 'weighted glute bridge'], muscleGroup: 'Glutes' },
  { key: 'calf_raise', name: 'Calf Raise', aliases: ['standing calf raise', 'calf machine', 'calf press'], muscleGroup: 'Calves' },
  { key: 'seated_calf_raise', name: 'Seated Calf Raise', aliases: ['seated calf', 'bent knee calf raise'], muscleGroup: 'Calves' },
  { key: 'lunge', name: 'Lunge', aliases: ['lunges', 'walking lunge', 'dumbbell lunge', 'barbell lunge'], muscleGroup: 'Quads' },
  { key: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', aliases: ['split squat', 'rear foot elevated', 'BSS'], muscleGroup: 'Quads' },
  { key: 'step_up', name: 'Step Up', aliases: ['step ups', 'box step up', 'weighted step up'], muscleGroup: 'Quads' },
  
  // Compound / Full Body
  { key: 'deadlift', name: 'Deadlift', aliases: ['conventional deadlift', 'barbell deadlift', 'dead lift'], muscleGroup: 'Full Body' },
  { key: 'sumo_deadlift', name: 'Sumo Deadlift', aliases: ['sumo', 'wide stance deadlift'], muscleGroup: 'Full Body' },
  { key: 'trap_bar_deadlift', name: 'Trap Bar Deadlift', aliases: ['hex bar deadlift', 'hex bar'], muscleGroup: 'Full Body' },
  { key: 'clean', name: 'Clean', aliases: ['power clean', 'hang clean', 'clean and jerk'], muscleGroup: 'Full Body' },
  { key: 'snatch', name: 'Snatch', aliases: ['power snatch', 'hang snatch'], muscleGroup: 'Full Body' },
  { key: 'kettlebell_swing', name: 'Kettlebell Swing', aliases: ['kb swing', 'russian swing', 'american swing'], muscleGroup: 'Full Body' },
  
  // Core
  { key: 'cable_crunch', name: 'Cable Crunch', aliases: ['kneeling cable crunch', 'rope crunch'], muscleGroup: 'Core' },
  { key: 'hanging_leg_raise', name: 'Hanging Leg Raise', aliases: ['leg raise', 'hanging knee raise', 'captain chair'], muscleGroup: 'Core' },
  { key: 'ab_wheel', name: 'Ab Wheel', aliases: ['ab roller', 'rollout', 'ab wheel rollout'], muscleGroup: 'Core' },
  { key: 'plank', name: 'Plank', aliases: ['planks', 'front plank'], muscleGroup: 'Core' },
  { key: 'russian_twist', name: 'Russian Twist', aliases: ['russian twists', 'seated twist'], muscleGroup: 'Core' },
  { key: 'sit_up', name: 'Sit Up', aliases: ['sit ups', 'situp', 'situps'], muscleGroup: 'Core' },
  { key: 'crunch', name: 'Crunch', aliases: ['crunches', 'ab crunch'], muscleGroup: 'Core' },
  
  // Machines (common gym machines)
  { key: 'chest_press_machine', name: 'Chest Press Machine', aliases: ['machine chest press', 'seated chest press', 'hammer strength chest'], muscleGroup: 'Chest' },
  { key: 'shoulder_press_machine', name: 'Shoulder Press Machine', aliases: ['machine shoulder press', 'seated shoulder press machine'], muscleGroup: 'Shoulders' },
  { key: 'pec_deck', name: 'Pec Deck', aliases: ['pec fly machine', 'butterfly', 'butterfly machine'], muscleGroup: 'Chest' },
  { key: 'cable_crossover', name: 'Cable Crossover', aliases: ['cable fly', 'high cable fly', 'low cable fly'], muscleGroup: 'Chest' },
  { key: 'smith_machine_squat', name: 'Smith Machine Squat', aliases: ['smith squat', 'smith machine'], muscleGroup: 'Quads' },
  { key: 'smith_machine_bench', name: 'Smith Machine Bench', aliases: ['smith bench', 'smith machine press'], muscleGroup: 'Chest' },
  { key: 'hip_abduction', name: 'Hip Abduction', aliases: ['abductor machine', 'outer thigh', 'hip abductor'], muscleGroup: 'Hips' },
  { key: 'hip_adduction', name: 'Hip Adduction', aliases: ['adductor machine', 'inner thigh', 'hip adductor'], muscleGroup: 'Hips' },
  { key: 'glute_kickback', name: 'Glute Kickback', aliases: ['cable kickback', 'glute machine', 'donkey kick machine'], muscleGroup: 'Glutes' },
  { key: 'assisted_dip_machine', name: 'Assisted Dip Machine', aliases: ['dip assist', 'gravitron dips'], muscleGroup: 'Chest' },
  { key: 'assisted_pullup_machine', name: 'Assisted Pull-up Machine', aliases: ['pullup assist', 'gravitron'], muscleGroup: 'Back' },
];

// Format the exercise list for prompt injection
export function getExerciseReferenceForPrompt(): string {
  return CANONICAL_EXERCISES
    .map(e => {
      const aliasText = e.aliases.length > 0 ? e.aliases.join(', ') : 'no common aliases';
      return `  - ${e.key}: "${e.name}" [${e.muscleGroup}] (also: ${aliasText})`;
    })
    .join('\n');
}
