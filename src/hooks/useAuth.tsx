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
      
      // Auth state change logging removed for production
      
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
      } else if (event === 'INITIAL_SESSION' && cachedUser && cachedSession) {
        // INITIAL_SESSION with null session during HMR - reinforce cached state
        // This prevents the redirect when auth events arrive out of order
        setUser(cachedUser);
        setSession(cachedSession);
        initialCheckComplete = true;
        setLoading(false);
      }
      // For other events with null session, don't set loading = false here.
      // Let getSession() handle it.
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
          if (import.meta.env.DEV) {
            console.warn('getSession returned null but cached user exists - preserving session');
          }
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Track login count (fire-and-forget, don't block auth flow)
    if (!error && data.user) {
      supabase.rpc('increment_login_count', { user_id: data.user.id })
        .then(({ error: rpcError }) => {
          if (import.meta.env.DEV) {
            if (rpcError) {
              console.error('Failed to increment login count:', rpcError);
            } else {
              console.log('Login count incremented for user:', data.user.id);
            }
          }
        });
    }
    
    return { error };
  };

  const signOut = async () => {
    // Clear localStorage FIRST to prevent ProtectedRoute race condition
    // This ensures hasStoredSession() returns false immediately
    const storageKey = 'sb-enricsnosdrhmfvbjaei-auth-token';
    localStorage.removeItem(storageKey);
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Log but don't throw - we still want to clear local state
      // This handles 403 "session_not_found" errors when session is already invalid
      if (import.meta.env.DEV) {
        console.warn('Sign out API call failed:', error);
      }
    }
    
    // ALWAYS clear local state, even if API failed
    // If session was already invalid, we still want to "sign out" locally
    cachedSession = null;
    cachedUser = null;
    setSession(null);
    setUser(null);
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
