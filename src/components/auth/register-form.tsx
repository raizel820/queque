'use client';

import { useState, useMemo } from 'react';
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
import { TicketCheck, ArrowLeft, ArrowRight, Loader2, Eye, EyeOff, UserPlus, Shield, Camera, Check, CircleDot } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserRole } from '@/store/use-app-store';

const STEPS = [
  { id: 1, label: 'account', labelKey: 'account' as const },
  { id: 2, label: 'profile', labelKey: 'fullName' as const },
  { id: 3, label: 'confirm', labelKey: 'confirm' as const },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string; bgColor: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, labelKey: 'weak' as const, color: 'bg-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' };
  if (score <= 2) return { score: 40, labelKey: 'fair' as const, color: 'bg-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30' };
  if (score <= 3) return { score: 60, labelKey: 'good' as const, color: 'bg-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
  if (score <= 4) return { score: 80, labelKey: 'strong' as const, color: 'bg-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' };
  return { score: 100, labelKey: 'veryStrong' as const, color: 'bg-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' };
}

export function RegisterForm() {
  const { setUser, setView, goBack } = useAppStore();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
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

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleRegister = async () => {
    // Validation
    if (!username.trim() || !fullName.trim() || !password.trim()) {
      toast.error(t('requiredField'));
      return;
    }

    if (username.trim().length < 3) {
      toast.error(t('usernameMinLength'));
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

  const goToNext = () => {
    if (step === 1) {
      if (!username.trim() || username.trim().length < 3) {
        toast.error(t('usernameMinLength'));
        return;
      }
      if (!password.trim() || password.length < 6) {
        toast.error(t('passwordMinLength'));
        return;
      }
      if (password !== confirmPassword) {
        toast.error(t('passwordMismatch'));
        return;
      }
    }
    if (step < 3) setStep(step + 1);
  };

  const goToPrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const isFocused = focusedField !== null;

  // Floating label component
  const FloatingInput = ({ id, label, type = 'text', value, onChange, onFocus, onBlur, placeholder, dir, prefix, suffix, children, hasToggle, toggleVisible, onToggle }: {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    onBlur: () => void;
    placeholder?: string;
    dir?: string;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    children?: React.ReactNode;
    hasToggle?: boolean;
    toggleVisible?: boolean;
    onToggle?: () => void;
  }) => {
    const isActive = focusedField === id || value.length > 0;
    return (
      <div className="relative space-y-1">
        <div className={`relative flex items-center rounded-xl border transition-all duration-300 ${
          focusedField === id
            ? 'border-emerald-400 ring-2 ring-emerald-500/20 dark:ring-emerald-400/20 bg-white dark:bg-gray-900 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50'
        }`}>
          {prefix && <div className="ps-3.5 flex-shrink-0">{prefix}</div>}
          <div className="relative flex-1">
            <input
              id={id}
              type={type}
              value={value}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={isActive ? placeholder : ' '}
              dir={dir}
              className={`peer h-12 w-full bg-transparent px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground/60 ${prefix ? 'ps-0' : ''} ${hasToggle ? 'pe-10' : ''}`}
              autoComplete={type === 'password' ? 'new-password' : id === 'reg-username' ? 'username' : undefined}
            />
            <label
              htmlFor={id}
              className={`pointer-events-none absolute transition-all duration-200 ease-out ${
                isActive
                  ? 'top-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400'
                  : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground'
              } ${prefix ? 'start-3.5' : 'start-3.5'}`}
            >
              {label}
            </label>
          </div>
          {hasToggle && toggleVisible !== undefined && onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              tabIndex={-1}
            >
              {toggleVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          {suffix && <div className="pe-3.5 flex-shrink-0">{suffix}</div>}
        </div>
      </div>
    );
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  const [direction, setDirection] = useState(0);

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
        <Button variant="ghost" size="icon" onClick={step === 1 ? goBack : goToPrev} className="h-10 w-10">
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
      <div className="flex-1 flex items-center justify-center px-4 py-4 relative z-10">
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

              {/* Step Progress Indicator */}
              <div className="px-6 pb-2">
                <div className="flex items-center justify-between">
                  {STEPS.map((s, idx) => {
                    const stepState = s.id < step ? 'completed' : s.id === step ? 'active' : 'pending';
                    return (
                      <div key={s.id} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <motion.div
                            animate={{
                              scale: stepState === 'active' ? [1, 1.08, 1] : 1,
                              backgroundColor: stepState === 'completed' ? '#10b981' : stepState === 'active' ? '#10b981' : 'transparent',
                            }}
                            transition={stepState === 'active' ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
                            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                              stepState === 'completed'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : stepState === 'active'
                                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {stepState === 'completed' ? (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                                <Check className="h-4 w-4" />
                              </motion.div>
                            ) : (
                              <span className="text-xs font-bold">{s.id}</span>
                            )}
                          </motion.div>
                          <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${
                            stepState === 'active' ? 'text-emerald-600 dark:text-emerald-400' : stepState === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                          }`}>
                            {step === 1 && s.id === 1 ? t('account') || 'Account' :
                             step === 1 && s.id === 2 ? t('fullName') || 'Profile' :
                             step === 1 && s.id === 3 ? t('confirm') || 'Confirm' :
                             step === 2 && s.id === 1 ? t('account') || 'Account' :
                             step === 2 && s.id === 2 ? t('fullName') || 'Profile' :
                             step === 2 && s.id === 3 ? t('confirm') || 'Confirm' :
                             step === 3 && s.id === 1 ? t('account') || 'Account' :
                             step === 3 && s.id === 2 ? t('fullName') || 'Profile' :
                             t('confirm') || 'Confirm'}
                          </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className="flex-1 mx-2 mb-4">
                            <div className={`h-0.5 rounded-full transition-all duration-500 ${
                              s.id < step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                            }`} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <CardContent className="space-y-4 pt-2 max-h-[55vh] overflow-y-auto custom-scrollbar relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    {/* Step 1: Account */}
                    {step === 1 && (
                      <>
                        {/* Avatar Upload Placeholder */}
                        <div className="flex justify-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center border-2 border-dashed border-emerald-300 dark:border-emerald-700 group cursor-pointer"
                          >
                            <Camera className="h-6 w-6 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                            <div className="absolute -bottom-1 -end-1 h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                              <span className="text-[10px] text-white font-bold">+</span>
                            </div>
                          </motion.button>
                        </div>

                        {/* Role Selector */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('selectRole')}</Label>
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

                        <FloatingInput
                          id="reg-username"
                          label={t('username')}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => setFocusedField('username')}
                          onBlur={() => setFocusedField(null)}
                          placeholder={t('username')}
                        />

                        <div className="space-y-1.5">
                          <FloatingInput
                            id="reg-password"
                            label={t('password')}
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            placeholder={t('password')}
                            hasToggle
                            toggleVisible={showPassword}
                            onToggle={() => setShowPassword(!showPassword)}
                          />
                          {/* Password Strength Indicator */}
                          {password.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-1.5 pt-1"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${passwordStrength.score}%` }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${passwordStrength.color}`}
                                  />
                                </div>
                                <span className={`text-[10px] font-semibold min-w-[70px] text-end ${
                                  passwordStrength.score <= 40 ? 'text-red-500' :
                                  passwordStrength.score <= 60 ? 'text-amber-500' :
                                  'text-emerald-500'
                                }`}>
                                  {t(passwordStrength.labelKey)}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <motion.div
                                    key={level}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: level * 0.05 }}
                                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                      level <= passwordStrength.score / 20 ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <FloatingInput
                          id="reg-confirm"
                          label={t('confirmPassword')}
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onFocus={() => setFocusedField('confirm')}
                          onBlur={() => setFocusedField(null)}
                          placeholder={t('confirmPassword')}
                          hasToggle
                          toggleVisible={showConfirm}
                          onToggle={() => setShowConfirm(!showConfirm)}
                        />
                      </>
                    )}

                    {/* Step 2: Profile */}
                    {step === 2 && (
                      <>
                        <FloatingInput
                          id="reg-fullname"
                          label={t('fullName')}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onFocus={() => setFocusedField('fullname')}
                          onBlur={() => setFocusedField(null)}
                          placeholder={t('fullName')}
                        />

                        {/* Phone with Algeria prefix */}
                        <div className="space-y-1.5">
                          <div className="relative flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-all duration-300 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:focus-within:ring-emerald-400/20 focus-within:bg-white dark:focus-within:bg-gray-900">
                            <div className="ps-3.5 flex-shrink-0">
                              <div className="flex items-center h-12 px-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 text-xs text-muted-foreground font-medium" dir="ltr">
                                {t('algeriaPrefix')}
                              </div>
                            </div>
                            <div className="relative flex-1">
                              <input
                                id="reg-phone"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)}
                                placeholder={focusedField === 'phone' || phoneNumber ? '05XX XXX XXX' : ' '}
                                dir="ltr"
                                className="peer h-12 w-full bg-transparent px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground/60"
                              />
                              <label
                                htmlFor="reg-phone"
                                className={`pointer-events-none absolute transition-all duration-200 ease-out ${
                                  focusedField === 'phone' || phoneNumber.length > 0
                                    ? 'top-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400'
                                    : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground'
                                } start-0`}
                              >
                                {t('phoneWithPrefix')}
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Agency code (for staff/owner) */}
                        {(role === 'AGENCY_STAFF' || role === 'AGENCY_OWNER') && (
                          <FloatingInput
                            id="reg-agency-code"
                            label={t('agencyCodeField')}
                            value={agencyCode}
                            onChange={(e) => setAgencyCode(e.target.value)}
                            onFocus={() => setFocusedField('agency-code')}
                            onBlur={() => setFocusedField(null)}
                            placeholder={t('agencyCodePlaceholder')}
                            dir="ltr"
                          />
                        )}

                        {/* Admin secret code */}
                        {role === 'SUPER_ADMIN' && (
                          <>
                            <FloatingInput
                              id="reg-admin-code"
                              label={t('adminSecretCode')}
                              type="password"
                              value={adminCode}
                              onChange={(e) => setAdminCode(e.target.value)}
                              onFocus={() => setFocusedField('admin-code')}
                              onBlur={() => setFocusedField(null)}
                              placeholder="••••••••"
                              dir="ltr"
                            />
                            <p className="text-xs text-muted-foreground">{t('adminCodeDesc')}</p>
                          </>
                        )}
                      </>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 3 && (
                      <>
                        {/* Success Checkmark Animation */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className="flex justify-center mb-4"
                        >
                          <div className="relative">
                            <motion.div
                              animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0.3)', '0 0 0 16px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0)'] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
                            >
                              <CircleDot className="h-9 w-9 text-white" />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Review Card */}
                        <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30">
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('reviewInfo') || 'Review Your Information'}</p>

                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t('username')}</span>
                              <span className="font-semibold text-foreground">{username}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t('fullName')}</span>
                              <span className="font-semibold text-foreground">{fullName}</span>
                            </div>
                            {phoneNumber && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{t('phoneNumber')}</span>
                                <span className="font-semibold text-foreground" dir="ltr">{phoneNumber}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t('selectRole')}</span>
                              <span className="font-semibold text-foreground">
                                {role === 'CUSTOMER' ? t('loginAsCustomer') : role === 'AGENCY_STAFF' ? t('loginAsAgency') : role === 'AGENCY_OWNER' ? t('loginAsAgency') : t('loginAsAdmin')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{t('password')}</span>
                              <span className="font-semibold text-foreground">{'•'.repeat(Math.min(password.length, 10))}</span>
                            </div>
                          </div>
                        </div>

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
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>

              <CardFooter className="flex-col gap-3 pt-2 pb-6">
                {/* Navigation Buttons */}
                <div className="flex gap-3 w-full">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-xl font-semibold text-base"
                      onClick={() => { setDirection(-1); goToPrev(); }}
                    >
                      <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
                      {t('back') || 'Back'}
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.01]"
                      onClick={() => { setDirection(1); goToNext(); }}
                    >
                      {t('next') || 'Next'}
                      <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.01]"
                      onClick={handleRegister}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-5 w-5 me-2" />
                          {t('register')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
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
