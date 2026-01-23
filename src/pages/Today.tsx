import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MacroSummary } from '@/components/MacroSummary';
import { FoodEntryCard } from '@/components/FoodEntryCard';
import { useFoodEntries } from '@/hooks/useFoodEntries';

const Today = () => {
  const [date, setDate] = useState(new Date());
  const dateStr = format(date, 'yyyy-MM-dd');
  const { entries, isLoading, deleteEntry } = useFoodEntries(dateStr);

  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  const dayTotals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.total_calories,
      protein: acc.protein + Number(entry.total_protein),
      carbs: acc.carbs + Number(entry.total_carbs),
      fat: acc.fat + Number(entry.total_fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDate(subDays(date, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-heading">
            {isToday ? 'Today' : format(date, 'EEEE')}
          </h2>
          <p className="text-size-sm text-muted-foreground">
            {format(date, 'MMMM d, yyyy')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDate(addDays(date, 1))}
          disabled={isToday}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <MacroSummary totals={dayTotals} />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No entries for this day
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <FoodEntryCard
              key={entry.id}
              entry={entry}
              onDelete={(id) => deleteEntry.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Today;
