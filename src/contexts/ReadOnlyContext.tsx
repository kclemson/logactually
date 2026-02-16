import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useReadOnly } from '@/hooks/useReadOnly';

type OverlayMode = 'welcome' | 'blocked';

interface ReadOnlyContextType {
  isReadOnly: boolean;
  isLoading: boolean;
  showOverlay: boolean;
  overlayMode: OverlayMode;
  triggerOverlay: () => void;
  dismissOverlay: () => void;
}

const ReadOnlyContext = createContext<ReadOnlyContextType | undefined>(undefined);

interface ReadOnlyProviderProps {
  children: ReactNode;
}

export function ReadOnlyProvider({ children }: ReadOnlyProviderProps) {
  const { isReadOnly, isLoading } = useReadOnly();
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('welcome');

  // Show welcome overlay once per device using localStorage
  useEffect(() => {
    if (!isLoading && isReadOnly && !localStorage.getItem('demo-welcome-seen')) {
      const timer = setTimeout(() => {
        setOverlayMode('welcome');
        setShowOverlay(true);
        localStorage.setItem('demo-welcome-seen', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isReadOnly]);

  const triggerOverlay = useCallback(() => {
    setOverlayMode('blocked');
    setShowOverlay(true);
  }, []);

  const dismissOverlay = useCallback(() => {
    setShowOverlay(false);
  }, []);

  return (
    <ReadOnlyContext.Provider
      value={{
        isReadOnly,
        isLoading,
        showOverlay,
        overlayMode,
        triggerOverlay,
        dismissOverlay,
      }}
    >
      {children}
    </ReadOnlyContext.Provider>
  );
}

export function useReadOnlyContext() {
  const context = useContext(ReadOnlyContext);
  if (!context) {
    throw new Error('useReadOnlyContext must be used within ReadOnlyProvider');
  }
  return context;
}
