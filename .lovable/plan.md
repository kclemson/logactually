

## Pre-Match Past Entries Before AI Analysis

### Overview

Enable users to reference past food entries using natural language (e.g., "the other half of the omelet from Sunday", "same thing I had yesterday", "more of what I ate in January"). When detected, we match against recent history **before** calling the AI—saving an API call and ensuring exact values from the user's own logs.

---

### Complete User Flow

```text
+-----------------------------------------------------------------------------+
| USER TYPES: "the other half of the green chili pork omelet from Sunday"    |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| FoodLog.tsx: handleSubmit(text)                                             |
|                                                                             |
| 1. Call detectHistoryReference(text)                                        |
|    --> Returns { hasReference: true, confidence: 'high', ... }              |
+-----------------------------------------------------------------------------+
                                      |
                       hasReference === true?
                                      |
                    +-----------------+------------------+
                    | YES                                | NO
                    v                                    |
+-------------------------------------------+           |
| 2. Search recentEntries (90 days)         |           |
|                                           |           |
| minSimilarityRequired =                   |           |
|   high confidence:   0.35                 |           |
|   medium confidence: 0.45                 |           |
|   low confidence:    0.55                 |           |
|                                           |           |
| match = findSimilarEntry(                 |           |
|   text, recentEntries, minSimilarity      |           |
| )                                         |           |
+-------------------------------------------+           |
                    |                                   |
              match !== null?                           |
                    |                                   |
      +-------------+-------------+                     |
      | YES                       | NO                  |
      v                           v                     v
+---------------------+   +-----------------------------------------------+
| 3. Show prompt      |   | 4. Call AI: analyzeFood(text)                 |
| SimilarEntryPrompt  |   |    --> Returns { food_items, totals }         |
|                     |   |                                               |
| [Use Past Entry]    |   | 5. Check for similar SAVED MEALS (existing)   |
| [Dismiss]           |   |    --> If match -> show SimilarMealPrompt     |
+---------------------+   |                                               |
      |                   | 6. No matches -> createEntryFromItems()       |
      |                   +-----------------------------------------------+
      |                             ^                   ^
      |                             |                   |
      +-- User clicks "Use Past Entry"                  |
      |   --> createEntryFromItems(match.entry.food_items, text)
      |       --> Entry saved with exact historical values
      |                                                 |
      +-- User clicks "Dismiss" ------------------------+
          --> Proceed to step 4 (AI analysis)
```

**Key clarification**: If `hasReference` is true but `findSimilarEntry` returns `null` (no entry met the similarity threshold), the system falls through to Step 4 (AI analysis). The user typed something that *looks* like a history reference, but we couldn't find a matching entry—so we let the AI handle it.

---

### Threshold Logic Explained

The relationship between pattern confidence and similarity threshold:

| Pattern Confidence | What it means | Similarity Required | Why |
|--------------------|---------------|---------------------|-----|
| **High** | User clearly wants history ("yesterday", "other half") | 0.35 (lenient) | Pattern provides strong evidence; less text overlap needed |
| **Medium** | Likely wants history ("the other day", "same thing") | 0.45 (moderate) | Some ambiguity; need decent text match |
| **Low** | Might want history ("from breakfast") | 0.55 (strict) | Weak signal; need strong text match to act |

---

### Data Size Analysis: 90 Days Is Feasible

| Metric | Value |
|--------|-------|
| Average food_items size per entry | ~474 bytes |
| Average raw_input size per entry | ~36 bytes |
| Average items per entry | ~1.5 |
| Estimated metadata overhead | ~100 bytes |

**Worst case scenario** (very active user):
- 10 entries/day x 90 days = 900 entries
- 900 x 610 bytes = **~550 KB**

This is well within acceptable limits for a single cached query.

---

### Localizable Pattern Strings

All pattern strings stored in a centralized, easily-localizable structure:

