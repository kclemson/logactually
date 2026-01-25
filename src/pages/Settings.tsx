import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [mounted, setMounted] = useState(false);

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

      <section className="space-y-3">
        <h3 className="text-heading text-muted-foreground">Appearance</h3>
        <div className="flex gap-2">
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
      </section>
    </div>
  );
}
