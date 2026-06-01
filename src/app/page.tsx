'use client';

import { useEffect, useState } from 'react';
import { useAppStore, updateDocumentDirection } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { isRTL, type Language } from '@/i18n';
import { getProxiedUrl } from '@/lib/utils';

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
import { CustomerSettings } from '@/components/customer/customer-settings';

// Agency Views
import { AgencyDashboard } from '@/components/agency/agency-dashboard';
import { AgencySettings } from '@/components/agency/agency-settings';
import { AgencyProfile } from '@/components/agency/agency-profile';
import { AgencySubscription } from '@/components/agency/agency-subscription';
import { AgencyReviews } from '@/components/agency/agency-reviews';
import { AgencyEmployees } from '@/components/agency/agency-employees';
import { AgencyBranches } from '@/components/agency/agency-branches';

// Kiosk Views
import { KioskLanding } from '@/components/kiosk/kiosk-landing';
import { KioskMode } from '@/components/kiosk/kiosk-mode';

// Admin Views
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminTransactions } from '@/components/admin/admin-transactions';
import { AdminAgencies } from '@/components/admin/admin-agencies';
import { AdminAuditLogs } from '@/components/admin/admin-audit-logs';
import { AdminUsers } from '@/components/admin/admin-users';
import { AdminAnalytics } from '@/components/admin/admin-analytics';
import { AdminSettings } from '@/components/admin/admin-settings';

// Shared
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { OnboardingWizard } from '@/components/shared/onboarding-wizard';
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
  Star,
  KeyRound,
  Loader2,
  UserCog,
  Settings2,
  GitBranch,
  Monitor,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    case 'customer-settings':
      return <CustomerSettings />;
    case 'agency-dashboard':
      return <AgencyDashboard />;
    case 'agency-settings':
      return <AgencySettings />;
    case 'agency-profile':
      return <AgencyProfile />;
    case 'agency-subscription':
      return <AgencySubscription />;
    case 'agency-reviews':
      return <AgencyReviews />;
    case 'agency-employees':
      return <AgencyEmployees />;
    case 'agency-branches':
      return <AgencyBranches />;
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
    case 'admin-settings':
      return <AdminSettings />;
    case 'kiosk':
      return <KioskLanding />;
    default:
      return <LandingPage />;
  }
}