```typescript
// src/lib/history-patterns.ts

/**
 * Localizable string constants for history reference detection.
 * Structure supports future i18n by replacing with translation keys.
 */
export const HISTORY_PATTERN_STRINGS = {
  // Days of the week (used in regex alternation)
  daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  
  // Month names (used in regex alternation)  
  months: ['january', 'february', 'march', 'april', 'may', 'june', 
           'july', 'august', 'september', 'october', 'november', 'december'],
  
  // Month abbreviations (used in regex alternation)
  monthAbbreviations: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                       'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
  
  // Explicit time references
  explicit: {
    yesterday: 'yesterday',
    yesterdays: "yesterday's",
    today: 'today',
    dayBefore: 'day before yesterday',
  },
  
  // Prepositions that precede time references
  prepositions: {
    from: 'from',
    on: 'on',
    back: 'back in',
    during: 'during',
    in: 'in',
  },
  
  // Portion/continuation keywords
  portion: {
    otherHalf: 'other half',
    restOf: 'rest of',
    leftover: 'leftover',
    leftovers: 'leftovers',
    remaining: 'remaining',
    finished: 'finished',
    moreOf: 'more of',
  },
  
  // Vague time references
  vague: {
    otherDay: 'the other day',
    earlier: 'earlier',
    recently: 'recently',
    recent: 'recent',
    lastTime: 'last time',
    lastWeek: 'last week',
    fewDaysAgo: 'few days ago',
    coupleDaysAgo: 'couple days ago',
    aWhileAgo: 'a while ago',
    before: 'before',
  },
  
  // Repetition signals
  repetition: {
    same: 'same',
    sameThing: 'same thing',
    sameAs: 'same as',
    again: 'again',
    another: 'another',
    repeat: 'repeat',
  },
  
  // Meal time references
  mealTime: {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    brunch: 'brunch',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
    lastNight: 'last night',
  },
} as const;
```

---

### Pattern Building with Detailed Comments

