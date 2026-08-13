import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LANDING } from '@/utils/constants';
import type { LoginInput } from '@/utils/validators';

/**
 * Shape of a rejected login, as normalised by the axios response interceptor.
 * `code` distinguishes a plain wrong password (which reports how many tries
 * remain) from a brute-force lockout (which reports how long to wait).
 */
export type LoginError = {
  message?: string;
  error?: string;
  status?: number;
  code?: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED';
  remaining_attempts?: number;
  retry_after_seconds?: number;
};

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<Awaited<ReturnType<typeof authApi.login>>, LoginError, LoginInput>({
    mutationFn: ({ email, password }: LoginInput) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setAuth({ user: data.user, token: data.token });
      const landing = ROLE_LANDING[data.user.user_type] || '/';
      toast.success(`Welcome back, ${data.user.first_name}!`);
      navigate(landing, { replace: true });
    },
    onError: (err: LoginError) => {
      // A lockout is rendered inline on the form (with a live countdown), so a
      // toast would just duplicate it.
      if (err.code === 'ACCOUNT_LOCKED') return;
      toast.error(err.error || err.message || 'Login failed');
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clear();
      navigate('/login', { replace: true });
    },
  });
};

/**
 * Verify the stored token against `/auth/me`. Used by ProtectedRoute on hard reload.
 * Returns `{ data, isLoading }` where data is the canonical user from the server.
 */
export const useCurrentUser = () => {
  const { token, isAuthenticated, updateUser, clear } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authApi.me();
      updateUser(user);
      return user;
    },
    enabled: !!token && isAuthenticated,
    staleTime: 5 * 60_000,           // זה נתונים נחשבים "ישנים" אחרי 5 דקות, אז הם יטענו מחדש רק אחרי זה
    retry: false,
    refetchOnWindowFocus: false,
    throwOnError: () => {
      clear();
      return false;
    },
  });
};
