import { FoodItem, FoodEntry } from '@/types/food';

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
 * Calculate Levenshtein edit distance between two strings.
 * Returns the minimum number of single-character edits needed.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if two words are a fuzzy match.
 * - Exact match always succeeds
 * - Short words (≤5 chars): allow 1 edit
 * - Longer words: allow 2 edits
 */
function isFuzzyMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true;
  const minLen = Math.min(word1.length, word2.length);
  const maxDistance = minLen <= 5 ? 1 : 2;
  return levenshteinDistance(word1, word2) <= maxDistance;
}

/**
 * Check if a word fuzzy-matches any word in a set.
 */
function fuzzySetHas(word: string, targetSet: Set<string>): boolean {
  for (const target of targetSet) {
    if (isFuzzyMatch(word, target)) return true;
  }
  return false;
}

// =============================================================================
// Similar Entry Matching (for history reference detection)
// =============================================================================

export interface SimilarEntryMatch {
  entry: FoodEntry;
  score: number;
  matchType: 'input' | 'items';
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
  let matchedCount = 0;
  for (const word of candidateFoodWords) {
    if (fuzzySetHas(word, targetSet)) matchedCount++;
  }
  const containment = matchedCount / candidateFoodWords.length;
  
  // Jaccard: intersection over union (fuzzy matching for ranking)
  let intersectionCount = 0;
  for (const word of inputSet) {
    if (fuzzySetHas(word, targetSet)) intersectionCount++;
  }
  const unionSize = inputSet.size + targetSet.size - intersectionCount;
  const union = new Set([...inputSet, ...targetSet]);
  const jaccard = unionSize > 0 ? intersectionCount / unionSize : 0;
  
  // Weighted combination
  return (containment * 0.7) + (jaccard * 0.3);
}

/**
 * Helper: returns true if candidate should replace current best match.
 * When scores are within tolerance, prefer more recent entries.
 */
function isBetterMatch(
  candidateScore: number,
  candidateDate: string,
  bestScore: number,
  bestDate: string,
  tolerance = 0.05
): boolean {
  const scoreDiff = candidateScore - bestScore;
  
  // Clear winner by score
  if (scoreDiff > tolerance) return true;
  if (scoreDiff < -tolerance) return false;
  
  // Scores within tolerance → prefer more recent
  return new Date(candidateDate) > new Date(bestDate);
}

/**
 * Find the best matching past entry using hybrid similarity.
 * 
 * Uses word containment (70%) + Jaccard (30%) scoring:
 * - Containment ensures short inputs like "tilapia" match long descriptions
 * - Jaccard helps rank between multiple viable matches
 * 
 * When scores are within 0.05 tolerance, prefers more recent entries.
 * 
 * @param inputText - User's current input
 * @param recentEntries - Entries from the last N days
 * @param minSimilarityRequired - Minimum hybrid score to consider a match
 * @returns Best matching entry above threshold, or null
 */
export function findSimilarEntry(
  inputText: string,
  recentEntries: FoodEntry[],
  minSimilarityRequired: number
): SimilarEntryMatch | null {
  // Extract only candidate food words (strips "yesterday", "another", etc.)
  const candidateFoodWords = extractCandidateFoodWords(inputText);
  
  // If no candidate food words remain, can't match
  if (candidateFoodWords.length === 0) return null;
  
  let bestMatch: SimilarEntryMatch | null = null;
  
  for (const entry of recentEntries) {
    // Build combined description from all food items
    const itemsDescription = entry.food_items
      .map(item => item.description)
      .join(' ');
    
    // Calculate hybrid score against food items
    const itemsScore = hybridSimilarityScore(candidateFoodWords, itemsDescription);
    
    if (itemsScore >= minSimilarityRequired && 
        (!bestMatch || isBetterMatch(itemsScore, entry.eaten_date, bestMatch.score, bestMatch.entry.eaten_date))) {
      bestMatch = { entry, score: itemsScore, matchType: 'items' };
    }
    
    // Also check raw_input (skip scanned entries - their raw_input is just barcodes)
    if (entry.raw_input && !entry.raw_input.startsWith('Scanned:')) {
      const rawScore = hybridSimilarityScore(candidateFoodWords, entry.raw_input);
      if (rawScore >= minSimilarityRequired && 
          (!bestMatch || isBetterMatch(rawScore, entry.eaten_date, bestMatch.score, bestMatch.entry.eaten_date))) {
        bestMatch = { entry, score: rawScore, matchType: 'input' };
      }
    }
  }
  
  return bestMatch;
}
