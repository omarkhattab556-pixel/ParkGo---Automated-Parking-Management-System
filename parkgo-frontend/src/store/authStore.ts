import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserType } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { user: User; token: string }) => void;
  updateUser: (user: User) => void;
  clear: () => void;
  hasRole: (...roles: UserType[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: ({ user, token }) =>
        set({ user, token, isAuthenticated: true }),
      updateUser: (user) => set({ user }),
      clear: () =>
        set({ user: null, token: null, isAuthenticated: false }),
      hasRole: (...roles) => {
        const u = get().user;
        return !!u && roles.includes(u.user_type);
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
