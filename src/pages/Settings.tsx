import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Trash2, Star, SunMoon, Download, Plus, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSavedMeals, useUpdateSavedMeal, useDeleteSavedMeal } from '@/hooks/useSavedMeals';
import { useSavedRoutines, useUpdateSavedRoutine, useDeleteSavedRoutine } from '@/hooks/useSavedRoutines';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useExportData } from '@/hooks/useExportData';
import { CreateMealDialog } from '@/components/CreateMealDialog';
import { CreateRoutineDialog } from '@/components/CreateRoutineDialog';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { FEATURES } from '@/lib/feature-flags';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [mounted, setMounted] = useState(false);
  
  // Saved meals
  const { data: savedMeals, isLoading: mealsLoading } = useSavedMeals();
  const updateMeal = useUpdateSavedMeal();
  const deleteMeal = useDeleteSavedMeal();
  const [openMealPopoverId, setOpenMealPopoverId] = useState<string | null>(null);
  const [createMealDialogOpen, setCreateMealDialogOpen] = useState(false);
  
  // Saved routines (weight tracking)
  const { data: savedRoutines, isLoading: routinesLoading } = useSavedRoutines();
  const updateRoutine = useUpdateSavedRoutine();
  const deleteRoutine = useDeleteSavedRoutine();
  const [openRoutinePopoverId, setOpenRoutinePopoverId] = useState<string | null>(null);
  const [createRoutineDialogOpen, setCreateRoutineDialogOpen] = useState(false);
  
  // Export data
  const { isExporting, exportDailyTotals, exportFoodLog } = useExportData();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync theme from database on load
  useEffect(() => {
    if (!isLoading && settings.theme && mounted) {
      setTheme(settings.theme);
    }
  }, [isLoading, settings.theme, setTheme, mounted]);

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    updateSettings({ theme: value });
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Saved Meals - frequently accessed */}
      <CollapsibleSection
        title="Saved Meals"
        icon={Star}
        headerAction={
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCreateMealDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        }
      >
        {mealsLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !savedMeals?.length ? (
          <p className="text-sm text-muted-foreground">No saved meals yet</p>
        ) : (
          <ul className="space-y-1">
            {savedMeals.map((meal) => (
              <li key={meal.id} className="flex items-center gap-2 py-1">
                {/* Click-to-edit meal name */}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  onFocus={(e) => {
                    e.currentTarget.dataset.original = meal.name;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.textContent = e.currentTarget.dataset.original || meal.name;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const newName = e.currentTarget.textContent?.trim();
                      const original = e.currentTarget.dataset.original;
                      if (newName && newName !== original) {
                        updateMeal.mutate({ id: meal.id, name: newName });
                        e.currentTarget.dataset.original = newName;
                      }
                      e.currentTarget.blur();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      e.currentTarget.textContent = e.currentTarget.dataset.original || meal.name;
                      e.currentTarget.blur();
                    }
                  }}
                  className="flex-1 text-sm truncate cursor-text hover:bg-muted/50 focus:bg-focus-bg focus:ring-2 focus:ring-focus-ring focus:outline-none rounded px-1 py-0.5"
                >
                  {meal.name}
                </div>

                {/* Item count with popover to show items */}
                <Popover>
                  <PopoverTrigger asChild>
                    <span className="text-xs text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors">
                      {meal.food_items.length} {meal.food_items.length === 1 ? 'item' : 'items'}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-64 p-2" 
                    side="top" 
                    align="end"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <ul className="text-xs space-y-1">
                      {meal.food_items.map((item) => (
                        <li key={item.uid} className="flex justify-between gap-2">
                          <span>{item.description}</span>
                          <span className="text-muted-foreground shrink-0">{item.calories}</span>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>

                {/* Delete button with popover confirmation */}
                <Popover 
                  open={openMealPopoverId === meal.id} 
                  onOpenChange={(open) => setOpenMealPopoverId(open ? meal.id : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      className="p-1.5 hover:bg-muted rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" side="top" align="end">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Delete saved meal?</p>
                        <p className="text-xs text-muted-foreground">
                          "{meal.name}" will be permanently removed.
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setOpenMealPopoverId(null)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            deleteMeal.mutate(meal.id);
                            setOpenMealPopoverId(null);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {/* Saved Routines - weight tracking (gated by feature flag) */}
      {FEATURES.WEIGHT_TRACKING && (
        <CollapsibleSection
          title="Saved Routines"
          icon={Dumbbell}
          headerAction={
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCreateRoutineDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          }
        >
          {routinesLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !savedRoutines?.length ? (
            <p className="text-sm text-muted-foreground">No saved routines yet</p>
          ) : (
            <ul className="space-y-1">
              {savedRoutines.map((routine) => (
                <li key={routine.id} className="flex items-center gap-2 py-1">
                  {/* Click-to-edit routine name */}
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onFocus={(e) => {
                      e.currentTarget.dataset.original = routine.name;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.textContent = e.currentTarget.dataset.original || routine.name;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const newName = e.currentTarget.textContent?.trim();
                        const original = e.currentTarget.dataset.original;
                        if (newName && newName !== original) {
                          updateRoutine.mutate({ id: routine.id, name: newName });
                          e.currentTarget.dataset.original = newName;
                        }
                        e.currentTarget.blur();
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        e.currentTarget.textContent = e.currentTarget.dataset.original || routine.name;
                        e.currentTarget.blur();
                      }
                    }}
                    className="flex-1 text-sm truncate cursor-text hover:bg-muted/50 focus:bg-focus-bg focus:ring-2 focus:ring-focus-ring focus:outline-none rounded px-1 py-0.5"
                  >
                    {routine.name}
                  </div>

                  {/* Exercise count with popover to show exercises */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <span className="text-xs text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors">
                        {routine.exercise_sets.length} {routine.exercise_sets.length === 1 ? 'exercise' : 'exercises'}
                      </span>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-64 p-2" 
                      side="top" 
                      align="end"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <ul className="text-xs space-y-1">
                        {routine.exercise_sets.map((set, idx) => (
                          <li key={idx} className="flex justify-between gap-2">
                            <span>{set.description}</span>
                            <span className="text-muted-foreground shrink-0">
                              {set.sets}×{set.reps} @ {set.weight_lbs}lb
                            </span>
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>

                  {/* Delete button with popover confirmation */}
                  <Popover 
                    open={openRoutinePopoverId === routine.id} 
                    onOpenChange={(open) => setOpenRoutinePopoverId(open ? routine.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="p-1.5 hover:bg-muted rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" side="top" align="end">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">Delete saved routine?</p>
                          <p className="text-xs text-muted-foreground">
                            "{routine.name}" will be permanently removed.
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setOpenRoutinePopoverId(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              deleteRoutine.mutate(routine.id);
                              setOpenRoutinePopoverId(null);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      )}

      {/* Appearance - set once */}
      <CollapsibleSection title="Appearance" icon={SunMoon}>
        <div className="flex gap-2 max-w-xs">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-colors",
                mounted && theme === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Export as CSV */}
      <CollapsibleSection title="Export Food Data" icon={Download}>
        <div className="flex gap-2 max-w-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={exportDailyTotals}
            disabled={isExporting}
          >
            Daily Totals
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportFoodLog}
            disabled={isExporting}
          >
            Food Log
          </Button>
        </div>
      </CollapsibleSection>

      {/* Create New Meal Dialog */}
      {createMealDialogOpen && (
        <CreateMealDialog
          open={createMealDialogOpen}
          onOpenChange={setCreateMealDialogOpen}
          onMealCreated={() => {}}
          showLogPrompt={false}
        />
      )}

      {/* Create New Routine Dialog */}
      {createRoutineDialogOpen && (
        <CreateRoutineDialog
          open={createRoutineDialogOpen}
          onOpenChange={setCreateRoutineDialogOpen}
          onRoutineCreated={() => {}}
          showLogPrompt={false}
        />
      )}

    </div>
  );
}
