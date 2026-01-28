import { Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DevToolsPanel } from './DevToolsPanel';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserSettings } from '@/hooks/useUserSettings';

export function Layout() {
  const { data: isAdmin } = useIsAdmin();
  const { settings, isLoading } = useUserSettings();
  const { setTheme } = useTheme();
  const hasSyncedRef = useRef(false);

  // One-time sync: If localStorage has no theme but DB does, apply DB value
  // This handles new device login or cleared cache scenarios
  useEffect(() => {
    if (hasSyncedRef.current || isLoading) return;
    
    const storedTheme = localStorage.getItem('theme');
    // Only sync from DB if localStorage is empty (new device/cleared cache)
    if (!storedTheme && settings.theme) {
      setTheme(settings.theme);
    }
    hasSyncedRef.current = true;
  }, [isLoading, settings.theme, setTheme]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-3 pb-20 pt-4 md:pb-8">
        <Outlet />
      </main>
      <BottomNav />
      {isAdmin && <DevToolsPanel />}
    </div>
  );
}