```typescript
/**
 * Build regex patterns from localizable strings.
 * Each pattern includes examples of what it matches.
 */
function buildPatterns(strings: typeof HISTORY_PATTERN_STRINGS) {
  const days = strings.daysOfWeek.join('|');
  const months = strings.months.join('|');
  const monthAbbr = strings.monthAbbreviations.join('|');
  const meals = [strings.mealTime.breakfast, strings.mealTime.lunch, 
                 strings.mealTime.dinner, strings.mealTime.brunch].join('|');
  
  return {
    // =========================================================================
    // HIGH CONFIDENCE - Explicit date references
    // These patterns strongly indicate user wants a specific past entry
    // =========================================================================
    
    /**
     * Day of week references
     * Examples: "from Monday", "on Tuesday", "Wednesday", "last Friday"
     */
    dayOfWeek: new RegExp(
      `\\b(${strings.prepositions.from}|${strings.prepositions.on})?\\s*(${days})\\b`, 
      'i'
    ),
    
    /**
     * Yesterday references
     * Examples: "yesterday", "yesterday's lunch", "yesterdays breakfast"
     */
    yesterday: new RegExp(
      `\\b(${strings.explicit.yesterday}|${strings.explicit.yesterdays})\\b`, 
      'i'
    ),
    
    /**
     * Month + day references
     * Examples: "Feb 1", "January 15th", "Dec 25", "March 3rd"
     */
    monthDay: new RegExp(
      `\\b(${monthAbbr})\\w*\\s+\\d{1,2}(st|nd|rd|th)?\\b`, 
      'i'
    ),
    
    /**
     * Numeric date references
     * Examples: "from 2/1", "on 1/15", "from 12/25"
     */
    numericDate: new RegExp(
      `\\b(${strings.prepositions.from}|${strings.prepositions.on})\\s*\\d{1,2}\\/\\d{1,2}\\b`, 
      'i'
    ),
    
    /**
     * Day before yesterday
     * Examples: "day before yesterday", "the day before yesterday"
     */
    dayBefore: new RegExp(
      `\\b${strings.explicit.dayBefore}\\b`, 
      'i'
    ),
    
    // =========================================================================
    // HIGH CONFIDENCE - Portion/continuation references
    // These imply user already logged part of this food
    // =========================================================================
    
    /**
     * Other half references
     * Examples: "other half", "the other half of", "other half of the pizza"
     */
    otherHalf: new RegExp(
      `\\b${strings.portion.otherHalf}\\b`, 
      'i'
    ),
    
    /**
     * Rest of references
     * Examples: "rest of the pizza", "rest of my sandwich", "the rest of"
     */
    restOf: new RegExp(
      `\\b${strings.portion.restOf}\\b`, 
      'i'
    ),
    
    /**
     * Leftover references
     * Examples: "leftover pasta", "leftovers from dinner", "the leftovers"
     */
    leftover: new RegExp(
      `\\b(${strings.portion.leftover}|${strings.portion.leftovers})\\b`, 
      'i'
    ),
    
    /**
     * Remaining portion references
     * Examples: "remaining pizza", "the remaining portion"
     */
    remaining: new RegExp(
      `\\b${strings.portion.remaining}\\b`, 
      'i'
    ),
    
    /**
     * Finished references
     * Examples: "finished the pizza", "finished off the pasta", "finished it"
     */
    finished: new RegExp(
      `\\b${strings.portion.finished}\\b`, 
      'i'
    ),
    
    // =========================================================================
    // MEDIUM CONFIDENCE - Vague time references
    // Less specific but still likely referring to history
    // =========================================================================
    
    /**
     * "The other day" references
     * Examples: "the other day", "that thing from the other day"
     */
    otherDay: new RegExp(
      `\\b${strings.vague.otherDay}\\b`, 
      'i'
    ),
    
    /**
     * Earlier references
     * Examples: "earlier", "what I had earlier", "from earlier"
     */
    earlier: new RegExp(
      `\\b${strings.vague.earlier}\\b`, 
      'i'
    ),
    
    /**
     * Recently references
     * Examples: "recently", "recent meal", "something I had recently"
     */
    recently: new RegExp(
      `\\b(${strings.vague.recently}|${strings.vague.recent})\\b`, 
      'i'
    ),
    
    /**
     * Last time references
     * Examples: "last time I had", "like last time", "same as last time"
     */
    lastTime: new RegExp(
      `\\b${strings.vague.lastTime}\\b`, 
      'i'
    ),
    
    /**
     * Last week references
     * Examples: "last week", "from last week", "what I ate last week"
     */
    lastWeek: new RegExp(
      `\\b${strings.vague.lastWeek}\\b`, 
      'i'
    ),
    
    /**
     * Few/couple days ago references
     * Examples: "a few days ago", "few days ago", "couple days ago"
     */
    fewDaysAgo: new RegExp(
      `\\b(a\\s+)?(${strings.vague.fewDaysAgo}|${strings.vague.coupleDaysAgo})\\b`, 
      'i'
    ),
    
    /**
     * A while ago references
     * Examples: "a while ago", "from a while ago"
     */
    aWhileAgo: new RegExp(
      `\\b${strings.vague.aWhileAgo}\\b`, 
      'i'
    ),
    
    /**
     * Had/ate before references
     * Examples: "what I had before", "ate before", "from before"
     */
    hadBefore: new RegExp(
      `\\b(had|ate|from)\\s+${strings.vague.before}\\b`, 
      'i'
    ),
    
    // =========================================================================
    // MEDIUM CONFIDENCE - Month references
    // User referring to a time period - enables full 90-day search
    // =========================================================================
    
    /**
     * In/during month references
     * Examples: "in January", "back in December", "during February"
     */
    inMonth: new RegExp(
      `\\b(${strings.prepositions.in}|${strings.prepositions.back}|${strings.prepositions.during})\\s+(${months})\\b`, 
      'i'
    ),
    
    /**
     * "A lot of in [month]" references
     * Examples: "ate a lot of in January", "had lots of in December"
     */
    lotOfIn: new RegExp(
      `\\b(a lot|lots)\\s+(of\\s+)?in\\s+(${months})\\b`, 
      'i'
    ),
    
    // =========================================================================
    // MEDIUM CONFIDENCE - Repetition signals
    // User wants to repeat a previous entry
    // =========================================================================
    
    /**
     * Same thing references
     * Examples: "same thing", "same as yesterday", "the same", "same one"
     */
    sameThing: new RegExp(
      `\\b(${strings.repetition.sameThing}|${strings.repetition.sameAs}|the\\s+${strings.repetition.same})\\b`, 
      'i'
    ),
    
    /**
     * Again references
     * Examples: "that again", "it again", "having that again"
     */
    again: new RegExp(
      `\\b(that|it)\\s+${strings.repetition.again}\\b`, 
      'i'
    ),
    
    /**
     * Another references
     * Examples: "another one of those", "another of the", "another one"
     */
    another: new RegExp(
      `\\b${strings.repetition.another}\\s+(one|of)\\b`, 
      'i'
    ),
    
    /**
     * Repeat references
     * Examples: "repeat yesterday", "repeat that meal", "repeat"
     */
    repeat: new RegExp(
      `\\b${strings.repetition.repeat}\\b`, 
      'i'
    ),
    
    /**
     * More of references
     * Examples: "more of the pasta", "more of that", "more of those tacos"
     */
    moreOf: new RegExp(
      `\\b${strings.portion.moreOf}\\s+(the|that|those)\\b`, 
      'i'
    ),
    
    // =========================================================================
    // LOW CONFIDENCE - Meal time references
    // Could be describing when they ate something new, or referencing history
    // Requires higher similarity match to act
    // =========================================================================
    
    /**
     * From meal references
     * Examples: "from breakfast", "from lunch", "from dinner", "from brunch"
     */
    fromMeal: new RegExp(
      `\\b${strings.prepositions.from}\\s+(${meals})\\b`, 
      'i'
    ),
    
    /**
     * This morning references
     * Examples: "this morning", "this morning's coffee", "from this morning"
     */
    thisMorning: new RegExp(
      `\\bthis\\s+${strings.mealTime.morning}\\b`, 
      'i'
    ),
    
    /**
     * Earlier today references
     * Examples: "earlier today", "from earlier today"
     */
    earlierToday: new RegExp(
      `\\b${strings.vague.earlier}\\s+${strings.explicit.today}\\b`, 
      'i'
    ),
    
    /**
     * Last night references
     * Examples: "last night", "from last night", "last night's dinner"
     */
    lastNight: new RegExp(
      `\\b(${strings.mealTime.lastNight}|${strings.prepositions.from}\\s+last\\s+${strings.mealTime.night})\\b`, 
      'i'
    ),
  };
}
```

