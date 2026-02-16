import { create } from 'zustand';
import type { AppRole, User } from '../types';

type AuthState = {
  user: User | null;
  role: AppRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  setUser: (user: User) => void;
  setRole: (role: AppRole) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setAuthError: (error: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: (localStorage.getItem('ads_market_role') as AppRole) || 'advertiser',
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setRole: (role) => {
    localStorage.setItem('ads_market_role', role);
    set({ role });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setAuthError: (authError) => set({ authError }),
}));
