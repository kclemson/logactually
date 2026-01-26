import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Trash2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSavedMeals, useUpdateSavedMeal, useDeleteSavedMeal } from '@/hooks/useSavedMeals';
import { Input } from '@/components/ui/input';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [mounted, setMounted] = useState(false);
  
  // Saved meals
  const { data: savedMeals, isLoading: mealsLoading } = useSavedMeals();
  const updateMeal = useUpdateSavedMeal();
  const deleteMeal = useDeleteSavedMeal();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEditing = () => {
    if (editingId && editingName.trim()) {
      updateMeal.mutate({ id: editingId, name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      deleteMeal.mutate(id);
    }
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
        <h3 className="text-heading text-muted-foreground">Saved Meals</h3>
        
        <div className="pl-4">
          {mealsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !savedMeals?.length ? (
            <p className="text-sm text-muted-foreground">No saved meals yet</p>
          ) : (
            <ul className="space-y-1">
              {savedMeals.map((meal) => (
                <li key={meal.id} className="flex items-center gap-2 py-1">
                  {editingId === meal.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="h-8 flex-1"
                        autoFocus
                      />
                      <button onClick={saveEditing} className="p-1.5 hover:bg-muted rounded" title="Save">
                        <Check className="h-4 w-4 text-green-600" />
                      </button>
                      <button onClick={cancelEditing} className="p-1.5 hover:bg-muted rounded" title="Cancel">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm truncate">
                        {meal.name}
                        <span className="text-muted-foreground ml-1">
                          ({meal.food_items.length} {meal.food_items.length === 1 ? 'item' : 'items'})
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(meal.id, meal.name)}
                          className="p-1.5 hover:bg-muted rounded"
                          title="Rename"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(meal.id, meal.name)}
                          className="p-1.5 hover:bg-muted rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Appearance - set once */}
      <section className="space-y-3">
        <h3 className="text-heading text-muted-foreground">Appearance</h3>
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
