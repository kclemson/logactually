import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { FoodEntry } from '@/types/food';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MacroSummary } from './MacroSummary';
import { FoodItemsTable } from './FoodItemsTable';

interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete: (id: string) => void;
}

export function FoodEntryCard({ entry, onDelete }: FoodEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const totals = {
    calories: entry.total_calories,
    protein: Number(entry.total_protein),
    carbs: Number(entry.total_carbs),
    fiber: entry.food_items.reduce((sum, item) => sum + (item.fiber || 0), 0),
    sugar: entry.food_items.reduce((sum, item) => sum + (item.sugar || 0), 0),
    fat: Number(entry.total_fat),
    saturated_fat: entry.food_items.reduce((sum, item) => sum + (item.saturated_fat || 0), 0),
    sodium: entry.food_items.reduce((sum, item) => sum + (item.sodium || 0), 0),
    cholesterol: entry.food_items.reduce((sum, item) => sum + (item.cholesterol || 0), 0),
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this food entry?')) {
      onDelete(entry.id);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1">
            <p className="text-muted-foreground line-clamp-1">
              {entry.raw_input || 'No description'}
            </p>
            <MacroSummary totals={totals} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {expanded && entry.food_items.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <FoodItemsTable
              items={entry.food_items}
              editable={false}
              showHeader={true}
              showTotals={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
