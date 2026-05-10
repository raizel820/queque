'use client';

import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { motion } from 'framer-motion';
import {
  Clock,
  Wifi,
  Bell,
  Smartphone,
  ArrowRight,
  Search,
  TicketCheck,
  BellRing,
  Building2,
  Users,
  MapPin,
  Zap,
} from 'lucide-react';

export function LandingPage() {
  const { setView } = useAppStore();
  const { t } = useLanguage();

  const features = [
    { icon: Clock, titleKey: 'feature1Title' as const, descKey: 'feature1Desc' as const },
    { icon: Wifi, titleKey: 'feature2Title' as const, descKey: 'feature2Desc' as const },
    { icon: Bell, titleKey: 'feature3Title' as const, descKey: 'feature3Desc' as const },
    { icon: Smartphone, titleKey: 'feature4Title' as const, descKey: 'feature4Desc' as const },
  ];

  const steps = [
    { icon: Search, titleKey: 'step1' as const, descKey: 'step1Desc' as const },
    { icon: TicketCheck, titleKey: 'step2' as const, descKey: 'step2Desc' as const },
    { icon: BellRing, titleKey: 'step3' as const, descKey: 'step3Desc' as const },
  ];

  const stats = [
    { icon: Building2, value: '10+', labelKey: 'landingStatAgencies' as const },
    { icon: Users, value: '1,000+', labelKey: 'landingStatUsers' as const },
    { icon: MapPin, value: 'M\'Sila', labelKey: 'landingStatLocation' as const },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Subtle gradient pattern background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-0 start-1/4 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 end-1/4 w-80 h-80 bg-teal-200/30 dark:bg-teal-800/10 rounded-full blur-3xl" />
      </div>

      {/* Top Bar */}
      <header className="w-full px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
          >
            <TicketCheck className="h-5 w-5 text-white" />
          </motion.div>
          <span className="font-bold text-lg bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            QueueWise
          </span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* Floating Hero Icon */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex mb-8"
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Zap className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6 border border-emerald-200/50 dark:border-emerald-800/50">
            <TicketCheck className="h-4 w-4" />
            إدارة طوابير ذكية للمؤسسات في الجزائر
          </div>

          {/* Animated gradient title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite]">
              {t('heroTitle')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-emerald-500/25 min-h-12 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02]"
              onClick={() => setView('register')}
            >
              {t('getStarted')}
              <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-semibold px-8 py-6 text-base rounded-xl min-h-12 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-300 hover:scale-[1.02]"
              onClick={() => setView('login')}
            >
              {t('login')}
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 w-full max-w-3xl"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className="cursor-default"
            >
              <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 group">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors duration-300">
                    <feature.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(feature.descKey)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Statistics Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="w-full px-4 py-8 relative z-10"
      >
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 shadow-xl shadow-emerald-500/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.7 + idx * 0.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</p>
                    <p className="text-xs text-emerald-100 font-medium">{t(stat.labelKey)}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <section className="w-full px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
            {t('howItWorks')}
          </h2>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-0">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.15 }}
                className="flex-1 flex flex-col items-center text-center relative"
              >
                {/* Dotted connecting line between steps (desktop) */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 start-[calc(50%+2rem)] end-[calc(-50%+2rem)]">
                    <div className="w-full border-t-2 border-dashed border-emerald-300 dark:border-emerald-700" />
                    <ArrowRight className="absolute -top-3 end-[-8px] h-5 w-5 text-emerald-400 dark:text-emerald-600 rotate-[-45deg]" />
                  </div>
                )}
                {/* Dotted connecting line between steps (mobile) */}
                {idx < steps.length - 1 && (
                  <div className="md:hidden flex flex-col items-center mt-4 mb-2">
                    <div className="w-0.5 h-8 border-s-2 border-dashed border-emerald-300 dark:border-emerald-700" />
                    <ArrowRight className="h-4 w-4 text-emerald-400 dark:text-emerald-600 rotate-90 -mt-2" />
                  </div>
                )}

                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -end-2 h-7 w-7 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-xs font-bold shadow-md">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-base text-foreground">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-[200px]">
                  {t(step.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Wave decoration + Footer */}
      <div className="relative z-10 mt-auto">
        <div className="w-full overflow-hidden">
          <div className="h-16 md:h-24 bg-gradient-to-b from-transparent to-emerald-50 dark:to-emerald-950/20 relative">
            {/* CSS wave using pseudo-elements approach with multiple divs */}
            <svg
              viewBox="0 0 1440 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute bottom-0 w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"
                className="fill-emerald-100/60 dark:fill-emerald-900/20"
              />
              <path
                d="M0 55C360 25 720 75 1080 45C1260 30 1380 50 1440 55V80H0V55Z"
                className="fill-emerald-50 dark:fill-emerald-950/30"
              />
            </svg>
          </div>
        </div>
        <footer className="w-full px-4 py-8 text-center bg-emerald-50 dark:bg-emerald-950/30">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <TicketCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              QueueWise
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            {t('poweredBy')} Z.ai Technology
          </p>
          <p className="text-xs text-muted-foreground/60">
            QueueWise © {new Date().getFullYear()} · {t('rightsReserved')}
          </p>
          <p className="text-[10px] text-muted-foreground/40 mt-2">{t('version')}</p>
        </footer>
      </div>

      {/* Keyframe for gradient text animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
      `}</style>
    </div>
  );
}
