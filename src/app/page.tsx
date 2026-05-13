'use client';

import { useEffect, useState } from 'react';
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
import { CustomerNotifications } from '@/components/customer/customer-notifications';
import { CustomerFavorites } from '@/components/customer/customer-favorites';

// Agency Views
import { AgencyDashboard } from '@/components/agency/agency-dashboard';
import { AgencySettings } from '@/components/agency/agency-settings';
import { AgencyProfile } from '@/components/agency/agency-profile';
import { AgencySubscription } from '@/components/agency/agency-subscription';

// Admin Views
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminTransactions } from '@/components/admin/admin-transactions';
import { AdminAgencies } from '@/components/admin/admin-agencies';
import { AdminAuditLogs } from '@/components/admin/admin-audit-logs';
import { AdminUsers } from '@/components/admin/admin-users';
import { AdminAnalytics } from '@/components/admin/admin-analytics';

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
  Bell,
  ClipboardList,
  Users,
  Heart,
  BarChart3,
  MoreHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
    case 'customer-notifications':
      return <CustomerNotifications />;
    case 'customer-favorites':
      return <CustomerFavorites />;
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
    case 'admin-audit':
      return <AdminAuditLogs />;
    case 'admin-users':
      return <AdminUsers />;
    case 'admin-analytics':
      return <AdminAnalytics />;
    default:
      return <LandingPage />;
  }
}

