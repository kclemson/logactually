import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                mounted && theme === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
