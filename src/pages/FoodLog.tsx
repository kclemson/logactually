import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FoodInput } from '@/components/FoodInput';
import { MacroSummary } from '@/components/MacroSummary';
import { AIResults } from '@/components/AIResults';
import { FoodEntryCard } from '@/components/FoodEntryCard';
import { Button } from '@/components/ui/button';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { FoodItem, calculateTotals } from '@/types/food';
import { useToast } from '@/hooks/use-toast';

const FoodLog = () => {
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { entries, createEntry, deleteEntry } = useFoodEntries(today);
  const { analyzeFood, isAnalyzing, error: analyzeError } = useAnalyzeFood();

  const [showModal, setShowModal] = useState(false);
  const [pendingItems, setPendingItems] = useState<FoodItem[]>([]);
  const [pendingRawInput, setPendingRawInput] = useState('');

  useEffect(() => {
    if (analyzeError) {
      toast({
        variant: 'destructive',
        title: 'Analysis failed',
        description: analyzeError,
      });
    }
  }, [analyzeError, toast]);

  const handleSubmit = async (text: string) => {
    const result = await analyzeFood(text);
    if (result) {
      setPendingItems(result.food_items);
      setPendingRawInput(text);
      setShowModal(true);
    }
  };

  const handleReanalyze = async (additionalContext: string) => {
    const result = await analyzeFood(pendingRawInput, additionalContext);
    if (result) {
      setPendingItems(result.food_items);
    }
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
  };

  // Calculate today's totals from all entries
  const todaysTotals = entries.reduce(
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
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Log Food</h2>
        <FoodInput onSubmit={handleSubmit} isLoading={isAnalyzing} />
      </section>

      {pendingItems.length > 0 && !showModal && (
        <section className="rounded-lg border border-accent bg-accent/20 p-4 space-y-2">
          <p className="text-sm font-medium">You have unsaved food analysis:</p>
          <p className="text-sm text-muted-foreground">"{pendingRawInput}"</p>
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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Today's Totals</h2>
        <MacroSummary totals={todaysTotals} />
      </section>

      {entries.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Today's Entries</h2>
          {entries.map((entry) => (
            <FoodEntryCard
              key={entry.id}
              entry={entry}
              onDelete={(id) => deleteEntry.mutate(id)}
            />
          ))}
        </section>
      )}

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
