 /**
  * Utility functions for generating and managing routine names.
  */
 
 import { SavedExerciseSet } from '@/types/weight';
 import { formatDurationMmSs } from '@/lib/weight-units';
 
 /**
  * Generate a routine name from the first exercise set.
  * 
  * Cardio: "Rowing Machine (15:30)" or "Running (2.5 mi)" or "Running (15:30, 2.5 mi)"
  * Weights: "Lat Pulldown (3x10 @ 65 lbs)"
  */
 export function generateRoutineName(exercise: SavedExerciseSet): string {
   const isCardio = exercise.weight_lbs === 0 && 
     ((exercise.duration_minutes ?? 0) > 0 || (exercise.distance_miles ?? 0) > 0);
   
   if (isCardio) {
     const duration = exercise.duration_minutes ?? 0;
     const distance = exercise.distance_miles ?? 0;
     if (duration > 0 && distance > 0) {
       return `${exercise.description} (${formatDurationMmSs(duration)}, ${distance.toFixed(1)} mi)`;
     } else if (distance > 0) {
       return `${exercise.description} (${distance.toFixed(1)} mi)`;
     } else {
       return `${exercise.description} (${formatDurationMmSs(duration)})`;
     }
   }
   
   return `${exercise.description} (${exercise.sets}x${exercise.reps} @ ${exercise.weight_lbs} lbs)`;
 }