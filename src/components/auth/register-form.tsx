'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { TicketCheck, ArrowLeft, Loader2, Eye, EyeOff, UserPlus, Shield } from 'lucide-react';
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
  const [agencyCode, setAgencyCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    // Validation
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      toast.error(t('requiredField'));
      return;
    }

    if (username.trim().length < 3) {
      toast.error(t('username') + ' - min 3');
      return;
    }

    if (password.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    if (!agreeTerms) {
      toast.error(t('mustAgreeTerms'));
      return;
    }

    if (role === 'SUPER_ADMIN' && !adminCode.trim()) {
      toast.error(t('adminSecretCode'));
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {
        username: username.trim(),
        fullName: fullName.trim(),
        password,
        role,
      };

      if (phoneNumber.trim()) {
        body.phoneNumber = phoneNumber.trim();
      }
      if (agencyCode.trim() && (role === 'AGENCY_STAFF' || role === 'AGENCY_OWNER')) {
        body.agencyCode = agencyCode.trim().toUpperCase();
      }
      if (role === 'SUPER_ADMIN') {
        body.adminCode = adminCode.trim();
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const isFocused = focusedField !== null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute bottom-1/4 start-1/3 w-72 h-72 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-3xl" />
        <div className="absolute top-0 end-1/4 w-64 h-64 bg-teal-200/20 dark:bg-teal-800/10 rounded-full blur-3xl" />
      </div>

      {/* Top Bar */}
      <header className="w-full px-4 py-3 flex items-center justify-between relative z-10">
        <Button variant="ghost" size="icon" onClick={goBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
          >
            <TicketCheck className="h-4 w-4 text-white" />
          </motion.div>
          <span className="font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            QueueWise
          </span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Register Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className={`relative transition-all duration-700 ${isFocused ? 'scale-[1.01]' : ''}`}>
            <div
              className={`absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-500/10 dark:to-teal-500/10 blur-xl transition-opacity duration-700 ${isFocused ? 'opacity-100' : 'opacity-0'}`}
            />
            <Card className="relative shadow-xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
              <CardHeader className="text-center pb-2">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                  className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
                >
                  <UserPlus className="h-7 w-7 text-white" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {t('register')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Role Selector */}
                <div className="space-y-2">
                  <Label>{t('selectRole')}</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">{t('loginAsCustomer')}</SelectItem>
                      <SelectItem value="AGENCY_STAFF">{t('loginAsAgency')} ({t('staffRole')})</SelectItem>
                      <SelectItem value="AGENCY_OWNER">{t('loginAsAgency')} ({t('ownerRole')})</SelectItem>
                      <SelectItem value="SUPER_ADMIN">
                        <span className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5" />
                          {t('loginAsAdmin')}
                        </span>
                      </SelectItem>
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
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
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
                    onFocus={() => setFocusedField('fullname')}
                    onBlur={() => setFocusedField(null)}
                    className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>

                {/* Phone with Algeria prefix */}
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">{t('phoneWithPrefix')}</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center h-12 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-muted-foreground flex-shrink-0" dir="ltr">
                      {t('algeriaPrefix')}
                    </div>
                    <Input
                      id="reg-phone"
                      type="tel"
                      placeholder="05XX XXX XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">{t('password')}</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 text-base pe-12 transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">{t('confirmPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder={t('confirmPassword')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 text-base pe-12 transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Agency code (for staff/owner) */}
                {(role === 'AGENCY_STAFF' || role === 'AGENCY_OWNER') && (
                  <div className="space-y-2">
                    <Label htmlFor="reg-agency-code">{t('agencyCodeField')}</Label>
                    <Input
                      id="reg-agency-code"
                      placeholder={t('agencyCodePlaceholder')}
                      value={agencyCode}
                      onChange={(e) => setAgencyCode(e.target.value)}
                      onFocus={() => setFocusedField('agency-code')}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">{t('agencyCodeFieldDesc')}</p>
                  </div>
                )}

                {/* Admin secret code */}
                {role === 'SUPER_ADMIN' && (
                  <div className="space-y-2">
                    <Label htmlFor="reg-admin-code">{t('adminSecretCode')}</Label>
                    <Input
                      id="reg-admin-code"
                      type="password"
                      placeholder="••••••••"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      onFocus={() => setFocusedField('admin-code')}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">{t('adminCodeDesc')}</p>
                  </div>
                )}

                {/* Terms checkbox */}
                <div className="flex items-start gap-3 pt-1">
                  <Checkbox
                    id="reg-terms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="reg-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    {t('agreeTerms')}{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t('termsOfService')}</span>{' '}
                    {t('andStr')}{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t('privacyPolicy')}</span>
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 pt-2 pb-6">
                <Button
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.01]"
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
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline underline-offset-2 transition-all"
                    onClick={() => setView('login')}
                  >
                    {t('login')}
                  </button>
                </p>
              </CardFooter>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
