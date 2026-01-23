import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { FoodEntry } from '@/types/food';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MacroSummary } from './MacroSummary';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
    fat: Number(entry.total_fat),
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1">
            <p className="text-secondary text-muted-foreground line-clamp-1">
              {entry.raw_input || 'No description'}
            </p>
            <MacroSummary totals={totals} size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this food entry.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(entry.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {expanded && entry.food_items.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {entry.food_items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-secondary"
              >
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground"> · {item.portion}</span>
                </div>
                <span className="text-muted-foreground">
                  {item.calories} cal
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
