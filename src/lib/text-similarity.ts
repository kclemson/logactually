import { FoodItem } from '@/types/food';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'with', 'of', 'from', 'and', 'at', 'in', 'on', 'for',
  'to', 'my', 'some', 'like', 'about', 'around', 'i'
]);

// Words that trigger history patterns but aren't food-related
const HISTORY_REFERENCE_WORDS = new Set([
  // Time references
  'yesterday', 'yesterdays', 'today', 'monday', 'tuesday', 'wednesday', 
  'thursday', 'friday', 'saturday', 'sunday', 'earlier', 'recently', 
  'recent', 'before', 'last', 'week', 'night', 'morning', 'evening',
  'afternoon', 'time', 'day', 'days', 'ago', 'while',
  
  // Portion/repetition signals  
  'another', 'more', 'same', 'again', 'repeat', 'leftover', 'leftovers', 
  'remaining', 'finished', 'rest', 'half', 'other', 'those', 'that',
  'thing', 'one', 'ones',
  
  // Meal references
  'breakfast', 'lunch', 'dinner', 'brunch', 'meal', 'snack',
  
  // Food action verbs (never food items themselves)
  'had', 'have', 'ate', 'eaten', 'eating', 'eat', 
  'made', 'make', 'cooked', 'ordered', 'got', 'grabbed', 'picked',
]);

// Multi-word abbreviations (processed first, before punctuation removal)
const MULTI_WORD_ABBREVIATIONS: Record<string, string> = {
  'fl oz': 'fluid ounce',
  'fl. oz': 'fluid ounce',
  'fl. oz.': 'fluid ounce',
};