---

### Detection Function

```typescript
export type PatternConfidence = 'high' | 'medium' | 'low';

export interface HistoryReferenceResult {
  hasReference: boolean;
  confidence: PatternConfidence;
  matchedPatterns: string[];  // For debugging/logging
}

/**
 * Minimum similarity required based on pattern confidence.
 * 
 * High confidence patterns (like "yesterday", "other half") provide strong
 * evidence the user wants history, so we can be lenient with text matching.
 * 
 * Low confidence patterns (like "from breakfast") are ambiguous, so we
 * require higher text similarity to act on them.
 */
export const MIN_SIMILARITY_REQUIRED: Record<PatternConfidence, number> = {
  high: 0.35,   // Pattern is strong evidence -> lenient text matching
  medium: 0.45, // Pattern is moderate evidence -> moderate text matching
  low: 0.55,    // Pattern is weak evidence -> strict text matching
};

export function detectHistoryReference(text: string): HistoryReferenceResult {
  const patterns = buildPatterns(HISTORY_PATTERN_STRINGS);
  const matched: string[] = [];
  
  // Check high confidence patterns first
  const highConfidencePatterns = [
    'dayOfWeek', 'yesterday', 'monthDay', 'numericDate', 'dayBefore',
    'otherHalf', 'restOf', 'leftover', 'remaining', 'finished'
  ];
  
  for (const name of highConfidencePatterns) {
    if (patterns[name].test(text)) {
      matched.push(name);
    }
  }
  if (matched.length > 0) {
    return { hasReference: true, confidence: 'high', matchedPatterns: matched };
  }
  
  // Check medium confidence patterns
  const mediumConfidencePatterns = [
    'otherDay', 'earlier', 'recently', 'lastTime', 'lastWeek', 'fewDaysAgo',
    'aWhileAgo', 'hadBefore', 'inMonth', 'lotOfIn',
    'sameThing', 'again', 'another', 'repeat', 'moreOf'
  ];
  
  for (const name of mediumConfidencePatterns) {
    if (patterns[name].test(text)) {
      matched.push(name);
    }
  }
  if (matched.length > 0) {
    return { hasReference: true, confidence: 'medium', matchedPatterns: matched };
  }
  
  // Check low confidence patterns
  const lowConfidencePatterns = ['fromMeal', 'thisMorning', 'earlierToday', 'lastNight'];
  
  for (const name of lowConfidencePatterns) {
    if (patterns[name].test(text)) {
      matched.push(name);
    }
  }
  if (matched.length > 0) {
    return { hasReference: true, confidence: 'low', matchedPatterns: matched };
  }
  
  return { hasReference: false, confidence: 'low', matchedPatterns: [] };
}
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/history-patterns.ts` | Localizable strings, pattern building, `detectHistoryReference()` |
| `src/hooks/useRecentFoodEntries.ts` | Fetch 90 days of entries (cached) |
| `src/components/SimilarEntryPrompt.tsx` | UI for past entry matches |

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/text-similarity.ts` | Add `SimilarEntryMatch` type and `findSimilarEntry()` |
| `src/pages/FoodLog.tsx` | Integrate history check BEFORE AI call |

---

### New Hook: useRecentFoodEntries

```typescript
// src/hooks/useRecentFoodEntries.ts
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FoodEntry, FoodItem } from '@/types/food';

