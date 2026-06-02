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
  | 'customer-favorites'
  | 'customer-settings'
  | 'agency-dashboard'
  | 'agency-settings'
  | 'agency-employees'
  | 'agency-profile'
  | 'agency-reviews'
  | 'agency-subscription'
  | 'agency-branches'
  | 'admin-dashboard'
  | 'admin-transactions'
  | 'admin-agencies'
  | 'admin-audit'
  | 'admin-users'
  | 'admin-analytics'
  | 'admin-settings'
  | 'kiosk';

interface UserState {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  language: Language;
  avatarUrl?: string;
  agencyId?: string;
  agencyName?: string;
  agencyNameAr?: string;
  agencyNameFr?: string;
  phoneNumber?: string;
  freeSmsCount?: number;
  createdAt?: string;
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

  // QR Code deep link
  pendingAgencyCode: string | null;

  // Onboarding
  onboarded: boolean;

  // Actions
  setUser: (user: UserState | null) => void;
  setView: (view: ViewName) => void;
  goBack: () => void;
  toggleSidebar: () => void;
  logout: () => void;
  setPendingAgencyCode: (code: string | null) => void;
  setOnboarded: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      currentView: 'landing',
      previousView: null,
      sidebarOpen: false,
      pendingAgencyCode: null,
      onboarded: false,

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

      setPendingAgencyCode: (code) => set({ pendingAgencyCode: code }),

      setOnboarded: (v: boolean) => set({ onboarded: v }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          currentView: 'landing',
          previousView: null,
          sidebarOpen: false,
          pendingAgencyCode: null,
          onboarded: false,
        });
        // Clear persisted storage AFTER set (persist middleware writes during set)
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('blasti-app');
            localStorage.removeItem('blasti-lang');
            window.location.href = '/';
          }
        }, 100);
      },
    }),
    {
      name: 'blasti-app',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentView: state.user ? state.currentView : 'landing',
        pendingAgencyCode: state.pendingAgencyCode,
        onboarded: state.onboarded,
      }),
    }
  )
);

// Helper to get the persist API for clearing storage
if (useAppStore.persist) {
  useAppStore.persist.clearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('blasti-app');
      localStorage.removeItem('blasti-lang');
    }
  };
}

// Helper to set document direction
export function updateDocumentDirection(lang: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}

// Hash-based navigation helpers
const viewHashMap: Record<ViewName, string> = {
  'landing': '#/',
  'login': '#/login',
  'register': '#/register',
  'customer-home': '#/customer',
  'customer-queue': '#/customer/queue',
  'customer-history': '#/customer/history',
  'customer-notifications': '#/customer/notifications',
  'customer-profile': '#/customer/profile',
  'customer-favorites': '#/customer/favorites',
  'customer-settings': '#/customer/settings',
  'agency-dashboard': '#/agency',
  'agency-settings': '#/agency/settings',
  'agency-employees': '#/agency/employees',
  'agency-profile': '#/agency/profile',
  'agency-reviews': '#/agency/reviews',
  'agency-subscription': '#/agency/subscription',
  'agency-branches': '#/agency/branches',
  'admin-dashboard': '#/admin',
  'admin-transactions': '#/admin/transactions',
  'admin-agencies': '#/admin/agencies',
  'admin-audit': '#/admin/audit',
  'admin-users': '#/admin/users',
  'admin-analytics': '#/admin/analytics',
  'admin-settings': '#/admin/settings',
  'kiosk': '#/kiosk',
};

const hashViewMap: Record<string, ViewName> = Object.fromEntries(
  Object.entries(viewHashMap).map(([view, hash]) => [hash, view as ViewName])
);

export function parseHashToView(hash: string): ViewName | null {
  // Handle #/join/CODE deep link
  const joinMatch = hash.match(/^#\/join\/(.+)$/);
  if (joinMatch) return 'customer-queue';

  // Handle #/kiosk/CODE deep link
  const kioskMatch = hash.match(/^#\/kiosk\/?(.*)$/);
  if (kioskMatch) return 'kiosk';

  // Exact match
  if (hashViewMap[hash]) return hashViewMap[hash];

  // Prefix match (e.g., #/customer/queue -> customer-queue)
  for (const [h, v] of Object.entries(hashViewMap)) {
    if (hash.startsWith(h) && h !== '#/') return v;
  }

  return hash === '#/' || hash === '' || hash === '#' ? 'landing' : null;
}

export function parseJoinCodeFromHash(hash: string): string | null {
  const match = hash.match(/^#\/join\/(.+)$/);
  return match ? match[1] : null;
}

let _suppressHashChange = false;

export function isHashChangeSuppressed(): boolean {
  return _suppressHashChange;
}

export function updateHashForView(view: ViewName): void {
  if (typeof window === 'undefined') return;
  const hash = viewHashMap[view] || '#/';
  _suppressHashChange = true;
  window.location.hash = hash;
  setTimeout(() => { _suppressHashChange = false; }, 50);
}

// Async hydrate from session (no-op placeholder since the store doesn't have real session hydration)
export async function hydrateFromSession(): Promise<void> {
  // Session hydration is handled by the persist middleware rehydration
}

// Set view from hash
export function setViewFromHash(hash: string): void {
  const view = parseHashToView(hash);
  if (view) {
    useAppStore.getState().setView(view);
  }
}
