import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FoodItemsTable } from '@/components/FoodItemsTable';
import { WeightItemsTable } from '@/components/WeightItemsTable';
import { supabase } from '@/integrations/supabase/client';
import { FoodItem } from '@/types/food';
import { WeightSet } from '@/types/weight';
import type { WeightUnit } from '@/lib/weight-units';

interface DemoPreviewDialogProps {
  mode: 'food' | 'weights';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodItems?: FoodItem[];
  weightSets?: WeightSet[];
  weightUnit?: WeightUnit;
  rawInput: string | null;
}

export function DemoPreviewDialog({
  mode,
  open,
  onOpenChange,
  foodItems = [],
  weightSets = [],
  weightUnit = 'lbs',
  rawInput,
}: DemoPreviewDialogProps) {
  const navigate = useNavigate();
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());

  // Synthetic entry ID for preview
  const previewEntryId = 'demo-preview';

  // Toggle expansion state
  const handleToggleExpand = useCallback((entryId: string) => {
    setExpandedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }, []);

  // Create entry boundaries for single preview entry
  const foodEntryBoundaries = foodItems.length > 0
    ? [{ entryId: previewEntryId, startIndex: 0, endIndex: foodItems.length - 1 }]
    : [];

  const weightEntryBoundaries = weightSets.length > 0
    ? [{ entryId: previewEntryId, startIndex: 0, endIndex: weightSets.length - 1 }]
    : [];

  // Map of entry ID to raw input for expansion
  const entryRawInputs = rawInput
    ? new Map([[previewEntryId, rawInput]])
    : new Map<string, string>();

  // Add entryId to items for table compatibility
  const foodItemsWithEntryId = foodItems.map(item => ({
    ...item,
    entryId: previewEntryId,
  }));

  const weightSetsWithEntryId = weightSets.map(item => ({
    ...item,
    entryId: previewEntryId,
  }));

  // Sign out and navigate to auth page
  const handleCreateAccount = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Here's what would be logged:</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {mode === 'food' && foodItemsWithEntryId.length > 0 && (
            <FoodItemsTable
              items={foodItemsWithEntryId}
              editable={false}
              showHeader={true}
              showTotals={true}
              totalsPosition="bottom"
              entryBoundaries={foodEntryBoundaries}
              entryRawInputs={entryRawInputs}
              expandedEntryIds={expandedEntryIds}
              onToggleEntryExpand={handleToggleExpand}
            />
          )}

          {mode === 'weights' && weightSetsWithEntryId.length > 0 && (
            <WeightItemsTable
              items={weightSetsWithEntryId}
              editable={false}
              showHeader={true}
              showTotals={true}
              totalsPosition="bottom"
              entryBoundaries={weightEntryBoundaries}
              entryRawInputs={entryRawInputs}
              expandedEntryIds={expandedEntryIds}
              onToggleEntryExpand={handleToggleExpand}
              weightUnit={weightUnit}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
          <Button onClick={handleCreateAccount}>
            Create Free Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
