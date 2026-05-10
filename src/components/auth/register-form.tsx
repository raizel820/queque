'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { TicketCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { UserRole } from '@/store/use-app-store';

export function RegisterForm() {
  const { setUser, setView, goBack } = useAppStore();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      toast.error(t('requiredField'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    if (password.length < 4) {
      toast.error(t('password'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullName.trim(),
          password,
          phoneNumber: phoneNumber.trim() || undefined,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        toast.success(t('registerSuccess'));
      } else {
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
      {/* Top Bar */}
      <header className="w-full px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TicketCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">QueueWise</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-foreground">
                {t('register')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Role Selector */}
              <div className="space-y-2">
                <Label>{t('selectRole')}</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">{t('loginAsCustomer')}</SelectItem>
                    <SelectItem value="AGENCY_STAFF">{t('loginAsAgency')} (Staff)</SelectItem>
                    <SelectItem value="AGENCY_OWNER">{t('loginAsAgency')} (Owner)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-username">{t('username')}</Label>
                <Input
                  id="reg-username"
                  placeholder={t('username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 text-base"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-fullname">{t('fullName')}</Label>
                <Input
                  id="reg-fullname"
                  placeholder={t('fullName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">{t('password')}</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm">{t('confirmPassword')}</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder={t('confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 text-base"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone">{t('phoneOptional')}</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="05XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-12 text-base"
                  dir="ltr"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-2 pb-6">
              <Button
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-base rounded-xl"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('register')
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t('hasAccount')}{' '}
                <button
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  onClick={() => setView('login')}
                >
                  {t('login')}
                </button>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
