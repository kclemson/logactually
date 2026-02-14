import { useState } from 'react';
import { Utensils, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SavedMealRow } from '@/components/SavedMealRow';
import { CreateMealDialog } from '@/components/CreateMealDialog';
import { useSavedMeals, useUpdateSavedMeal, useDeleteSavedMeal } from '@/hooks/useSavedMeals';
import type { UserSettings } from '@/hooks/useUserSettings';

interface SavedMealsSectionProps {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  isReadOnly: boolean;
}

export function SavedMealsSection({ settings, updateSettings, isReadOnly }: SavedMealsSectionProps) {
  const { data: savedMeals, isLoading: mealsLoading } = useSavedMeals();
  const updateMeal = useUpdateSavedMeal();
  const deleteMeal = useDeleteSavedMeal();
  const [openMealPopoverId, setOpenMealPopoverId] = useState<string | null>(null);
  const [createMealDialogOpen, setCreateMealDialogOpen] = useState(false);
  const [expandedMealIds, setExpandedMealIds] = useState<Set<string>>(new Set());

  const toggleMealExpand = (id: string) => {
    setExpandedMealIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <CollapsibleSection title="Saved Meals" icon={Utensils} storageKey="settings-meals" iconClassName="text-blue-500 dark:text-blue-400">
        {!isReadOnly && (
          <button
            onClick={() => setCreateMealDialogOpen(true)}
            className="w-full text-left py-2 hover:bg-accent/50 transition-colors flex items-center gap-2 text-sm text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Add Saved Meal</span>
          </button>
        )}
        {mealsLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !savedMeals?.length ? (
          !isReadOnly ? null : <p className="text-sm text-muted-foreground">No saved meals yet</p>
        ) : (
          <ul className="space-y-0">
            {savedMeals.map((meal) => (
              <SavedMealRow
                key={meal.id}
                meal={meal}
                isExpanded={expandedMealIds.has(meal.id)}
                onToggleExpand={() => toggleMealExpand(meal.id)}
                onUpdateMeal={(params) => updateMeal.mutate(params)}
                onDeleteMeal={(id) => deleteMeal.mutate(id)}
                openDeletePopoverId={openMealPopoverId}
                setOpenDeletePopoverId={setOpenMealPopoverId}
              />
            ))}
          </ul>
        )}
        {!isReadOnly && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Suggest saves</p>
            <button
              onClick={() => updateSettings({ suggestMealSaves: !settings.suggestMealSaves })}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative border",
                settings.suggestMealSaves ? "bg-primary border-primary" : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-0.5 w-5 h-5 rounded-full shadow transition-transform",
                  settings.suggestMealSaves
                    ? "translate-x-6 bg-primary-foreground"
                    : "translate-x-0.5 bg-white"
                )}
              />
            </button>
          </div>
        )}
      </CollapsibleSection>

      {createMealDialogOpen && (
        <CreateMealDialog
          open={createMealDialogOpen}
          onOpenChange={setCreateMealDialogOpen}
          onMealCreated={() => {}}
          showLogPrompt={false}
        />
      )}
    </>
  );
}
