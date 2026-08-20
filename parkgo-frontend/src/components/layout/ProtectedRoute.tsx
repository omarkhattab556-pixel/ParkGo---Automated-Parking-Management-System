/**
 * Authentication and role gate for an entire route subtree.
 *
 * It preserves the attempted location for login, shows a verification state
 * when no cached user is available, rejects an invalid session, and sends a
 * valid user with the wrong role to that role's own landing page.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCurrentUser } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ROLE_LANDING } from '@/utils/constants';
import type { UserType } from '@/types';

interface Props {
  children: ReactNode;
  allowedRoles?: UserType[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { isLoading, isError } = useCurrentUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading && !user) {
    return <LoadingSpinner fullScreen label="Verifying session..." />;
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // This client-side role check controls navigation only; the API remains the
  // authorization boundary for protected data and mutations.
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
    const correctLanding = ROLE_LANDING[user.user_type] || '/login';
    return <Navigate to={correctLanding} replace />;
  }

  return <>{children}</>;
}
