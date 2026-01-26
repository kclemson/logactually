import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSavedMeals, useLogSavedMeal } from '@/hooks/useSavedMeals';
import { SavedMeal, FoodItem, calculateTotals } from '@/types/food';

interface SavedMealsPopoverProps {
  onSelectMeal: (foodItems: FoodItem[], mealId: string) => void;
  onClose?: () => void;
}

export function SavedMealsPopover({ onSelectMeal, onClose }: SavedMealsPopoverProps) {
  const [search, setSearch] = useState('');
  const { data: savedMeals, isLoading } = useSavedMeals();
  const logMeal = useLogSavedMeal();

  const filteredMeals = useMemo(() => {
    if (!savedMeals) return [];
    if (!search.trim()) return savedMeals;
    
    const query = search.toLowerCase();
    return savedMeals.filter(meal => 
      meal.name.toLowerCase().includes(query) ||
      meal.food_items.some(item => item.description.toLowerCase().includes(query))
    );
  }, [savedMeals, search]);

  const handleSelectMeal = async (meal: SavedMeal) => {
    const foodItems = await logMeal.mutateAsync(meal.id);
    onSelectMeal(foodItems, meal.id);
    onClose?.();
  };

  // Show search when 10+ meals
  const showSearch = (savedMeals?.length ?? 0) >= 10;

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!savedMeals || savedMeals.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <p>No saved meals yet.</p>
        <p className="mt-1">Save a meal from your log to see it here.</p>
      </div>
    );
  }

  return (
    <div className="w-72">
      {showSearch && (
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meals..."
              className="pl-8 h-8"
            />
          </div>
        </div>
      )}
      
      <div className="max-h-64 overflow-y-auto">
        {filteredMeals.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No meals match "{search}"
          </div>
        ) : (
          filteredMeals.map((meal) => {
            const totals = calculateTotals(meal.food_items);
            const isLogging = logMeal.isPending && logMeal.variables === meal.id;
            
            return (
              <button
                key={meal.id}
                onClick={() => handleSelectMeal(meal)}
                disabled={logMeal.isPending}
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{meal.name}</span>
                  {isLogging && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {meal.food_items.length} item{meal.food_items.length !== 1 ? 's' : ''} • {Math.round(totals.calories)} cal
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
