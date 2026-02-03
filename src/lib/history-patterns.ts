/**
 * History Reference Detection for Food Entries
 * 
 * Detects when users reference past food entries using natural language patterns.
 * Enables matching against recent history BEFORE calling the AI for analysis.
 */

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

/**
 * Build regex patterns from localizable strings.
 * Each pattern includes JSDoc examples of what it matches.
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

/**
 * Detect if user input contains references to past food entries.
 * Returns confidence level and which patterns matched.
 */
export function detectHistoryReference(text: string): HistoryReferenceResult {
  const patterns = buildPatterns(HISTORY_PATTERN_STRINGS);
  const matched: string[] = [];
  
  // Check high confidence patterns first
  const highConfidencePatterns = [
    'dayOfWeek', 'yesterday', 'monthDay', 'numericDate', 'dayBefore',
    'otherHalf', 'restOf', 'leftover', 'remaining', 'finished'
  ] as const;
  
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
  ] as const;
  
  for (const name of mediumConfidencePatterns) {
    if (patterns[name].test(text)) {
      matched.push(name);
    }
  }
  if (matched.length > 0) {
    return { hasReference: true, confidence: 'medium', matchedPatterns: matched };
  }
  
  // Check low confidence patterns
  const lowConfidencePatterns = ['fromMeal', 'thisMorning', 'earlierToday', 'lastNight'] as const;
  
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
