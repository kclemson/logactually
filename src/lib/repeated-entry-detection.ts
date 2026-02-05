/**
 * Detection algorithms for repeated entries to suggest saving as meals/routines.
 * 
 * This module detects when users manually log similar items 2+ times,
 * and suggests creating a saved meal/routine for quick access.
 */

import { FoodItem, FoodEntry } from '@/types/food';
import { AnalyzedExercise, SavedRoutine } from '@/types/weight';
import { jaccardSimilarity, preprocessText } from './text-similarity';

// =============================================================================
// Types
// =============================================================================

export interface FoodSaveSuggestion {
  matchCount: number;
  signatureHash: string;
  items: FoodItem[];
}

export interface WeightSaveSuggestion {
  matchCount: number;
  signatureHash: string;
  exercises: AnalyzedExercise[];
}

export interface ExerciseDiff {
  index: number;       // Which exercise in the new list
  sets?: number;       // Delta: +1, -2, etc. (undefined if unchanged)
  reps?: number;
  weight_lbs?: number;
}

export interface MatchingRoutine {
  id: string;
  name: string;
  similarity: number;
  diffs: ExerciseDiff[];
  isAutoNamed: boolean;
}

export interface WeightEntryGrouped {
  entry_id: string;
  logged_date: string;
  exercise_keys: Set<string>;
  source_routine_id: string | null;
}

// =============================================================================
// LocalStorage Keys and Constants
// =============================================================================

const DISMISSED_KEY = 'save-suggestion-dismissed';
const DISMISS_COUNT_KEY = 'save-suggestion-dismiss-count';
const SHOW_OPT_OUT_THRESHOLD = 3;

// =============================================================================
// Dismissal Tracking
// =============================================================================

/**
 * Get the set of dismissed signature hashes from localStorage.
 */
function getDismissedSet(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Invalid JSON, reset
  }
  return new Set();
}

/**
 * Check if a pattern has been permanently dismissed.
 */
export function isDismissed(signatureHash: string): boolean {
  return getDismissedSet().has(signatureHash);
}

/**
 * Permanently dismiss a pattern and increment the dismissal count.
 */
export function dismissSuggestion(signatureHash: string): void {
  const dismissed = getDismissedSet();
  dismissed.add(signatureHash);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
  
  // Increment dismissal count
  const count = getDismissalCount();
  localStorage.setItem(DISMISS_COUNT_KEY, String(count + 1));
}

/**
 * Get the total number of times user has clicked "Not Now".
 */
