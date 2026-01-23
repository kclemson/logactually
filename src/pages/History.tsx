import { useMemo } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FoodEntry, FoodItem } from '@/types/food';
import { FoodEntryCard } from '@/components/FoodEntryCard';
import { useFoodEntries } from '@/hooks/useFoodEntries';

const History = () => {
  const { deleteEntry } = useFoodEntries();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['food-entries-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .order('eaten_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((entry) => ({
        ...entry,
        food_items: Array.isArray(entry.food_items)
          ? (entry.food_items as unknown as FoodItem[])
          : [],
      })) as FoodEntry[];
    },
  });

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, FoodEntry[]> = {};
    entries.forEach((entry) => {
      const date = entry.eaten_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return Object.entries(groups);
  }, [entries]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No entries yet. Start logging your food!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedEntries.map(([date, dayEntries]) => {
        const dayTotals = dayEntries.reduce(
          (acc, entry) => ({
            calories: acc.calories + entry.total_calories,
            protein: acc.protein + Number(entry.total_protein),
          }),
          { calories: 0, protein: 0 }
        );

        return (
          <section key={date} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-heading">
                {format(new Date(date), 'EEEE, MMMM d')}
              </h2>
              <span className="text-size-sm text-muted-foreground">
                {Math.round(dayTotals.calories)} cal
              </span>
            </div>
            {dayEntries.map((entry) => (
              <FoodEntryCard
                key={entry.id}
                entry={entry}
                onDelete={(id) => deleteEntry.mutate(id)}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
};

export default History;
