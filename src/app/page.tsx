'use client';

import { useEffect } from 'react';
import { useAppStore, updateDocumentDirection } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { isRTL, type Language } from '@/i18n';

// Auth Views
import { LandingPage } from '@/components/auth/landing-page';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';

// Customer Views
import { CustomerHome } from '@/components/customer/customer-home';
import { CustomerQueue } from '@/components/customer/customer-queue';
import { CustomerHistory } from '@/components/customer/customer-history';
import { CustomerProfile } from '@/components/customer/customer-profile';

// Agency Views
import { AgencyDashboard } from '@/components/agency/agency-dashboard';
import { AgencySettings } from '@/components/agency/agency-settings';
import { AgencyProfile } from '@/components/agency/agency-profile';
import { AgencySubscription } from '@/components/agency/agency-subscription';

// Admin Views
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminTransactions } from '@/components/admin/admin-transactions';
import { AdminAgencies } from '@/components/admin/admin-agencies';

// Shared
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Home as HomeIcon,
  TicketCheck,
  CalendarDays,
  User,
  LayoutDashboard,
  Settings,
  CreditCard,
  Building2,
  FileText,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';

function ViewRouter() {
  const { currentView } = useAppStore();

  switch (currentView) {
    case 'landing':
      return <LandingPage />;
    case 'login':
      return <LoginForm />;
    case 'register':
      return <RegisterForm />;
    case 'customer-home':
      return <CustomerHome />;
    case 'customer-queue':
      return <CustomerQueue />;
    case 'customer-history':
      return <CustomerHistory />;
    case 'customer-profile':
      return <CustomerProfile />;
    case 'agency-dashboard':
      return <AgencyDashboard />;
    case 'agency-settings':
      return <AgencySettings />;
    case 'agency-profile':
      return <AgencyProfile />;
    case 'agency-subscription':
      return <AgencySubscription />;
    case 'admin-dashboard':
      return <AdminDashboard />;
    case 'admin-transactions':
      return <AdminTransactions />;
    case 'admin-agencies':
      return <AdminAgencies />;
    default:
      return <LandingPage />;
  }
}

// Customer Bottom Navigation
function CustomerBottomNav() {
  const { currentView, setView } = useAppStore();
  const { t } = useLanguage();

  const items = [
    { view: 'customer-home' as const, icon: HomeIcon, label: t('home') },
    { view: 'customer-queue' as const, icon: TicketCheck, label: t('myQueue') },
    { view: 'customer-history' as const, icon: CalendarDays, label: t('history') },
    { view: 'customer-profile' as const, icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const active = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors rounded-xl ${
                active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="customer-nav-indicator"
                  className="absolute -top-px w-8 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Agency Sidebar Navigation
function AgencySidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentView, setView, logout, user } = useAppStore();
  const { t } = useLanguage();

  const navItems = [
    { view: 'agency-dashboard' as const, icon: LayoutDashboard, label: t('dashboard') },
    { view: 'agency-settings' as const, icon: Settings, label: t('settings') },
    { view: 'agency-profile' as const, icon: Building2, label: t('agencyProfile') },
    { view: 'agency-subscription' as const, icon: CreditCard, label: t('subscription') },
  ];

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TicketCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">QueueWise</span>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view);
                onClose();
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t('logout')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: isRTL(user?.language ?? 'ar') ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL(user?.language ?? 'ar') ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 z-50 w-72 bg-white dark:bg-gray-950 border-e border-border lg:hidden shadow-xl"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-950 border-e border-border">
        {sidebar}
      </aside>
    </>
  );
}

// Admin Sidebar Navigation
function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentView, setView, logout, user } = useAppStore();
  const { t } = useLanguage();

  const navItems = [
    { view: 'admin-dashboard' as const, icon: LayoutDashboard, label: t('dashboard') },
    { view: 'admin-transactions' as const, icon: CreditCard, label: t('transactions') },
    { view: 'admin-agencies' as const, icon: Building2, label: t('agencies') },
  ];

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">QueueWise Admin</span>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view);
                onClose();
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">Super Admin</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t('logout')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: isRTL(user?.language ?? 'ar') ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL(user?.language ?? 'ar') ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 z-50 w-72 bg-white dark:bg-gray-950 border-e border-border lg:hidden shadow-xl"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-950 border-e border-border">
        {sidebar}
      </aside>
    </>
  );
}

export default function Home() {
  const { user, currentView, sidebarOpen, toggleSidebar } = useAppStore();
  const { lang } = useLanguage();

  // Update document direction on language change
  useEffect(() => {
    updateDocumentDirection(lang);
  }, [lang]);

  // Initialize direction from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('queuewise-lang') as Language | null;
    if (stored) {
      updateDocumentDirection(stored);
    } else {
      updateDocumentDirection('ar');
    }
  }, []);

  const isAuthenticated = !!user;
  const isCustomer = user?.role === 'CUSTOMER';
  const isAgency = user?.role === 'AGENCY_STAFF' || user?.role === 'AGENCY_OWNER';
  const isAdmin = user?.role === 'SUPER_ADMIN';

  // Auth pages render full-screen with their own layouts
  const isAuthPage = currentView === 'landing' || currentView === 'login' || currentView === 'register';

  if (isAuthPage || !isAuthenticated) {
    return (
      <>
        <ViewRouter />
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950" dir={isRTL(lang) ? 'rtl' : 'ltr'}>
      {/* Sidebar for agency/admin */}
      {isAgency && <AgencySidebar open={sidebarOpen} onClose={toggleSidebar} />}
      {isAdmin && <AdminSidebar open={sidebarOpen} onClose={toggleSidebar} />}

      {/* Main Content */}
      <main className={`flex-1 min-w-0 ${isAgency || isAdmin ? 'lg:ms-64' : ''}`}>
        {/* Top bar for agency/admin */}
        {(isAgency || isAdmin) && (
          <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-border flex items-center justify-between px-4">
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 ms-auto">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>
        )}

        {/* Page content */}
        <div className={isCustomer ? '' : ''}>
          <ViewRouter />
        </div>

        {/* Customer bottom nav */}
        {isCustomer && <CustomerBottomNav />}
      </main>

      <Toaster richColors position="top-center" />
    </div>
  );
}