export function getDismissalCount(): number {
  try {
    const stored = localStorage.getItem(DISMISS_COUNT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Check if the "Don't suggest saves" link should be shown.
 * Only appears after 3+ dismissals.
 */
export function shouldShowOptOutLink(): boolean {
  return getDismissalCount() >= SHOW_OPT_OUT_THRESHOLD;
}

// =============================================================================
// Signature Hashing
// =============================================================================

/**
 * Simple hash function for creating signature hashes.
 * Uses djb2 algorithm for reasonable distribution.
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create a hash from preprocessed text signature.
 */
export function hashSignature(signature: string): string {
  return hashString(signature);
}

/**
 * Create a hash from a set of exercise keys.
 */
export function hashExerciseKeys(keys: Set<string>): string {
  const sorted = [...keys].sort().join('|');
  return hashString(sorted);
}

// =============================================================================
// Food Detection Algorithm
// =============================================================================

/**
 * Detect if new food items match a pattern logged 2+ times before.
 * 
 * Requires BOTH:
 * 1. Text similarity ≥ 0.4 (Jaccard on descriptions)
 * 2. Macro similarity (calories within 40%)
 * 
 * Excludes entries that came from saved meals (source_meal_id set).
 */
export function detectRepeatedFoodEntry(
  newItems: FoodItem[],
  recentEntries: FoodEntry[],
  minMatches = 2
): FoodSaveSuggestion | null {
  if (newItems.length === 0 || recentEntries.length === 0) return null;
  
  // Build signature for new items
  const newDescription = newItems.map(i => i.description).join(' ');
  const newSignature = preprocessText(newDescription);
  const newCalories = newItems.reduce((sum, i) => sum + (i.calories || 0), 0);
  
  // Filter out entries from saved meals
  const manualEntries = recentEntries.filter(e => !e.source_meal_id);
  
  const matches = manualEntries.filter(entry => {
    const historyDesc = entry.food_items.map(i => i.description).join(' ');
    const historySignature = preprocessText(historyDesc);
    const historyCal = entry.total_calories;
    
    // 1. Text similarity check (Jaccard >= 0.4)
    const textSim = jaccardSimilarity(newSignature, historySignature);
    if (textSim < 0.4) return false;
    
    // 2. Macro similarity check (within 40%)
    const maxCal = Math.max(historyCal, 1);
    const calDiff = Math.abs(newCalories - historyCal) / maxCal;
    return calDiff <= 0.4;
  });
  
  if (matches.length >= minMatches) {
    return {
      matchCount: matches.length + 1, // +1 for the new entry
      signatureHash: hashSignature(newSignature),
      items: newItems,
    };
  }
  
  return null;
}

// =============================================================================
// Find Matching Saved Routine
// =============================================================================

/**
 * Find a saved routine that matches the newly analyzed exercises.
 * 
 * Returns the best matching routine (Jaccard similarity >= 0.7 on exercise keys)
 * along with computed diffs for sets/reps/weight_lbs.
 * 
 * If multiple routines match at the same similarity, picks most recently used.
 */
export function findMatchingSavedRoutine(
  newExercises: AnalyzedExercise[],
  savedRoutines: SavedRoutine[]
): MatchingRoutine | null {
  if (newExercises.length === 0 || savedRoutines.length === 0) return null;
  
  const newKeys = new Set(newExercises.map(e => e.exercise_key));
  
  let bestMatch: { routine: SavedRoutine; similarity: number } | null = null;
  
  for (const routine of savedRoutines) {
    const routineKeys = new Set(routine.exercise_sets.map(e => e.exercise_key));
    
    // Compute Jaccard similarity
    const intersection = [...newKeys].filter(k => routineKeys.has(k)).length;
    const union = new Set([...newKeys, ...routineKeys]).size;
    const similarity = union > 0 ? intersection / union : 0;
    
    if (similarity < 0.7) continue;
    
    // Compare: prefer higher similarity, then most recently used
    if (!bestMatch || similarity > bestMatch.similarity) {
      bestMatch = { routine, similarity };
    } else if (similarity === bestMatch.similarity) {
      // Tie-break by last_used_at (most recent wins)
      const currentLastUsed = routine.last_used_at 
        ? new Date(routine.last_used_at).getTime() 
        : 0;
      const bestLastUsed = bestMatch.routine.last_used_at 
        ? new Date(bestMatch.routine.last_used_at).getTime() 
        : 0;
      if (currentLastUsed > bestLastUsed) {
        bestMatch = { routine, similarity };
      }
    }
  }
  
  if (!bestMatch) return null;
  
  // Build a map of exercise_key -> saved exercise for quick lookup
  const savedExerciseMap = new Map(
    bestMatch.routine.exercise_sets.map(e => [e.exercise_key, e])
  );
  
  // Compute diffs for each new exercise
  const diffs: ExerciseDiff[] = [];
  
  newExercises.forEach((newExercise, index) => {
    const savedExercise = savedExerciseMap.get(newExercise.exercise_key);
    
    if (!savedExercise) {
      // Exercise is new (not in saved routine), no diff to show
      return;
    }
    
    const setsDiff = newExercise.sets - savedExercise.sets;
    const repsDiff = newExercise.reps - savedExercise.reps;
    const weightDiff = newExercise.weight_lbs - savedExercise.weight_lbs;
    
    // Only include if at least one value changed
    if (setsDiff !== 0 || repsDiff !== 0 || weightDiff !== 0) {
      diffs.push({
        index,
        sets: setsDiff !== 0 ? setsDiff : undefined,
        reps: repsDiff !== 0 ? repsDiff : undefined,
        weight_lbs: weightDiff !== 0 ? weightDiff : undefined,
      });
    }
  });
  
  return {
    id: bestMatch.routine.id,
    name: bestMatch.routine.name,
    similarity: bestMatch.similarity,
    diffs,
    isAutoNamed: bestMatch.routine.is_auto_named,
  };
}

// =============================================================================
// Weight Detection Algorithm
// =============================================================================

/**
 * Detect if new exercises match a pattern logged 2+ times before.
 * 
 * Matches on exercise_key set only (Jaccard ≥ 0.7), ignoring numeric values
 * (sets, reps, weight) to allow for natural progression.
 * 
 * Excludes entries that came from saved routines (source_routine_id set).
 */
export function detectRepeatedWeightEntry(
  newExercises: AnalyzedExercise[],
  recentEntries: WeightEntryGrouped[],
  minMatches = 2
): WeightSaveSuggestion | null {
  if (newExercises.length === 0 || recentEntries.length === 0) return null;
  
  const newKeys = new Set(newExercises.map(e => e.exercise_key));
  
  // Filter out entries from saved routines
  const manualEntries = recentEntries.filter(e => !e.source_routine_id);
  
  const matches = manualEntries.filter(entry => {
    const historyKeys = entry.exercise_keys;
    
    // Jaccard similarity on exercise key sets
    const intersection = [...newKeys].filter(k => historyKeys.has(k)).length;
    const union = new Set([...newKeys, ...historyKeys]).size;
    const similarity = union > 0 ? intersection / union : 0;
    
    return similarity >= 0.7;
  });
  
  if (matches.length >= minMatches) {
    return {
      matchCount: matches.length + 1,
      signatureHash: hashExerciseKeys(newKeys),
      exercises: newExercises,
    };
  }
  
  return null;
}
