'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useAppStore, updateDocumentDirection, hydrateFromSession, setViewFromHash, parseHashToView, parseJoinCodeFromHash, updateHashForView, isHashChangeSuppressed } from '@/store/use-app-store';
import { Loader2, LogOut } from 'lucide-react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setPendingAgencyCode = useAppStore((state) => state.setPendingAgencyCode);
  const currentView = useAppStore((state) => state.currentView);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Hydrate the Zustand store from the NextAuth session on app startup
  // Note: hydrateFromSession is also called by the persist onRehydrateStorage callback
  // to fix a race condition. We also call it here as a fallback.
  useEffect(() => {
    hydrateFromSession().finally(() => setSessionChecked(true));
  }, [hydrateFromSession]);

  // On initial load, read hash and set the appropriate view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash) {
      const view = parseHashToView(hash);
      if (view) {
        // Handle #/join/CODE deep link
        const joinCode = parseJoinCodeFromHash(hash);
        if (joinCode) {
          setPendingAgencyCode(joinCode);
        }
        // Only set view from hash if it's an auth page (safe without authentication)
        // Protected views will be handled after session hydration
        const authViews = ['landing', 'login', 'register'];
        if (authViews.includes(view) || !isAuthenticated) {
          setViewFromHash(hash);
        }
      }
    } else {
      // No hash — set default hash based on current view
      updateHashForView(currentView);
    }
  }, []);

  // Listen for browser back/forward via hashchange
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      if (isHashChangeSuppressed()) return;

      const hash = window.location.hash;
      if (hash) {
        const view = parseHashToView(hash);
        if (view) {
          const joinCode = parseJoinCodeFromHash(hash);
          if (joinCode) {
            setPendingAgencyCode(joinCode);
          }
          const current = useAppStore.getState().currentView;
          if (view !== current) {
            setViewFromHash(hash);
          }
        }
      } else {
        const current = useAppStore.getState().currentView;
        if (current !== 'landing') {
          setViewFromHash('#/');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setViewFromHash, setPendingAgencyCode]);

  // Global 401 handler — auto-logout on session expiry
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);

      if (response.status === 401) {
        // Session expired — auto-logout
        const store = useAppStore.getState();
        if (store.isAuthenticated) {
          // Import toast dynamically to avoid circular deps
          import('sonner').then(({ toast }) => {
            toast.error(store.user?.language === 'ar' ? 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' : store.user?.language === 'fr' ? 'Session expirée, veuillez vous reconnecter' : 'Session expired, please log in again');
          });
          store.logout();
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Show loading spinner while checking session
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return <SessionProvider>{children}</SessionProvider>;
}