export function useRecentFoodEntries(daysBack = 90) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recent-food-entries', user?.id, daysBack],
    queryFn: async () => {
      const cutoffDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('food_entries')
        .select('id, eaten_date, raw_input, food_items, total_calories, total_protein, total_carbs, total_fat')
        .gte('eaten_date', cutoffDate)
        .order('eaten_date', { ascending: false });
      
      if (error) throw error;
      
      // Parse food_items and ensure UIDs
      return (data || []).map((entry) => {
        const rawItems = Array.isArray(entry.food_items) 
          ? (entry.food_items as unknown as any[]) 
          : [];
        const itemsWithIds: FoodItem[] = rawItems.map((item) => ({
          description: item.description || item.name || '',
          portion: item.portion,
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fat: item.fat || 0,
          uid: item.uid || crypto.randomUUID(),
          entryId: entry.id,
        }));
        return { ...entry, food_items: itemsWithIds } as FoodEntry;
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
```

---

### Entry Matching Function

```typescript
// Addition to src/lib/text-similarity.ts

import { FoodEntry } from '@/types/food';

export interface SimilarEntryMatch {
  entry: FoodEntry;
  score: number;
  matchType: 'input' | 'items';
}

/**
 * Find the best matching past entry using text similarity.
 * 
 * @param inputText - User's current input
 * @param recentEntries - Entries from the last N days
 * @param minSimilarityRequired - Minimum Jaccard similarity score to consider a match
 * @returns Best matching entry above threshold, or null
 */
export function findSimilarEntry(
  inputText: string,
  recentEntries: FoodEntry[],
  minSimilarityRequired: number
): SimilarEntryMatch | null {
  const inputSig = preprocessText(inputText);
  let bestMatch: SimilarEntryMatch | null = null;
  
  for (const entry of recentEntries) {
    // Compare against raw_input (what user originally typed)
    if (entry.raw_input) {
      const entrySig = preprocessText(entry.raw_input);
      const score = jaccardSimilarity(inputSig, entrySig);
      if (score >= minSimilarityRequired && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { entry, score, matchType: 'input' };
      }
    }
    
    // Compare against food item descriptions
    const entryItemsSig = createItemsSignature(entry.food_items);
    const itemsScore = jaccardSimilarity(inputSig, entryItemsSig);
    if (itemsScore >= minSimilarityRequired && (!bestMatch || itemsScore > bestMatch.score)) {
      bestMatch = { entry, score: itemsScore, matchType: 'items' };
    }
  }
  
  return bestMatch;
}
```

---

### Updated FoodLog Submit Flow

```typescript
// In FoodLog.tsx

import { detectHistoryReference, MIN_SIMILARITY_REQUIRED } from '@/lib/history-patterns';
import { findSimilarEntry } from '@/lib/text-similarity';
import { useRecentFoodEntries } from '@/hooks/useRecentFoodEntries';

// Fetch 90 days of history (cached)
const { data: recentEntries } = useRecentFoodEntries(90);

const handleSubmit = async (text: string) => {
  // 1. Check for history reference patterns BEFORE AI call
  const historyRef = detectHistoryReference(text);
  
  if (historyRef.hasReference && recentEntries?.length) {
    const minSimilarity = MIN_SIMILARITY_REQUIRED[historyRef.confidence];
    
    const match = findSimilarEntry(text, recentEntries, minSimilarity);
    if (match) {
      // Found a match above threshold - show prompt
      setPendingEntryMatch({ match, originalInput: text });
      return; // Don't call AI - show prompt instead
    }
    // No match found above threshold - fall through to AI
  }
  
  // 2. No entry match (or no history reference) - call AI
  const result = await analyzeFood(text);
  if (!result) return;
  
  // 3. Demo mode handling (existing)
  if (isReadOnly) { ... }
  
  // 4. Check for similar saved meals (existing)
  if (savedMeals?.length > 0) { ... }
  
  // 5. No matches - create entry with AI result
  createEntryFromItems(result.food_items, text);
};
```

---

### SimilarEntryPrompt Component

Based on `SimilarMealPrompt`, adapted for entries:

```typescript
// src/components/SimilarEntryPrompt.tsx
interface SimilarEntryPromptProps {
  match: SimilarEntryMatch;
  onUsePastEntry: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}
```

Display format:
```text
+--------------------------------------------------------------+
|                                                           [X] |
| Looks like your entry from Sun, Feb 1 (82% match)            |
|                                                               |
|   Green Chile Pork Omelet (0.5 omelet)     910   61/13/69    |
|   Total                                    910   61/13/69    |
|                                                               |
|   [ Use Past Entry ]  [ Dismiss ]                             |
+--------------------------------------------------------------+
```

---

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| History reference detected, but no match meets threshold | Fall through to AI analysis |
| "Other half" of entry that was already "half" | Show match - user confirms if values are right |
| Multiple entries match the input | Return highest-scoring match |
| Month reference ("in January") | Full 90-day search |
| User dismisses entry prompt | Trigger AI analysis as fallback |
| Entry from earlier same day | Included in search |
| Read-only (demo) user | Skip history check, proceed to AI + demo preview |

---

### Summary

1. **Well-commented regex patterns** - Each pattern has JSDoc with examples of what it matches
2. **Localizable strings** - All keywords centralized in `HISTORY_PATTERN_STRINGS`
3. **Clear threshold naming** - `MIN_SIMILARITY_REQUIRED` with explicit documentation
4. **90-day history** - ~550KB max payload, enables month references
5. **Check history BEFORE AI** - Faster, more accurate, saves API costs
6. **Graceful fallback** - No match or dismissed prompt -> AI analysis

