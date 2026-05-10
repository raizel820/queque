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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="w-full px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TicketCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">QueueWise</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
            <TicketCheck className="h-4 w-4" />
            إدارة طوابير ذكية للمؤسسات في الجزائر
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white leading-tight">
            {t('heroTitle')}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-emerald-500/25 min-h-12"
              onClick={() => setView('register')}
            >
              {t('getStarted')}
              <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-semibold px-8 py-6 text-base rounded-xl min-h-12"
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
            >
              <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
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

      {/* How It Works */}
      <section className="w-full px-4 py-16 bg-gradient-to-b from-transparent to-emerald-50/50 dark:to-emerald-950/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
            {t('howItWorks')}
          </h2>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-4">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.15 }}
                className="flex-1 flex flex-col items-center text-center"
              >
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -end-2 h-7 w-7 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-base text-foreground">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-[200px]">
                  {t(step.descKey)}
                </p>
                {idx < steps.length - 1 && (
                  <ArrowRight className="mt-4 h-5 w-5 text-emerald-300 dark:text-emerald-700 hidden md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          QueueWise © {new Date().getFullYear()} — Smart Queue Management
        </p>
      </footer>
    </div>
  );
}
