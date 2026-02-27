import { useState, useEffect, useRef, useMemo } from 'react';
import { extractCandidateFoodWords, hybridSimilarityScore } from '@/lib/text-similarity';

// =============================================================================
// Generic TypeaheadCandidate interface
// =============================================================================

export interface TypeaheadCandidate {
  /** Unique key for dedup (e.g. items signature hash) */
  id: string;
  /** Display text (e.g. "Egg McMuffin" or "Bench Press 4x8") */
  label: string;
  /** Text to match against (raw_input + item descriptions) */
  searchText: string;
  /** Secondary info (e.g. "320 cal" or "3 sets") */
  subtitle?: string;
  /** ISO date for recency ranking */
  timestamp: string;
  /** Pre-computed frequency (how many times this pattern was logged) */
  frequency?: number;
  /** Optional detail rendered inline after the label in smaller text (e.g. portion size) */
  labelDetail?: string;
  /** Opaque data passed back on selection */
  payload: unknown;
}

export interface TypeaheadMatch {
  candidate: TypeaheadCandidate;
  score: number;
}

// =============================================================================
// Scoring
// =============================================================================

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 5;
const MIN_SCORE = 0.25;

/**
 * Compute a composite score combining text similarity, recency, and frequency.
 * 
 * - similarity: 0–1 from hybridSimilarityScore (word containment + Jaccard)
 * - recency: exponential decay, half-life ~14 days
 * - frequency: logarithmic boost (diminishing returns past ~5 occurrences)
 */
function computeScore(
  similarity: number,
  timestamp: string,
  frequency: number,
): number {
  // Recency: exponential decay with ~14 day half-life
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recency = Math.exp(-ageDays / 20); // ~0.5 at 14 days

  // Frequency: log boost, capped so it doesn't dominate
  const freqBoost = 1 + Math.log2(Math.max(1, frequency)) * 0.15;

  return similarity * recency * freqBoost;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Generic typeahead suggestion hook.
 * 
 * Accepts raw text and a list of candidates, returns ranked matches.
 * Debounces internally (300ms). Filters at ≥ 3 chars.
 * Knows nothing about food or exercise — operates on TypeaheadCandidate.
 */
export function useTypeaheadSuggestions(
  text: string,
  candidates: TypeaheadCandidate[] | undefined,
): TypeaheadMatch[] {
  const [debouncedText, setDebouncedText] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce the input text
  useEffect(() => {
    if (text.trim().length < MIN_CHARS) {
      setDebouncedText('');
      return;
    }

    timerRef.current = setTimeout(() => {
      setDebouncedText(text.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [text]);

  // Compute matches from debounced text
  return useMemo(() => {
    if (!debouncedText || debouncedText.length < MIN_CHARS || !candidates?.length) {
      return [];
    }

    const inputWords = extractCandidateFoodWords(debouncedText);
    if (inputWords.length === 0) return [];

    const scored: TypeaheadMatch[] = [];

    for (const candidate of candidates) {
      const similarity = hybridSimilarityScore(inputWords, candidate.searchText);
      if (similarity < MIN_SCORE) continue;

      const score = computeScore(
        similarity,
        candidate.timestamp,
        candidate.frequency ?? 1,
      );

      scored.push({ candidate, score });
    }

    // Sort descending by score, take top N
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, MAX_RESULTS);
  }, [debouncedText, candidates]);
}
