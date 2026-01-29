import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
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
  const hasSeenWelcomeRef = useRef(false);

  // Show welcome overlay once when read-only user first loads
  useEffect(() => {
    if (!isLoading && isReadOnly && !hasSeenWelcomeRef.current) {
      const timer = setTimeout(() => {
        setOverlayMode('welcome');
        setShowOverlay(true);
        hasSeenWelcomeRef.current = true;
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
