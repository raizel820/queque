'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { TicketCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { UserRole } from '@/store/use-app-store';

export function LoginForm() {
  const { setUser, setView, goBack } = useAppStore();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleTab, setRoleTab] = useState<string>('customer');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error(t('requiredField'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setUser(data.user);
        toast.success(t('loginSuccess'));
      } else {
        toast.error(data.error || t('invalidCredentials'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  const getRoleFromTab = (tab: string): UserRole => {
    switch (tab) {
      case 'agency': return 'AGENCY_OWNER';
      case 'admin': return 'SUPER_ADMIN';
      default: return 'CUSTOMER';
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

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-foreground">
                {t('login')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Role Tabs (demo) */}
              <Tabs value={roleTab} onValueChange={setRoleTab} className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-11">
                  <TabsTrigger value="customer" className="text-xs sm:text-sm">
                    {t('loginAsCustomer')}
                  </TabsTrigger>
                  <TabsTrigger value="agency" className="text-xs sm:text-sm">
                    {t('loginAsAgency')}
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="text-xs sm:text-sm">
                    {t('loginAsAdmin')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('username')}</Label>
                  <Input
                    id="username"
                    placeholder={t('username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-12 text-base"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-12 text-base"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-2 pb-6">
              <Button
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-base rounded-xl"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('login')
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t('noAccount')}{' '}
                <button
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  onClick={() => {
                    // Pass hint role
                    setView('register');
                  }}
                >
                  {t('register')}
                </button>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
