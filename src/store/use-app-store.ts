import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/i18n';
import { isRTL } from '@/i18n';

export type UserRole = 'CUSTOMER' | 'AGENCY_STAFF' | 'AGENCY_OWNER' | 'SUPER_ADMIN';
export type ViewName =
  | 'landing'
  | 'login'
  | 'register'
  | 'customer-home'
  | 'customer-queue'
  | 'customer-history'
  | 'customer-notifications'
  | 'customer-profile'
  | 'agency-dashboard'
  | 'agency-settings'
  | 'agency-profile'
  | 'agency-subscription'
  | 'admin-dashboard'
  | 'admin-transactions'
  | 'admin-agencies'
  | 'admin-audit';

interface UserState {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  language: Language;
  avatarUrl?: string;
}

interface AppState {
  // Auth
  user: UserState | null;
  isAuthenticated: boolean;

  // Navigation
  currentView: ViewName;
  previousView: ViewName | null;

  // UI
  sidebarOpen: boolean;

  // Actions
  setUser: (user: UserState | null) => void;
  setView: (view: ViewName) => void;
  goBack: () => void;
  toggleSidebar: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      currentView: 'landing',
      previousView: null,
      sidebarOpen: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          currentView: user
            ? user.role === 'SUPER_ADMIN'
              ? 'admin-dashboard'
              : user.role === 'AGENCY_STAFF' || user.role === 'AGENCY_OWNER'
              ? 'agency-dashboard'
              : 'customer-home'
            : 'landing',
          previousView: null,
        }),

      setView: (view) =>
        set((state) => ({
          currentView: view,
          previousView: state.currentView,
          sidebarOpen: false,
        })),

      goBack: () =>
        set((state) => ({
          currentView: state.previousView || state.currentView,
          previousView: null,
          sidebarOpen: false,
        })),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      logout: () => {
        // Set state first (triggers persist to write new values)
        set({
          user: null,
          isAuthenticated: false,
          currentView: 'landing',
          previousView: null,
          sidebarOpen: false,
        });
        // Then clear localStorage after state update
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('queuewise-app');
            localStorage.removeItem('queuewise-lang');
            window.location.reload();
          }
        }, 50);
      },
    }),
    {
      name: 'queuewise-app',
      partialize: (state) => ({
        user: state.user,
        currentView: state.currentView,
      }),
    }
  )
);

// Helper to get the persist API for clearing storage
useAppStore.persist.clearStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('queuewise-app');
    localStorage.removeItem('queuewise-lang');
  }
};

// Helper to set document direction
export function updateDocumentDirection(lang: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}