// Customer Bottom Navigation — 4 tabs + More Sheet
function CustomerBottomNav() {
  const { currentView, setView, user } = useAppStore();
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!user?.id) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}&unreadOnly=true`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.notifications?.length ?? 0);
        }
      } catch {
        // silent
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    
    // Listen for mark-all-read events from notifications component
    const handleNotificationsRead = () => {
      fetchUnread();
    };
    window.addEventListener('queuewise:notifications-read', handleNotificationsRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('queuewise:notifications-read', handleNotificationsRead);
    };
  }, [user?.id]);

  const mainItems = [
    { view: 'customer-home' as const, icon: HomeIcon, label: t('home') },
    { view: 'customer-queue' as const, icon: TicketCheck, label: t('myQueue') },
    { view: 'customer-history' as const, icon: CalendarDays, label: t('history') },
    { view: 'customer-profile' as const, icon: User, label: t('profile') },
  ];

  const handleMoreNav = (view: 'customer-favorites' | 'customer-notifications' | 'customer-profile') => {
    setMoreOpen(false);
    setView(view);
  };

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl safe-area-bottom">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {mainItems.map((item) => {
            const active = currentView === item.view;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.view}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={() => setView(item.view)}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              >
                {active && (
                  <motion.div
                    layoutId="customer-nav-dot"
                    className="absolute -top-0 h-1 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 transition-all duration-200 ${active ? 'scale-110 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}

          {/* More button with Sheet */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
              >
                <div className="relative">
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -end-2 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{t('more')}</span>
              </motion.button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[65vh] overflow-y-auto">
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
              <SheetHeader>
                <SheetTitle className="sr-only">{t('more')}</SheetTitle>
              </SheetHeader>
              {/* User header */}
              <div className="flex items-center gap-3 px-5 pb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-lg font-bold text-white">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user?.username}</p>
                </div>
              </div>
              <div className="h-px bg-border mx-5" />
              {/* Menu items */}
              <div className="px-3 py-3 space-y-1">
                <button
                  onClick={() => handleMoreNav('customer-favorites')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted dark:hover:bg-gray-800 transition-colors"
                >
                  <Heart className="h-5 w-5 text-rose-500" />
                  <span className="text-sm font-medium text-foreground">{t('favorites')}</span>
                </button>
                <button
                  onClick={() => handleMoreNav('customer-notifications')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted dark:hover:bg-gray-800 transition-colors"
                >
                  <Bell className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">{t('notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="ms-auto h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleMoreNav('customer-profile')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-foreground">{t('settings')}</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
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
          <span className="font-bold text-gradient">QueueWise</span>
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
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="agency-sidebar-active"
                  className="absolute start-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Divider + Footer */}
      <div className="mx-3 border-t border-border" />
      <div className="px-3 py-4 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="relative h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </span>
            <div className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role === 'AGENCY_OWNER' ? t('agencyOwner') : t('agencyStaff')}</p>
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
              className="fixed inset-y-0 z-50 w-72 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-e border-border lg:hidden shadow-xl"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-e border-border">
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
    { view: 'admin-analytics' as const, icon: BarChart3, label: t('analytics') },
    { view: 'admin-transactions' as const, icon: CreditCard, label: t('transactions') },
    { view: 'admin-agencies' as const, icon: Building2, label: t('agencies') },
    { view: 'admin-audit' as const, icon: ClipboardList, label: t('auditLogsPage') },
    { view: 'admin-users' as const, icon: Users, label: t('userManagement') },
  ];

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gradient">QueueWise Admin</span>
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
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="admin-sidebar-active"
                  className="absolute start-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 border-t border-border" />
      <div className="px-3 py-4 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="relative h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <div className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{t('superAdmin')}</p>
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
              className="fixed inset-y-0 z-50 w-72 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-e border-border lg:hidden shadow-xl"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-e border-border">
        {sidebar}
      </aside>
    </>
  );
}

export default function Home() {
  const { user, currentView, sidebarOpen, toggleSidebar } = useAppStore();
 const { t, lang } = useLanguage();
  const [globalAnnouncements, setGlobalAnnouncements] = useState<Array<{ id: string; message: string; type: string; createdAt: string }>>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Fetch global announcements
  useEffect(() => {
    if (!user?.id) return;
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/admin/announcements');
        if (res.ok) {
          const data = await res.json();
          setGlobalAnnouncements(data.announcements ?? []);
        }
      } catch { /* silent */ }
    };
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('queuewise-dismissed-announcements');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Use setTimeout to avoid setState-in-effect lint warning
        setTimeout(() => setDismissedIds(new Set(parsed)), 0);
      }
    } catch { /* silent */ }
  }, []);

  const dismissAnnouncement = (id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('queuewise-dismissed-announcements', JSON.stringify([...next]));
      return next;
    });
  };

  // Dynamic document title based on current view
  useEffect(() => {
    const titles: Record<string, string> = {
      'landing': 'QueueWise - Smart Queue Management',
      'login': t('login') + ' - QueueWise',
      'register': t('register') + ' - QueueWise',
      'customer-home': t('home') + ' - QueueWise',
      'customer-queue': t('myQueue') + ' - QueueWise',
      'customer-history': t('history') + ' - QueueWise',
      'customer-profile': t('profile') + ' - QueueWise',
      'customer-notifications': t('notifications') + ' - QueueWise',
      'customer-favorites': t('favorites') + ' - QueueWise',
      'agency-dashboard': t('dashboard') + ' - QueueWise',
      'agency-settings': t('settings') + ' - QueueWise',
      'agency-profile': t('profile') + ' - QueueWise',
      'agency-subscription': t('subscription') + ' - QueueWise',
      'admin-dashboard': t('dashboard') + ' - QueueWise',
      'admin-transactions': t('transactions') + ' - QueueWise',
      'admin-agencies': t('agencies') + ' - QueueWise',
      'admin-audit': t('auditLogs') + ' - QueueWise',
      'admin-users': t('userManagement') + ' - QueueWise',
      'admin-analytics': t('analytics') + ' - QueueWise',
    };
    document.title = titles[currentView] || 'QueueWise';
  }, [currentView, t]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

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
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ViewRouter />
          </motion.div>
        </AnimatePresence>
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
          <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4">
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 ms-auto">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>
        )}

        {/* Global Announcements Banner */}
        {isAuthenticated && globalAnnouncements.length > 0 && (
          <div className="px-4 pt-3">
            <AnimatePresence>
              {globalAnnouncements
                .filter(a => !dismissedIds.has(a.id))
                .slice(0, 3)
                .map((announcement) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mb-2 last:mb-0"
                  >
                    <div className={`flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm ${
                      announcement.type === 'URGENT'
                        ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200/50 dark:border-rose-800/30'
                        : announcement.type === 'WARNING'
                        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30'
                        : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30'
                    }`}>
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        announcement.type === 'URGENT'
                          ? 'bg-rose-200 dark:bg-rose-900/30'
                          : announcement.type === 'WARNING'
                          ? 'bg-amber-200 dark:bg-amber-900/30'
                          : 'bg-emerald-200 dark:bg-emerald-900/30'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          announcement.type === 'URGENT'
                            ? 'text-rose-600 dark:text-rose-400'
                            : announcement.type === 'WARNING'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">{announcement.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {announcement.type === 'URGENT' ? t('announcementTypeUrgent') : announcement.type === 'WARNING' ? t('announcementTypeWarning') : t('announcementTypeInfo')}
                          {' · '}{new Date(announcement.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissAnnouncement(announcement.id)}
                        className="flex-shrink-0 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        aria-label={t('dismiss')}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}

        {/* Page content */}
        <div className={isCustomer ? 'pb-24' : ''}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ViewRouter />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Customer bottom nav */}
        {isCustomer && <CustomerBottomNav />}
      </main>

      <Toaster richColors position="top-center" />
    </div>
  );
}
