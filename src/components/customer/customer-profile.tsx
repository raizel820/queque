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
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { Language } from '@/i18n';
import { updateDocumentDirection } from '@/store/use-app-store';

export function CustomerProfile() {
  const { user, setUser, logout, setView } = useAppStore();
  const { t, lang } = useLanguage();

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

  return (
    <div className="px-4 py-4 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-5">{t('profile')}</h1>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{user?.fullName || 'User'}</h2>
                <p className="text-sm text-muted-foreground">@{user?.username || 'user'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('fullName')}:</span>
                <span className="font-medium text-foreground">{user?.fullName || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('username')}:</span>
                <span className="font-medium text-foreground">{user?.username || '-'}</span>
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

      {/* SMS Wallet */}
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
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center mb-4">
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">10</p>
              <p className="text-xs text-muted-foreground mt-1">{t('freeSmsRemaining')}</p>
            </div>
            <p className="text-sm font-medium text-foreground mb-3">{t('smsPackages')}</p>
            <div className="grid grid-cols-3 gap-2">
              {smsPacks.map((pack) => (
                <button
                  key={pack.count}
                  className="p-3 rounded-xl border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors text-center"
                >
                  <div className="flex items-center justify-center mb-1">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{pack.count}</p>
                  <p className="text-[10px] text-muted-foreground">{pack.price} {t('currency')}</p>
                </button>
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

      {/* Theme */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-sm font-medium text-foreground">
                {t('lightMode')}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 font-semibold"
        onClick={() => {
          logout();
          toast.success(t('logout'));
        }}
      >
        <LogOut className="h-4 w-4 me-2" />
        {t('logout')}
      </Button>
    </div>
  );
}
