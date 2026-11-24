// Native apps have no `localStorage` until this runs. On the web it does nothing.
import 'expo-sqlite/localStorage/install';

import { isAppRole, type AppRole } from '@nukkad/core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
  /** The API access token, or null when signed out. */
  token: string | null;
  /**
   * What the person picked on first launch. It only selects which sign-in
   * they see; once signed in, the account's own role decides what they get.
   */
  chosenRole: AppRole | null;
  setToken: (token: string | null) => void;
  chooseRole: (role: AppRole | null) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      chosenRole: null,
      setToken: (token) => set({ token }),
      chooseRole: (chosenRole) => set({ chosenRole }),
    }),
    {
      name: 'nukkad.auth',
      storage: createJSONStorage(() => localStorage),
      // Whatever is on disk is checked before it is trusted.
      merge: (stored, current) => {
        const saved = (stored ?? {}) as Partial<AuthState>;
        return {
          ...current,
          token: typeof saved.token === 'string' ? saved.token : null,
          chosenRole: isAppRole(saved.chosenRole) ? saved.chosenRole : null,
        };
      },
    },
  ),
);
