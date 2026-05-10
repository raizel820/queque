'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import type { Language } from '@/i18n';
import { updateDocumentDirection } from '@/store/use-app-store';

export function CustomerProfile() {
  const { user, setUser, logout, setView } = useAppStore();
  const { t, lang } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [phoneNumber, setPhoneNumber] = useState(user?.username === 'demo' ? '' : '');
  const [savingPhone, setSavingPhone] = useState(false);

  const handleLanguageChange = (newLang: string) => {
    const langTyped = newLang as Language;
    updateDocumentDirection(langTyped);
    if (user) {
      setUser({ ...user, language: langTyped });
    }
  };

  const handleSavePhone = async () => {
    if (!phoneNumber.trim()) return;
    setSavingPhone(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      if (res.ok) {
        toast.success(t('success'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setSavingPhone(false);
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

  const smsRemaining = 10;
  const smsMax = 50;
  const smsPercent = Math.min(100, (smsRemaining / smsMax) * 100);

  return (
    <div className="px-4 py-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-5">{t('profile')}</h1>

      {/* User Info Card with gradient avatar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm mb-4 overflow-hidden">
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

      {/* Phone Number */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 shadow-sm mb-4">
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
        <Card className="border-0 shadow-sm mb-4">
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
                <motion.button
                  key={pack.count}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="p-3 rounded-xl border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors text-center"
                >
                  <div className="flex items-center justify-center mb-1">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{pack.count}</p>
                  <p className="text-[10px] text-muted-foreground">{pack.price} {t('currency')}</p>
                </motion.button>
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
        <Card className="border-0 shadow-sm mb-4">
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
        <Card className="border-0 shadow-sm mb-4">
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
                <Moon className="h-5 w-5 mx-auto mb-1.5 text-indigo-400" />
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
          className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 font-semibold transition-all duration-200 hover:scale-[1.01]"
          onClick={() => {
            logout();
            toast.success(t('logout'));
          }}
        >
          <LogOut className="h-4 w-4 me-2" />
          {t('logout')}
        </Button>
      </motion.div>
    </div>
  );
}
