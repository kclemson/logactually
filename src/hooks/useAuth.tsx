import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Module-level cache that survives HMR reloads
let cachedSession: Session | null = null;
let cachedUser: User | null = null;

// Preserve cache across HMR updates (dev only)
if (import.meta.hot) {
  // Read from hot data first (if it exists)
  if (import.meta.hot.data.cachedSession !== undefined) {
    cachedSession = import.meta.hot.data.cachedSession;
  }
  if (import.meta.hot.data.cachedUser !== undefined) {
    cachedUser = import.meta.hot.data.cachedUser;
  }
  
  // Store current values before module unloads
  import.meta.hot.dispose((data) => {
    data.cachedSession = cachedSession;
    data.cachedUser = cachedUser;
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    let isMounted = true;
    let initialCheckComplete = false;

    // Absolute timeout - never stay loading forever (10 seconds max)
    const absoluteTimeout = setTimeout(() => {
      if (isMounted && !initialCheckComplete) {
        console.error('Auth initialization timed out after 10 seconds');
        setLoading(false);
      }
    }, 10000);

    // Listen for auth changes FIRST - this catches token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state change:', event, !!session);
      
      // Only clear auth state on explicit sign out
      if (event === 'SIGNED_OUT') {
        cachedSession = null;
        cachedUser = null;
        setSession(null);
        setUser(null);
        initialCheckComplete = true;
        setLoading(false);
      } else if (session) {
        // Update cache when we have a valid session
        cachedSession = session;
        cachedUser = session.user;
        setSession(session);
        setUser(session.user);
        initialCheckComplete = true;
        setLoading(false);
      }
      // KEY FIX: If session is null but event isn't SIGNED_OUT,
      // DON'T set loading = false here. Let getSession() handle it.
      // This prevents the race condition where early null events
      // cause a redirect before the real session is loaded.
    });

    // Then check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        
        if (session) {
          // Got a valid session - update everything
          cachedSession = session;
          cachedUser = session.user;
          setSession(session);
          setUser(session.user);
          initialCheckComplete = true;
          setLoading(false);
        } else if (cachedUser) {
          // No session returned BUT we have a cached user
          // This happens when refresh token was rotated by another device
          // Keep the cached session - user stays logged in
          console.warn('getSession returned null but cached user exists - preserving session');
          initialCheckComplete = true;
          setLoading(false);
        } else {
          // No session and no cache - user is not logged in
          initialCheckComplete = true;
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to get session:', error);
        if (isMounted) {
          // Preserve existing cache on error - don't log user out due to network issues
          initialCheckComplete = true;
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(absoluteTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    // Clear module-level cache
    cachedSession = null;
    cachedUser = null;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
