import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UseReadOnlyResult {
  isReadOnly: boolean;
  isLoading: boolean;
}

export function useReadOnly(): UseReadOnlyResult {
  const { user } = useAuth();
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsReadOnly(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    supabase
      .from('profiles')
      .select('is_read_only')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch read-only status:', error);
          setIsReadOnly(false);
        } else {
          setIsReadOnly(data?.is_read_only ?? false);
        }
        setIsLoading(false);
      });
  }, [user]);

  return { isReadOnly, isLoading };
}