// Customer Bottom Navigation — 4 tabs + More Sheet
function CustomerBottomNav() {
  const { currentView, setView, user, logout } = useAppStore();
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
    window.addEventListener('blasti:notifications-read', handleNotificationsRead);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('blasti:notifications-read', handleNotificationsRead);
    };
  }, [user?.id]);

  const mainItems = [
    { view: 'customer-home' as const, icon: HomeIcon, label: t('home') },
    { view: 'customer-queue' as const, icon: TicketCheck, label: t('myQueue') },
    { view: 'customer-history' as const, icon: CalendarDays, label: t('history') },
    { view: 'customer-profile' as const, icon: User, label: t('profile') },
  ];

  const handleMoreNav = (view: 'customer-favorites' | 'customer-notifications' | 'customer-settings') => {
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
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={getProxiedUrl(user.avatarUrl)} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
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
                  onClick={() => handleMoreNav('customer-settings')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-foreground">{t('settings')}</span>
                </button>
                <div className="h-px bg-border mx-3 my-1" />
                <button
                  onClick={() => { logout(); setMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <LogOut className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">{t('logout')}</span>
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
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [cpCurrentPwd, setCpCurrentPwd] = useState('');
  const [cpNewPwd, setCpNewPwd] = useState('');
  const [cpConfirmPwd, setCpConfirmPwd] = useState('');
  const [cpLoading, setCpLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!cpCurrentPwd || !cpNewPwd || !cpConfirmPwd) {
      toast.error(t('requiredField'));
      return;
    }
    if (cpNewPwd.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }
    if (cpNewPwd !== cpConfirmPwd) {
      toast.error(t('passwordMismatch'));
      return;
    }
    setCpLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: cpCurrentPwd,
          newPassword: cpNewPwd,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t('passwordChanged'));
        setChangePasswordOpen(false);
        setCpCurrentPwd('');
        setCpNewPwd('');
        setCpConfirmPwd('');
      } else {
        toast.error(data.error === 'Current password is incorrect' ? t('wrongCurrentPassword') : (data.error || t('error')));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setCpLoading(false);
    }
  };

  const navItems = [
    { view: 'agency-dashboard' as const, icon: LayoutDashboard, label: t('dashboard') },
    { view: 'agency-employees' as const, icon: UserCog, label: t('employeeManagement') },
    { view: 'agency-branches' as const, icon: GitBranch, label: t('branchesCounters') },
    { view: 'agency-reviews' as const, icon: Star, label: t('reviewsPage') },
    { view: 'agency-settings' as const, icon: Settings, label: t('settings') },
    { view: 'agency-profile' as const, icon: Building2, label: t('agencyProfile') },
    { view: 'agency-subscription' as const, icon: CreditCard, label: t('subscription') },
  ];

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 rounded-xl overflow-hidden">
            <img src="/logo.png" alt="BLASTI" className="h-full w-full object-contain" />
          </div>
          <span className="font-bold text-gradient">BLASTI</span>
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
          <div className="relative h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={getProxiedUrl(user.avatarUrl)} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            )}
            <div className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role === 'AGENCY_OWNER' ? t('agencyOwner') : t('agencyStaff')}</p>
          </div>
        </div>
        {/* Change Password - shown for all agency users */}
        <button
          onClick={() => setChangePasswordOpen(true)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <KeyRound className="h-5 w-5" />
          {t('changePassword')}
        </button>
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

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={(open) => { setChangePasswordOpen(open); if (!open) { setCpCurrentPwd(''); setCpNewPwd(''); setCpConfirmPwd(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-500" />
              {t('changePassword')}
            </DialogTitle>
            <DialogDescription>{t('changePassword')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('currentPassword')}</Label>
              <Input
                type="password"
                value={cpCurrentPwd}
                onChange={(e) => setCpCurrentPwd(e.target.value)}
                placeholder={t('currentPassword')}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('newPassword')}</Label>
              <Input
                type="password"
                value={cpNewPwd}
                onChange={(e) => setCpNewPwd(e.target.value)}
                placeholder={t('newPassword')}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('confirmNewPassword')}</Label>
              <Input
                type="password"
                value={cpConfirmPwd}
                onChange={(e) => setCpConfirmPwd(e.target.value)}
                placeholder={t('confirmNewPassword')}
                className="h-11"
                onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(); }}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleChangePassword}
              disabled={cpLoading || !cpCurrentPwd || !cpNewPwd || !cpConfirmPwd}
            >
              {cpLoading ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <KeyRound className="h-4 w-4 me-1" />}
              {t('changePassword')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
    { view: 'admin-settings' as const, icon: Settings, label: t('platformSettings') },
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
          <div className="h-12 w-12 rounded-xl overflow-hidden">
            <img src="/logo.png" alt="BLASTI" className="h-full w-full object-contain" />
          </div>
          <span className="font-bold text-gradient">BLASTI Admin</span>
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
          <div className="relative h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={getProxiedUrl(user.avatarUrl)} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            )}
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
  const { user, currentView, sidebarOpen, toggleSidebar, setView, setPendingAgencyCode, pendingAgencyCode, onboarded, setOnboarded } = useAppStore();
 const { t, lang } = useLanguage();
  const [globalAnnouncements, setGlobalAnnouncements] = useState<Array<{ id: string; message: string; type: string; createdAt: string }>>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Listen for onboarding trigger from register form
  useEffect(() => {
    const handleShowOnboarding = () => setShowOnboarding(true);
    window.addEventListener('blasti:show-onboarding', handleShowOnboarding);
    return () => window.removeEventListener('blasti:show-onboarding', handleShowOnboarding);
  }, []);

  // Show onboarding for first-time logins (check localStorage key: blasti-show-onboarding)
  useEffect(() => {
    if (user?.id && !onboarded) {
      try {
        const dismissed = localStorage.getItem('blasti-show-onboarding');
        if (dismissed !== 'true') {
          // Use setTimeout to avoid synchronous state update during render
          setTimeout(() => setShowOnboarding(true), 800);
        }
      } catch { /* silent */ }
    }
  }, [user?.id, onboarded]);

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
      const stored = localStorage.getItem('blasti-dismissed-announcements');
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
      localStorage.setItem('blasti-dismissed-announcements', JSON.stringify([...next]));
      return next;
    });
  };

  // Dynamic document title based on current view
  useEffect(() => {
    const titles: Record<string, string> = {
      'landing': 'BLASTI - Smart Queue Management',
      'login': t('login') + ' - BLASTI',
      'register': t('register') + ' - BLASTI',
      'customer-home': t('home') + ' - BLASTI',
      'customer-queue': t('myQueue') + ' - BLASTI',
      'customer-history': t('history') + ' - BLASTI',
      'customer-profile': t('profile') + ' - BLASTI',
      'customer-notifications': t('notifications') + ' - BLASTI',
      'customer-favorites': t('favorites') + ' - BLASTI',
      'agency-dashboard': t('dashboard') + ' - BLASTI',
      'agency-settings': t('settings') + ' - BLASTI',
      'agency-profile': t('profile') + ' - BLASTI',
      'agency-subscription': t('subscription') + ' - BLASTI',
      'admin-dashboard': t('dashboard') + ' - BLASTI',
      'admin-transactions': t('transactions') + ' - BLASTI',
      'admin-agencies': t('agencies') + ' - BLASTI',
      'admin-audit': t('auditLogs') + ' - BLASTI',
      'admin-users': t('userManagement') + ' - BLASTI',
      'admin-analytics': t('analytics') + ' - BLASTI',
    'admin-settings': t('platformSettings') + ' - BLASTI',
    };
    document.title = titles[currentView] || 'BLASTI';
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
    const stored = localStorage.getItem('blasti-lang') as Language | null;
    if (stored) {
      updateDocumentDirection(stored);
    } else {
      updateDocumentDirection('ar');
    }

    // Validate persisted session — if user exists in store but session is expired, clear it
    if (isAuthenticated && user) {
      fetch('/api/auth/session').then(res => {
        if (!res.ok || res.status === 401) {
          // Session expired — clear persisted state
          logout();
        }
      }).catch(() => {
        // Network error — don't clear (might be offline)
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle deep links: ?code=CLINIC01, ?kiosk=true&code=AGENCY_CODE, ?mode=kiosk
  const [kioskFullMode, setKioskFullMode] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const kiosk = params.get('kiosk');
    const mode = params.get('mode');
    if (mode === 'kiosk') {
      // Full kiosk mode - standalone self-service terminal
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setKioskFullMode(true);
        setView('kiosk');
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (kiosk === 'true' && code) {
      setPendingAgencyCode(code);
      setView('kiosk');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (code) {
      setPendingAgencyCode(code);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setPendingAgencyCode, setView]);

  // When user is authenticated as customer and has pending agency code, navigate to customer-home
  // The customer-home component will pick up the code and auto-fetch agency detail
  useEffect(() => {
    if (user?.role === 'CUSTOMER' && pendingAgencyCode && currentView !== 'customer-home') {
      setView('customer-home');
    }
  }, [user?.role, pendingAgencyCode, currentView, setView]);

  const isAuthenticated = !!user;
  const isCustomer = user?.role === 'CUSTOMER';
  const isAgency = user?.role === 'AGENCY_STAFF' || user?.role === 'AGENCY_OWNER';
  const isAdmin = user?.role === 'SUPER_ADMIN';

  // Auth pages render full-screen with their own layouts
  const isAuthPage = currentView === 'landing' || currentView === 'login' || currentView === 'register';

  // Kiosk mode renders full-screen without any chrome
  const isKioskMode = currentView === 'kiosk';

  if (isKioskMode) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key={kioskFullMode ? 'kiosk-full' : 'kiosk'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {kioskFullMode ? <KioskMode /> : <KioskLanding />}
          </motion.div>
        </AnimatePresence>
      </>
    );
  }

  // Safety: if not authenticated but on a protected view, redirect to landing
  // This handles stale Zustand persisted state after page reload
  if (!isAuthenticated && !isAuthPage) {
    // Use setTimeout to avoid setState during render
    setTimeout(() => setView('landing'), 0);
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <LandingPage />
          </motion.div>
        </AnimatePresence>
        <Toaster richColors position="top-center" />
      </>
    );
  }

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

        {/* Top bar for customer - language & theme controls */}
        {isCustomer && (
          <header className="sticky top-0 z-30 h-12 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-border flex items-center justify-end px-4">
            <div className="flex items-center gap-2">
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
        <div className={isCustomer ? 'pt-2' : ''}>
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

      {/* Onboarding Wizard */}
      {showOnboarding && user && (
        <OnboardingWizard
          open={showOnboarding}
          user={user}
          onComplete={async (prefs) => {
            try {
              const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...(prefs.language ? { language: prefs.language } : {}),
                  ...(prefs.reminderMinutes != null ? { reminderMinutes: prefs.reminderMinutes } : {}),
                  ...(prefs.smsNotificationsEnabled != null ? { smsNotificationsEnabled: prefs.smsNotificationsEnabled } : {}),
                }),
              });
              if (res.ok) {
                toast.success(t('preferencesSaved'));
              }
            } catch {
              // silent
            }
            setOnboarded(true);
            try { localStorage.setItem('blasti-show-onboarding', 'true'); } catch { /* silent */ }
            setShowOnboarding(false);
          }}
          onSkip={() => {
            setShowOnboarding(false);
            setOnboarded(true);
            try { localStorage.setItem('blasti-show-onboarding', 'true'); } catch { /* silent */ }
            toast.info(t('onboardingSkipped'));
          }}
        />
      )}
    </div>
  );
}
