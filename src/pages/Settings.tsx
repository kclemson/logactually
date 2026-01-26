import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Trash2, Star, SunMoon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSavedMeals, useUpdateSavedMeal, useDeleteSavedMeal } from '@/hooks/useSavedMeals';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [mounted, setMounted] = useState(false);
  
  // Saved meals
  const { data: savedMeals, isLoading: mealsLoading } = useSavedMeals();
  const updateMeal = useUpdateSavedMeal();
  const deleteMeal = useDeleteSavedMeal();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

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
      <h2 className="text-title">Settings</h2>

      {/* Saved Meals - frequently accessed */}
      <section className="space-y-3">
        <h3 className="text-heading text-muted-foreground flex items-center gap-2">
          <Star className="h-4 w-4" />
          Saved Meals
        </h3>
        
        <div className="pl-4">
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

                  {/* Item count - separate column */}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {meal.food_items.length} {meal.food_items.length === 1 ? 'item' : 'items'}
                  </span>

                  {/* Delete button with popover confirmation */}
                  <Popover 
                    open={openPopoverId === meal.id} 
                    onOpenChange={(open) => setOpenPopoverId(open ? meal.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="p-1.5 hover:bg-muted rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" side="left" align="center">
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
                            onClick={() => setOpenPopoverId(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              deleteMeal.mutate(meal.id);
                              setOpenPopoverId(null);
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
        </div>
      </section>

      {/* Appearance - set once */}
      <section className="space-y-3">
        <h3 className="text-heading text-muted-foreground flex items-center gap-2">
          <SunMoon className="h-4 w-4" />
          Appearance
        </h3>
        <div className="pl-4">
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
        </div>
      </section>

    </div>
  );
}
