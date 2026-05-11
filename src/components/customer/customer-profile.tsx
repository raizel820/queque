'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import {
  User,
  Phone,
  MessageSquare,
  CreditCard,
  LogOut,
  Shield,
  Star,
  Check,
  Sun,
  Moon,
  Palette,
  Bell,
  Loader2,
  Trash2,
  AlertTriangle,
  BarChart3,
  Clock,
  Heart,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import type { Language } from '@/i18n';
import { updateDocumentDirection } from '@/store/use-app-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function CustomerProfile() {
  const { user, setUser, logout, setView } = useAppStore();
  const { t, lang } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [savingPhone, setSavingPhone] = useState(false);

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    queue_called: true,
    turn_approaching: true,
    completed: true,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Queue stats state
  const [queueStats, setQueueStats] = useState<{
    totalQueues: number;
    thisMonth: number;
    avgWaitTime: number;
    favoriteAgency: { name: string; nameAr?: string; nameFr?: string } | null;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const handleLanguageChange = (newLang: string) => {
    const langTyped = newLang as Language;
    updateDocumentDirection(langTyped);
    if (user) {
      setUser({ ...user, language: langTyped });
    }
  };

  // Fetch user profile data (notification prefs, phone, SMS count)
  const [smsCount, setSmsCount] = useState(user?.freeSmsCount ?? 10);

  const fetchProfile = async () => {
    if (!user?.id) return;
    setNotifLoading(true);
    try {
      const res = await fetch(`/api/user/profile?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notificationPreferences) {
          setNotifPrefs(typeof data.notificationPreferences === 'string'
            ? JSON.parse(data.notificationPreferences)
            : data.notificationPreferences);
        }
        if (data.phoneNumber) {
          setPhoneNumber(data.phoneNumber);
        }
        if (data.freeSmsCount !== undefined) {
          setSmsCount(data.freeSmsCount);
        }
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!user?.id) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/user/stats?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setQueueStats(data);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setStatsLoading(false);
    }
  };

  const saveNotifPrefs = async () => {
    if (!user?.id) return;
    setNotifSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, preferences: notifPrefs }),
      });
      if (res.ok) {
        toast.success(t('success'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setNotifSaving(false);
    }
  };

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) return;
    if (!user) return;
    setSavingPhone(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phoneNumber: phoneNumber.trim() }),
      });
      if (res.ok) {
        toast.success(t('success'));
        // Update local state
        if (user) setUser({ ...user, phoneNumber: phoneNumber.trim() });
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setSavingPhone(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        toast.success(t('accountDeleted'));
        setDeleteDialogOpen(false);
        logout();
      } else {
        const data = await res.json();
        toast.error(data.error || t('deleteAccountError'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmText('');
    }
  };

  const smsPacks = [
    { count: 20, price: 200 },
    { count: 50, price: 400 },
    { count: 100, price: 700 },
  ];

  const getInitials = () => {
    if (!user?.fullName) return 'U';
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  const smsRemaining = smsCount;
  const smsMax = Math.max(smsCount, 50);
  const smsPercent = Math.min(100, (smsRemaining / smsMax) * 100);

  if (notifLoading) {
    return (
      <div className="px-4 py-4 pb-24">
        <Skeleton className="h-8 w-32 mb-5 animate-pulse" />
        {/* Skeleton User Info Card */}
        <div className="border-0 shadow-sm mb-4 overflow-hidden bg-white dark:bg-gray-900/80 rounded-xl">
          <Skeleton className="h-20 w-full animate-pulse" />
          <div className="p-5 -mt-10 relative">
            <div className="flex items-end gap-4 mb-4">
              <Skeleton className="h-16 w-16 rounded-full animate-pulse flex-shrink-0" />
              <div className="pb-1 space-y-2">
                <Skeleton className="h-5 w-28 animate-pulse" />
                <Skeleton className="h-4 w-20 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-8 w-full animate-pulse" />
              <Skeleton className="h-8 w-full animate-pulse" />
            </div>
          </div>
        </div>
        {/* Skeleton Notification Preferences Card */}
        <div className="border-0 shadow-sm mb-4 bg-white dark:bg-gray-900/80 rounded-xl">
          <div className="pb-3 pt-5 px-5">
            <Skeleton className="h-5 w-32 mb-2 animate-pulse" />
          </div>
          <div className="pt-0 px-5 pb-5 space-y-4">
            <Skeleton className="h-4 w-48 animate-pulse" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 animate-pulse" />
                  <Skeleton className="h-5 w-10 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Skeleton Phone Number Card */}
        <div className="border-0 shadow-sm mb-4 bg-white dark:bg-gray-900/80 rounded-xl">
          <div className="pb-3 pt-5 px-5">
            <Skeleton className="h-5 w-28 animate-pulse" />
          </div>
          <div className="pt-0 px-5 pb-5">
            <div className="flex gap-2">
              <Skeleton className="h-11 flex-1 animate-pulse" />
              <Skeleton className="h-11 w-12 animate-pulse" />
            </div>
          </div>
        </div>
        {/* Skeleton SMS Wallet Card */}
        <div className="border-0 shadow-sm mb-4 bg-white dark:bg-gray-900/80 rounded-xl">
          <div className="pb-3 pt-5 px-5">
            <Skeleton className="h-5 w-28 animate-pulse" />
          </div>
          <div className="pt-0 px-5 pb-5 space-y-3">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Skeleton className="h-8 w-16 animate-pulse" />
                  <Skeleton className="h-3 w-32 mt-1.5 animate-pulse" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
              </div>
              <Skeleton className="h-2 w-full rounded-full animate-pulse" />
            </div>
            <Skeleton className="h-4 w-24 animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-5">{t('profile')}</h1>

      {/* My Queue Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-sm mb-4 overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-600/5 backdrop-blur-xl dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-emerald-800/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              {t('myStats')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : queueStats ? (
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] text-muted-foreground">{t('totalQueuesJoined')}</span>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-bold text-foreground"
                  >
                    {queueStats.totalQueues}
                  </motion.p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] text-muted-foreground">{t('avgWaitTimeExperienced')}</span>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-bold text-foreground"
                  >
                    ~{queueStats.avgWaitTime} {t('min')}
                  </motion.p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Heart className="h-3.5 w-3.5 text-rose-500" />
                    <span className="text-[10px] text-muted-foreground">{t('favoriteAgencyStat')}</span>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-bold text-foreground truncate"
                  >
                    {queueStats.favoriteAgency
                      ? (lang === 'ar' && queueStats.favoriteAgency.nameAr
                          ? queueStats.favoriteAgency.nameAr
                          : lang === 'fr' && queueStats.favoriteAgency.nameFr
                            ? queueStats.favoriteAgency.nameFr
                            : queueStats.favoriteAgency.name)
                      : '—'}
                  </motion.p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[10px] text-muted-foreground">{t('thisMonth')}</span>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-bold text-foreground"
                  >
                    {queueStats.thisMonth}
                  </motion.p>
                </motion.div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* User Info Card with gradient avatar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm mb-4 overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          {/* Top gradient banner */}
          <div className="h-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 relative" />
          <CardContent className="p-5 -mt-10 relative">
            <div className="flex items-end gap-4 mb-4">
              {/* Gradient Avatar Circle */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-600 flex items-center justify-center text-white text-xl font-bold ring-4 ring-white dark:ring-gray-900 shadow-lg flex-shrink-0"
              >
                {getInitials()}
              </motion.div>
              <div className="pb-1">
                <h2 className="text-lg font-bold text-foreground">{user?.fullName || 'User'}</h2>
                <p className="text-sm text-muted-foreground">@{user?.username || 'user'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-muted-foreground">{t('fullName')}:</span>
                <span className="font-medium text-foreground ms-auto">{user?.fullName || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-muted-foreground">{t('username')}:</span>
                <span className="font-medium text-foreground ms-auto">{user?.username || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-sm mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-600" />
              {t('notifPrefs')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-4">{t('notifPrefsDesc')}</p>
            <div className="space-y-4">
              {[
                { key: 'queue_called' as const, label: t('queueCalledNotif') },
                { key: 'turn_approaching' as const, label: t('turnApproachingNotif') },
                { key: 'completed' as const, label: t('completedNotif') },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <Label className="text-sm text-foreground">{item.label}</Label>
                  <Switch
                    checked={notifPrefs[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifPrefs((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
            <Button
              size="sm"
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10"
              onClick={saveNotifPrefs}
              disabled={notifSaving || notifLoading}
            >
              {notifSaving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Check className="h-4 w-4 me-2" />}
              {t('save')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Phone Number */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-sm mb-4 bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-600" />
              {t('phoneNumber')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="05XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-11"
                dir="ltr"
              />
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                onClick={handleSavePhone}
                disabled={savingPhone}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SMS Wallet with visual progress indicator */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm mb-4 bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              {t('smsWallet')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{smsRemaining}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('freeSmsRemaining')}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              {/* Visual progress bar */}
              <div className="h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${smsPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-end">{smsRemaining}/{smsMax}</p>
            </div>
            <p className="text-sm font-medium text-foreground mb-3">{t('smsPackages')}</p>
            <div className="grid grid-cols-3 gap-2">
              {smsPacks.map((pack) => (
                <div
                  key={pack.count}
                  className="relative p-3 rounded-xl border border-border cursor-not-allowed opacity-75 text-center"
                >
                  <div className="flex items-center justify-center mb-1">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{pack.count}</p>
                  <p className="text-[10px] text-muted-foreground">{pack.price} {t('currency')}</p>
                  <span className="absolute top-1.5 end-1.5 text-[9px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                    {t('comingSoon')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language Preference */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-sm mb-4 bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LanguageSwitcher />
              {t('language')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value={lang} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance / Theme Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm mb-4 bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-emerald-600" />
              {t('appearance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">{t('appearanceDesc')}</p>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  theme !== 'dark'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-border hover:border-emerald-200'
                }`}
              >
                <Sun className="h-5 w-5 mx-auto mb-1.5 text-amber-500" />
                <span className="text-xs font-medium">{t('lightMode')}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-border hover:border-emerald-200'
                }`}
              >
                <Moon className="h-5 w-5 mx-auto mb-1.5 text-slate-400" />
                <span className="text-xs font-medium">{t('darkMode')}</span>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator className="my-5" />

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 font-semibold transition-all duration-200 hover:scale-[1.01] mb-3"
          onClick={() => {
            logout();
            toast.success(t('logout'));
          }}
        >
          <LogOut className="h-4 w-4 me-2" />
          {t('logout')}
        </Button>
      </motion.div>

      {/* Delete Account */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmText(''); }}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-11 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium text-sm transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 me-2" />
              {t('deleteAccount')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                {t('deleteAccount')}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>{t('deleteAccountDesc')}</p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ {t('deleteAccountWarning')}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t('typeDeleteToConfirm')}</p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={lang === 'ar' ? 'حذف' : lang === 'fr' ? 'supprimer' : 'delete'}
                    className="h-10"
                    dir="ltr"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
              <AlertDialogCancel className="w-full rounded-xl h-10">
                {t('cancel')}
              </AlertDialogCancel>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== (lang === 'ar' ? 'حذف' : lang === 'fr' ? 'supprimer' : 'delete')}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-10"
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Trash2 className="h-4 w-4 me-2" />}
                {t('deleteAccount')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
