import type { FoodItem } from '@/types/food';

export interface TypeaheadSourceEntry {
  eaten_date: string;
  raw_input: string | null;
  food_items: FoodItem[];
  total_calories: number;
  source_meal_id?: string | null;
  group_name?: string | null;
}

export interface TypeaheadSourceMeal {
  id: string;
  name: string;
  original_input?: string | null;
  food_items: FoodItem[];
  last_used_at?: string | null;
  created_at?: string | null;
  use_count?: number | null;
}

export interface FoodCandidate {
  id: string;
  label: string;
  searchText: string;
  subtitle: string;
  timestamp: string;
  frequency: number;
  items: FoodItem[];
}

/** Append text to an existing search string, skipping words already present. */
function mergeSearchText(existing: string, addition: string | null | undefined): string {
  if (!addition) return existing;
  const have = new Set(existing.toLowerCase().split(/\s+/));
  const extra = addition.split(/\s+/).filter((w) => w && !have.has(w.toLowerCase()));
  return extra.length ? `${existing} ${extra.join(' ')}` : existing;
}

/**
 * Build food typeahead candidates from history + saved meals.
 * Each candidate stays searchable by every way the user has described it
 * (all raw inputs across repeats), plus AI item names and group names.
 */
export function buildFoodTypeaheadCandidates(
  entries: TypeaheadSourceEntry[],
  savedMeals: TypeaheadSourceMeal[] = [],
): FoodCandidate[] {
  const candidates = new Map<string, Omit<FoodCandidate, 'id'>>();

  for (const entry of entries) {
    // Skip entries from saved meals (users have the Saved button for those)
    if (entry.source_meal_id) continue;

    if (entry.group_name && entry.food_items.length > 1) {
      const key = `group:${entry.group_name.toLowerCase().trim()}`;
      const existing = candidates.get(key);
      if (existing) {
        existing.frequency += 1;
        if (entry.eaten_date > existing.timestamp) existing.timestamp = entry.eaten_date;
        existing.searchText = mergeSearchText(existing.searchText, entry.raw_input);
      } else {
        candidates.set(key, {
          label: entry.group_name,
          searchText: [entry.group_name, entry.raw_input || '', ...entry.food_items.map((i) => i.description)].join(' '),
          subtitle: `${Math.round(entry.total_calories)} cal`,
          timestamp: entry.eaten_date,
          frequency: 1,
          items: entry.food_items,
        });
      }
    } else {
      for (const item of entry.food_items) {
        const normDesc = item.description.toLowerCase().trim().replace(/\s*\(.*?\)\s*/g, ' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const calBucket = item.calories <= 0 ? 0 : Math.round(Math.log2(item.calories) * 3);
        const key = `item:${normDesc}:${calBucket}`;
        // User's own words only map cleanly to the item when it was logged alone
        const ownWords = entry.food_items.length === 1 ? entry.raw_input : null;
        const existing = candidates.get(key);
        if (existing) {
          existing.frequency += 1;
          if (entry.eaten_date > existing.timestamp) existing.timestamp = entry.eaten_date;
          existing.searchText = mergeSearchText(existing.searchText, ownWords);
        } else {
          candidates.set(key, {
            label: item.description,
            searchText: [ownWords, item.description].filter(Boolean).join(' '),
            subtitle: `${Math.round(item.calories)} cal`,
            timestamp: entry.eaten_date,
            frequency: 1,
            items: [item],
          });
        }
      }
    }
  }

  for (const meal of savedMeals) {
    const key = `saved-meal:${meal.id}`;
    if (candidates.has(key)) continue;
    const totalCal = meal.food_items.reduce((sum, i) => sum + (i.calories || 0), 0);
    candidates.set(key, {
      label: meal.name,
      searchText: [meal.name, meal.original_input, ...meal.food_items.map((i) => i.description)].filter(Boolean).join(' '),
      subtitle: `${Math.round(totalCal)} cal`,
      timestamp: meal.last_used_at ?? meal.created_at ?? '',
      frequency: Math.max(1, meal.use_count ?? 1),
      items: meal.food_items,
    });
  }

  return [...candidates.entries()].map(([id, c]) => ({ id, ...c }));
}
