import { Outlet, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DevToolsPanel } from './DevToolsPanel';
import { DemoBanner } from './DemoBanner';
import { ReadOnlyOverlay } from './ReadOnlyOverlay';
import { PullToRefresh } from './PullToRefresh';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useReadOnlyContext } from '@/contexts/ReadOnlyContext';
import { useIsMobile } from '@/hooks/use-mobile';

export function Layout() {
  const { data: isAdmin } = useIsAdmin();
  const { settings, isLoading } = useUserSettings();
  const { setTheme } = useTheme();
  const hasSyncedRef = useRef(false);
  const { isReadOnly } = useReadOnlyContext();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const hideAdmin = searchParams.get('hideAdmin') === 'true';

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

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const mainContent = (
    <main className="mx-auto max-w-lg px-3 pb-20 pt-4 md:pb-8">
      <Outlet />
    </main>
  );

  return (
    <div className="min-h-screen bg-background">
      {isReadOnly && <DemoBanner />}
      <ReadOnlyOverlay />
      <Header />
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh}>
          {mainContent}
        </PullToRefresh>
      ) : (
        mainContent
      )}
      <BottomNav />
      {isAdmin && !hideAdmin && <DevToolsPanel />}
    </div>
  );
}
