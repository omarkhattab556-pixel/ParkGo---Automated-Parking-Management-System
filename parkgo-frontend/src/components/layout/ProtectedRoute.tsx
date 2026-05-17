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

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
    const correctLanding = ROLE_LANDING[user.user_type] || '/login';
    return <Navigate to={correctLanding} replace />;
  }

  return <>{children}</>;
}
