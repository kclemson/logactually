import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { FoodInput } from '@/components/FoodInput';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { AIResults } from '@/components/AIResults';
import { Button } from '@/components/ui/button';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { FoodItem, calculateTotals } from '@/types/food';

const FoodLog = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { entries, createEntry, deleteEntry } = useFoodEntries(today);
  const { analyzeFood, isAnalyzing, error: analyzeError } = useAnalyzeFood();

  const [showModal, setShowModal] = useState(false);
  const [pendingItems, setPendingItems] = useState<FoodItem[]>([]);
  const [pendingRawInput, setPendingRawInput] = useState('');
  const [shouldClearInput, setShouldClearInput] = useState(false);

  const handleSubmit = async (text: string) => {
    const result = await analyzeFood(text);
    if (result) {
      setPendingItems(result.food_items);
      setPendingRawInput(text);
      setShowModal(true);
    }
  };

  const handleReanalyze = async (
    additionalContext: string,
    currentItems: FoodItem[]
  ): Promise<FoodItem[] | null> => {
    const result = await analyzeFood(pendingRawInput, additionalContext, currentItems);
    if (result) {
      setPendingItems(result.food_items);
      return result.food_items;
    }
    return null;
  };

  const handleConfirm = (items: FoodItem[]) => {
    const totals = calculateTotals(items);
    createEntry.mutate({
      eaten_date: today,
      raw_input: pendingRawInput,
      food_items: items,
      total_calories: Math.round(totals.calories),
      total_protein: Math.round(totals.protein * 10) / 10,
      total_carbs: Math.round(totals.carbs * 10) / 10,
      total_fat: Math.round(totals.fat * 10) / 10,
    });
    setPendingItems([]);
    setPendingRawInput('');
    setShouldClearInput(true);
  };

  // Flatten all entries into a single items array with entry tracking
  const { allItems, entryBoundaries, todaysTotals } = useMemo(() => {
    const items: FoodItem[] = [];
    const boundaries: { entryId: string; startIndex: number; endIndex: number }[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    entries.forEach((entry) => {
      const startIndex = items.length;
      items.push(...entry.food_items);
      boundaries.push({
        entryId: entry.id,
        startIndex,
        endIndex: items.length - 1,
      });
      
      totalCalories += entry.total_calories;
      totalProtein += Number(entry.total_protein);
      totalCarbs += Number(entry.total_carbs);
      totalFat += Number(entry.total_fat);
    });

    return {
      allItems: items,
      entryBoundaries: boundaries,
      todaysTotals: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      },
    };
  }, [entries]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-heading">Log Food</h2>
        <FoodInput 
          onSubmit={handleSubmit} 
          isLoading={isAnalyzing}
          shouldClear={shouldClearInput}
          onCleared={() => setShouldClearInput(false)}
        />
        {analyzeError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Analysis failed: {analyzeError}
          </div>
        )}
      </section>

      {pendingItems.length > 0 && !showModal && (
        <section className="rounded-lg border border-accent bg-accent/20 p-4 space-y-2">
          <p className="text-body font-medium">You have unsaved food analysis:</p>
          <p className="text-size-compact text-muted-foreground">"{pendingRawInput}"</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowModal(true)}>
              Review
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => { setPendingItems([]); setPendingRawInput(''); }}
            >
              Discard
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-heading">Today</h2>
        {entries.length > 0 ? (
          <FoodItemsTable
            items={allItems}
            totals={todaysTotals}
            totalsPosition="top"
            showTotals={true}
            entryBoundaries={entryBoundaries}
            onDeleteEntry={(entryId) => deleteEntry.mutate(entryId)}
          />
        ) : (
          <p className="text-body text-muted-foreground">No entries yet today.</p>
        )}
      </section>

      {showModal && (
        <AIResults
          open={showModal}
          onOpenChange={setShowModal}
          foodItems={pendingItems}
          rawInput={pendingRawInput}
          onConfirm={handleConfirm}
          onReanalyze={handleReanalyze}
          isReanalyzing={isAnalyzing}
        />
      )}
    </div>
  );
};

export default FoodLog;
