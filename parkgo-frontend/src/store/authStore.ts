/**
 * Persisted client-side snapshot of the current session.
 *
 * This state supports navigation and rendering; it is not an authorization
 * boundary. ProtectedRoute revalidates the token with the server on reload,
 * and the persisted `{ state: ... }` shape is also consumed by api/axios.ts.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserType } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { user: User; token: string }) => void;   // נשמר ב ZUSTAND את המשתמש והטוקן
  /** Replaces cached profile data after the server returns its canonical user. */
  updateUser: (user: User) => void;
  /** Removes every local session field, regardless of server logout outcome. */
  clear: () => void;
  /** Client-side role helper for navigation and presentation only. */
  hasRole: (...roles: UserType[]) => boolean;     
}                                                               //עבור לקוח

export const useAuthStore = create<AuthState>()(     
  persist(                                                      // עבור שרת
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
      // Persist data only; actions are recreated when the store initialises.
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
