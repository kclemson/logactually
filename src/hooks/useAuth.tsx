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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      // Update module-level cache
      cachedSession = session;
      cachedUser = session?.user ?? null;
      // Update React state
      setSession(session);
      setUser(session?.user ?? null);
      initialCheckComplete = true;
      setLoading(false);
    });

    // Then check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        // Update module-level cache
        cachedSession = session;
        cachedUser = session?.user ?? null;
        // Update React state
        setSession(session);
        setUser(session?.user ?? null);
        
        // If we got a session, we're done loading
        if (session) {
          initialCheckComplete = true;
          setLoading(false);
        } else {
          // No session - wait briefly for potential token refresh via onAuthStateChange
          // If it doesn't fire within 1 second, assume truly logged out
          setTimeout(() => {
            if (isMounted && !initialCheckComplete) {
              initialCheckComplete = true;
              setLoading(false);
            }
          }, 1000);
        }
      })
      .catch((error) => {
        console.error('Failed to get session:', error);
        if (isMounted) {
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
