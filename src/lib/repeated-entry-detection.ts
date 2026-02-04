/**
 * Detection algorithms for repeated entries to suggest saving as meals/routines.
 * 
 * This module detects when users manually log similar items 2+ times,
 * and suggests creating a saved meal/routine for quick access.
 */

import { FoodItem, FoodEntry } from '@/types/food';
import { AnalyzedExercise } from '@/types/weight';
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
