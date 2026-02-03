import { FoodItem, FoodEntry, SavedMeal } from '@/types/food';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'with', 'of', 'from', 'and', 'at', 'in', 'on', 'for',
  'to', 'my', 'some', 'like', 'about', 'around'
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

export interface SimilarMealMatch {
  meal: SavedMeal;
  score: number;
  matchType: 'input' | 'items';
}

/**
 * Find the best matching saved meal using dual-comparison:
 * - Compare input text against saved meal's input_signature
 * - Compare items signature against saved meal's items_signature
 * Returns the best match above threshold, or null if none found.
 */
export function findSimilarMeals(
  inputText: string,
  itemsSignature: string,
  savedMeals: SavedMeal[],
  threshold = 0.6
): SimilarMealMatch | null {
  const inputSig = preprocessText(inputText);
  let bestMatch: SimilarMealMatch | null = null;
  
  for (const meal of savedMeals) {
    // Compare against input signature
    if (meal.input_signature) {
      const inputScore = jaccardSimilarity(inputSig, meal.input_signature);
      if (inputScore >= threshold && (!bestMatch || inputScore > bestMatch.score)) {
        bestMatch = { meal, score: inputScore, matchType: 'input' };
      }
    }
    
    // Compare against items signature
    if (meal.items_signature) {
      const itemsScore = jaccardSimilarity(itemsSignature, meal.items_signature);
      if (itemsScore >= threshold && (!bestMatch || itemsScore > bestMatch.score)) {
        bestMatch = { meal, score: itemsScore, matchType: 'items' };
      }
    }
  }
  
  return bestMatch;
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
  
  // Containment: what fraction of input words appear in target
  let matchedCount = 0;
  for (const word of candidateFoodWords) {
    if (targetSet.has(word)) matchedCount++;
  }
  const containment = matchedCount / candidateFoodWords.length;
  
  // Jaccard: intersection over union (for ranking)
  const intersection = new Set([...inputSet].filter(x => targetSet.has(x)));
  const union = new Set([...inputSet, ...targetSet]);
  const jaccard = union.size > 0 ? intersection.size / union.size : 0;
  
  // Weighted combination
  return (containment * 0.7) + (jaccard * 0.3);
}

/**
 * Find the best matching past entry using hybrid similarity.
 * 
 * Uses word containment (70%) + Jaccard (30%) scoring:
 * - Containment ensures short inputs like "tilapia" match long descriptions
 * - Jaccard helps rank between multiple viable matches
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
    
    if (itemsScore >= minSimilarityRequired && (!bestMatch || itemsScore > bestMatch.score)) {
      bestMatch = { entry, score: itemsScore, matchType: 'items' };
    }
    
    // Also check raw_input (skip scanned entries - their raw_input is just barcodes)
    if (entry.raw_input && !entry.raw_input.startsWith('Scanned:')) {
      const rawScore = hybridSimilarityScore(candidateFoodWords, entry.raw_input);
      if (rawScore >= minSimilarityRequired && (!bestMatch || rawScore > bestMatch.score)) {
        bestMatch = { entry, score: rawScore, matchType: 'input' };
      }
    }
  }
  
  return bestMatch;
}
