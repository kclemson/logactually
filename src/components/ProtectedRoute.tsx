import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Check if there's a session in localStorage (synchronous check)
function hasStoredSession(): boolean {
  try {
    const storageKey = 'sb-enricsnosdrhmfvbjaei-auth-token';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if token exists and isn't expired
      if (parsed?.access_token && parsed?.expires_at) {
        return parsed.expires_at * 1000 > Date.now();
      }
    }
  } catch {
    // Ignore parse errors
  }
  return false;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show spinner while loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If no user in React state, check localStorage as fallback
  // This prevents redirect during the race condition window
  if (!user && hasStoredSession()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