// Single-word abbreviations (processed with word boundaries)
const SINGLE_WORD_ABBREVIATIONS: Record<string, string> = {
  // Common shorthand
  'pb': 'peanut butter',
  'w/': 'with',
  'w': 'with',
  '&': 'and',
  
  // Volume measurements
  'tb': 'tablespoon',
  'tbsp': 'tablespoon',
  'tsp': 'teaspoon',
  'c': 'cup',
  'ml': 'milliliter',
  'l': 'liter',
  'ltr': 'liter',
  'pt': 'pint',
  'qt': 'quart',
  'gal': 'gallon',
  
  // Weight measurements
  'g': 'gram',
  'kg': 'kilogram',
  'mg': 'milligram',
  'oz': 'ounce',
  'lb': 'pound',
  'lbs': 'pounds',
  
  // Food-specific
  'choc': 'chocolate',
  'veg': 'vegetable',
  'veggies': 'vegetables',
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Preprocess text for signature generation.
 * Processing order:
 * 1. Multi-word abbreviations (before punctuation removal)
 * 2. Remove punctuation
 * 3. Single-word abbreviations (with word boundaries)
 * 4. Remove numbers (portions vary)
 * 5. Remove stop words
 * 6. Sort alphabetically
 */
export function preprocessText(text: string): string {
  let result = text.toLowerCase();
  
  // 1. Process multi-word abbreviations FIRST (before punctuation removal)
  for (const [abbr, full] of Object.entries(MULTI_WORD_ABBREVIATIONS)) {
    result = result.replace(new RegExp(escapeRegex(abbr), 'gi'), full);
  }
  
  // 2. Remove punctuation (except spaces)
  result = result.replace(/[^\w\s]/g, ' ');
  
  // 3. Process single-word abbreviations (with word boundaries)
  for (const [abbr, full] of Object.entries(SINGLE_WORD_ABBREVIATIONS)) {
    result = result.replace(new RegExp(`\\b${escapeRegex(abbr)}\\b`, 'gi'), full);
  }
  
  // 4. Remove numbers (portions vary between uses)
  result = result.replace(/\d+/g, '');
  
  // 5. Split, filter stop words, 6. sort alphabetically, rejoin
  const words = result.split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
  words.sort();
  return words.join(' ');
}

/**
 * Create a signature from food items' descriptions.
 * Used when saving meals to generate the items_signature for storage.
 */
export function createItemsSignature(items: FoodItem[]): string {
  const combined = items.map(item => item.description).join(' ');
  return preprocessText(combined);
}

/**
 * Calculate Jaccard similarity between two preprocessed strings.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
}


// =============================================================================
// Fuzzy Matching Utilities
// =============================================================================

/**
 * Check if two words match via substring containment.
 * - Exact match always succeeds
 * - Words shorter than 3 chars require exact match (too ambiguous otherwise)
 * - Otherwise checks if either word contains the other
 */
function isPrefixOf(query: string, target: string): boolean {
  if (query === target) return true;
  if (query.length < 3) return false;
  return target.startsWith(query);
}

/** Relaxed variant: allows 2-char prefixes (for the word currently being typed). */
function isPrefixOfRelaxed(query: string, target: string): boolean {
  if (query === target) return true;
  if (query.length < 2) return false;
  return target.startsWith(query);
}

function queryMatchesTargetSet(query: string, targetSet: Set<string>): boolean {
  for (const target of targetSet) {
    if (isPrefixOf(query, target)) return true;
  }
  return false;
}

function queryMatchesTargetSetRelaxed(query: string, targetSet: Set<string>): boolean {
  for (const target of targetSet) {
    if (isPrefixOfRelaxed(query, target)) return true;
  }
  return false;
}


/**
 * Extract candidate food words by removing known noise (history references, stop words).
 * Returns words that MIGHT be food-related - we can't verify they're actual foods,
 * but we've filtered out words we know AREN'T foods.
 * 
 * "another tilapia like from yesterday" → ["tilapia"]
 */
export function extractCandidateFoodWords(text: string): string[] {
  let result = text.toLowerCase();
  
  // Expand abbreviations (same processing as preprocessText)
  for (const [abbr, full] of Object.entries(MULTI_WORD_ABBREVIATIONS)) {
    result = result.replace(new RegExp(escapeRegex(abbr), 'gi'), full);
  }
  result = result.replace(/[^\w\s]/g, ' ');
  for (const [abbr, full] of Object.entries(SINGLE_WORD_ABBREVIATIONS)) {
    result = result.replace(new RegExp(`\\b${escapeRegex(abbr)}\\b`, 'gi'), full);
  }
  
  // Remove numbers
  result = result.replace(/\d+/g, '');
  
  // Filter stop words AND history reference words
  return result.split(/\s+/).filter(w => 
    w && !STOP_WORDS.has(w) && !HISTORY_REFERENCE_WORDS.has(w)
  );
}

/**
 * Calculate hybrid similarity score combining containment and Jaccard.
 * Containment is weighted higher (0.7) for threshold matching.
 * Jaccard (0.3) helps rank between multiple viable matches.
 */
export function hybridSimilarityScore(
  candidateFoodWords: string[], 
  targetText: string
): number {
  if (candidateFoodWords.length === 0) return 0;
  
  const targetWords = targetText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !STOP_WORDS.has(w));
  
  const inputSet = new Set(candidateFoodWords);
  const targetSet = new Set(targetWords);
  
  // Containment: what fraction of input words appear in target (fuzzy)
  // Last word uses relaxed matching (≥2 chars) since it's actively being typed;
  // all prior words use strict matching (≥3 chars).
  let matchedCount = 0;
  const lastIdx = candidateFoodWords.length - 1;
  for (let i = 0; i < candidateFoodWords.length; i++) {
    const word = candidateFoodWords[i];
    if (i === lastIdx
      ? queryMatchesTargetSetRelaxed(word, targetSet)
      : queryMatchesTargetSet(word, targetSet)) {
      matchedCount++;
    }
  }
  const containment = matchedCount / candidateFoodWords.length;
  
  // Every input word must match something in the target.
  // Prevents "sour crea" from matching "cream cheese" (only 1 of 2 words match).
  if (containment < 1.0) return 0;
  
  // Jaccard: intersection over union (fuzzy matching for ranking)
  let intersectionCount = 0;
  for (const word of inputSet) {
    if (queryMatchesTargetSet(word, targetSet)) intersectionCount++;
  }
  const unionSize = inputSet.size + targetSet.size - intersectionCount;
  const union = new Set([...inputSet, ...targetSet]);
  const jaccard = unionSize > 0 ? intersectionCount / unionSize : 0;
  
  // Weighted combination
  return (containment * 0.7) + (jaccard * 0.3);
}

