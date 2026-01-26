import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Loader2 } from 'lucide-react';
import { FoodItem } from '@/types/food';
import { useSuggestMealName } from '@/hooks/useSuggestMealName';

interface SaveMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawInput: string | null;
  foodItems: FoodItem[];
  onSave: (name: string) => void;
  isSaving: boolean;
}

/**
 * Extract a fallback name from the first food item's description.
 * Takes the text before any parentheses (portion info).
 */
function getFallbackName(foodItems: FoodItem[]): string {
  if (foodItems.length === 0) return '';
  const first = foodItems[0].description;
  // Remove portion info in parentheses
  const withoutPortion = first.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return withoutPortion || first;
}

export function SaveMealDialog({
  open,
  onOpenChange,
  rawInput,
  foodItems,
  onSave,
  isSaving,
}: SaveMealDialogProps) {
  const [name, setName] = useState('');
  const [userHasTyped, setUserHasTyped] = useState(false);
  const { suggestName, isLoading: isSuggesting } = useSuggestMealName();
  const suggestionRequestedRef = useRef(false);

  // Reset state and fetch AI suggestion when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setUserHasTyped(false);
      suggestionRequestedRef.current = false;
    }
  }, [open]);

  // Fetch AI-suggested name when dialog opens
  useEffect(() => {
    if (!open || suggestionRequestedRef.current || foodItems.length === 0) {
      return;
    }

    suggestionRequestedRef.current = true;

    const fetchSuggestion = async () => {
      const descriptions = foodItems.map(item => item.description);
      const suggested = await suggestName(descriptions);
      
      // Only set if user hasn't started typing
      if (suggested && !userHasTyped) {
        setName(suggested);
      } else if (!suggested && !userHasTyped) {
        // Fallback to first item if AI fails
        setName(getFallbackName(foodItems));
      }
    };

    fetchSuggestion();
  }, [open, foodItems, suggestName, userHasTyped]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setUserHasTyped(true);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  const isGenerating = isSuggesting && !userHasTyped;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Meal</DialogTitle>
          <DialogDescription>
            Give this meal a name to quickly log it again later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="meal-name">Meal name</Label>
            <div className="relative">
              <Input
                id="meal-name"
                value={name}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                placeholder={isGenerating ? "Generating suggested name..." : "e.g., Morning Coffee"}
                disabled={isSaving || isGenerating}
                autoFocus={!isGenerating}
              />
              {isGenerating && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Items ({foodItems.length}):</p>
            <ul className="list-disc list-inside space-y-0.5">
              {foodItems.slice(0, 5).map((item, i) => (
                <li key={i} className="truncate">{item.description}</li>
              ))}
              {foodItems.length > 5 && (
                <li className="text-muted-foreground/70">+{foodItems.length - 5} more...</li>
              )}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving || isGenerating}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              'Save Meal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
