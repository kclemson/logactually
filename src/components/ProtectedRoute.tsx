import { forwardRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  ({ children }, ref) => {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div
          ref={ref}
          className="flex min-h-screen items-center justify-center bg-background"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
  }
);

ProtectedRoute.displayName = 'ProtectedRoute';
