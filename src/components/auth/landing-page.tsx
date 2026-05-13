'use client';

import { useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { motion, useInView } from 'framer-motion';
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
  Briefcase,
  FlaskConical,
  Scale,
  Landmark,
  Star,
  Quote,
} from 'lucide-react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const displaySuffix = suffix;

  return (
    <motion.span
      ref={ref}
      className="tabular-nums"
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5 }}
      >
        {target.toLocaleString()}{displaySuffix}
      </motion.span>
    </motion.span>
  );
}

export function LandingPage() {
  const { setView } = useAppStore();
  const { t } = useLanguage();
  const statsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const trustedRef = useRef<HTMLDivElement>(null);

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

  const [landingStats, setLandingStats] = useState<{ agencies: number; users: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/agencies');
        if (res.ok) {
          const data = await res.json();
          const agencyCount = data.total ?? data.agencies?.length ?? 0;
          setLandingStats({ agencies: agencyCount, users: agencyCount * 25 });
        }
      } catch {
        // keep fallback values
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { icon: Building2, value: landingStats?.agencies ?? 10, suffix: '+', labelKey: 'landingStatAgencies' as const },
    { icon: Users, value: landingStats?.users ?? 1000, suffix: '+', labelKey: 'landingStatUsers' as const },
    { icon: MapPin, value: 1, suffix: '', displayValue: t('landingLocation'), labelKey: 'landingStatLocation' as const },
  ];

  const testimonials = [
    { textKey: 'testimonial1' as const, nameKey: 'testimonial1Name' as const, roleKey: 'testimonial1Role' as const },
    { textKey: 'testimonial2' as const, nameKey: 'testimonial2Name' as const, roleKey: 'testimonial2Role' as const },
    { textKey: 'testimonial3' as const, nameKey: 'testimonial3Name' as const, roleKey: 'testimonial3Role' as const },
  ];

  const trustedCategories = [
    { icon: Briefcase, labelKey: 'trustedClinic' as const },
    { icon: FlaskConical, labelKey: 'trustedLab' as const },
    { icon: Scale, labelKey: 'trustedLaw' as const },
    { icon: Landmark, labelKey: 'trustedGov' as const },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-[length:400%_400%] bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30"
        />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Mesh gradient blobs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 start-1/4 w-96 h-96 bg-emerald-200/40 dark:bg-emerald-800/15 rounded-full blur-3xl"
          style={{ animation: 'mesh-drift-1 20s ease-in-out infinite' }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 end-1/4 w-80 h-80 bg-teal-200/40 dark:bg-teal-800/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-300/10 dark:bg-emerald-700/5 rounded-full blur-3xl"
        />
      </div>

      {/* Floating glass orbs with glass-morphism */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large glass orbs with slow drift */}
        <motion.div
          animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[12%] start-[5%] w-20 h-20 rounded-full glass-orb shadow-lg"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-[22%] end-[10%] w-16 h-16 rounded-full glass-orb shadow-lg"
        />
        <motion.div
          animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute top-[55%] end-[6%] w-14 h-14 rounded-full glass-orb shadow-lg"
        />
        <motion.div
          animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[70%] start-[12%] w-12 h-12 rounded-full glass-orb shadow-lg"
        />
        {/* Small decorative dots */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[40%] start-[15%] w-2 h-2 rounded-full bg-emerald-400/30 dark:bg-emerald-500/20"
        />
        <motion.div
          animate={{ y: [0, 10, 0], x: [0, -6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-[35%] start-[30%] w-1.5 h-1.5 rounded-full bg-teal-400/25 dark:bg-teal-500/10"
        />
        {/* Floating diamonds */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 3 }}
          className="absolute top-[20%] end-[25%] w-6 h-6 rounded-md border border-emerald-300/30 dark:border-emerald-700/20 rotate-45"
        />
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [0, -180, -360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: 1.5 }}
          className="absolute top-[50%] start-[5%] w-4 h-4 rounded-md border border-teal-300/25 dark:border-teal-700/15 rotate-12"
        />
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
            animate={{ y: [0, -14, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 blur-xl"
              />
              <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <Zap className="h-12 w-12 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6 border border-emerald-200/50 dark:border-emerald-800/50"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
            >
              <TicketCheck className="h-4 w-4" />
            </motion.div>
            {t('appTagline')}
          </motion.div>

          {/* Animated gradient title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite] drop-shadow-sm">
              {t('heroTitle')}
            </span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="cta-glow bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-10 py-7 text-lg rounded-2xl shadow-xl shadow-emerald-500/30 min-h-14 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300"
                onClick={() => setView('register')}
              >
                {t('getStarted')}
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
                </motion.div>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                variant="outline"
                className="cta-glow font-bold px-10 py-7 text-lg rounded-2xl min-h-14 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-300 border-2 hover:border-emerald-300 dark:hover:border-emerald-700"
                onClick={() => setView('login')}
              >
                {t('login')}
              </Button>
            </motion.div>
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
              whileHover={{ scale: 1.03, y: -6 }}
              className="cursor-default"
            >
              <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-br from-emerald-200/50 via-transparent to-teal-200/50 dark:from-emerald-700/30 dark:via-transparent dark:to-teal-700/30 group-hover:from-emerald-300/80 dark:group-hover:from-emerald-600/50 group-hover:to-teal-300/80 dark:group-hover:to-teal-600/50 transition-all duration-300">
                <Card className="h-full border-0 shadow-sm group-hover:shadow-2xl group-hover:shadow-emerald-500/10 transition-all duration-300 bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-950 overflow-hidden rounded-[13px]">
                  <div className="absolute top-0 start-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent group-hover:via-emerald-400/60 transition-all duration-500" />
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center group-hover:from-emerald-200 group-hover:to-teal-200 dark:group-hover:from-emerald-800/50 dark:group-hover:to-teal-800/50 group-hover:shadow-lg group-hover:shadow-emerald-500/10 transition-all duration-300">
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
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Statistics Banner with Animated Counters */}
      <motion.section
        ref={statsRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 py-8 relative z-10"
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl p-[1px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 opacity-60" />
            <motion.div
              animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-emerald-300 via-teal-300 to-amber-300 opacity-30"
            />
          <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 shadow-xl shadow-emerald-500/25 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-4 text-center">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-2xl md:text-3xl font-extrabold text-white">
                      {stat.displayValue ? (
                        stat.displayValue
                      ) : (
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                      )}
                    </p>
                    <p className="text-xs text-emerald-100 font-medium">{t(stat.labelKey)}</p>
                  </motion.div>
                );
              })}
            </div>
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
                className="flex-1 flex flex-col items-center text-center relative group cursor-default"
              >
                {/* Gradient step connector line (desktop) */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 start-[calc(50%+2rem)] end-[calc(-50%+2rem)]">
                    <div className="w-full h-[2px] step-connector rounded-full" />
                    <div className="absolute -top-[3px] end-[-6px] h-2 w-2 rounded-full bg-teal-400 dark:bg-teal-500 shadow-sm shadow-teal-400/50" />
                  </div>
                )}
                {/* Gradient step connector line (mobile) */}
                {idx < steps.length - 1 && (
                  <div className="md:hidden flex flex-col items-center mt-4 mb-2">
                    <div className="w-[2px] h-8 bg-gradient-to-b from-emerald-400/50 to-teal-400/20 dark:from-emerald-600/30 dark:to-teal-600/10 rounded-full" />
                    <div className="h-2 w-2 rounded-full bg-teal-400 dark:bg-teal-500 -mt-1 shadow-sm shadow-teal-400/50" />
                  </div>
                )}

                <div className="relative group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-emerald-500/25 transition-all duration-300">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -end-2 h-7 w-7 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-xs font-bold shadow-md">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-base text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
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

      {/* Testimonials Section with gradient overlay */}
      <section className="w-full px-4 py-16 relative z-10">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-emerald-50/30 to-emerald-50/50 dark:from-transparent dark:via-emerald-950/10 dark:to-emerald-950/20" />
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-foreground">
              {t('testimonialsTitle')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: idx * 0.12 }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-900 group">
                  <CardContent className="p-5 flex flex-col h-full">
                    <Quote className="h-8 w-8 text-emerald-200 dark:text-emerald-800 mb-3 flex-shrink-0 group-hover:text-emerald-300 dark:group-hover:text-emerald-700 transition-colors duration-300" />
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                      &ldquo;{t(testimonial.textKey)}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                        {t(testimonial.nameKey).charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t(testimonial.nameKey)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(testimonial.roleKey)}
                        </p>
                      </div>
                      <div className="ms-auto flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Testimonials Carousel */}
      <section className="w-full py-12 relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h3
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg md:text-xl font-semibold text-center mb-8 text-foreground"
          >
            {t('landingCarouselTitle')}
          </motion.h3>
          <div className="relative">
            {/* Gradient fade overlays */}
            <div className="absolute start-0 top-0 bottom-8 w-16 bg-gradient-to-e from-[var(--color-bg)] to-transparent z-10 pointer-events-none rtl:bg-gradient-to-l" />
            <div className="absolute end-0 top-0 bottom-8 w-16 bg-gradient-to-s from-[var(--color-bg)] to-transparent z-10 pointer-events-none rtl:bg-gradient-to-r" />
            {/* Carousel track */}
            <div className="overflow-hidden">
              <div
                className="flex gap-4 w-max"
                style={{
                  animation: 'carousel-scroll 25s linear infinite',
                }}
              >
                {[...testimonials, ...testimonials, ...testimonials, ...testimonials].map((testimonial, idx) => (
                  <div
                    key={`carousel-${idx}`}
                    className="w-80 flex-shrink-0"
                  >
                    <div className="rounded-2xl p-5 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {t(testimonial.nameKey).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t(testimonial.nameKey)}</p>
                          <p className="text-xs text-muted-foreground">{t(testimonial.roleKey)}</p>
                        </div>
                        <div className="ms-auto flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <Quote className="h-5 w-5 text-emerald-300 dark:text-emerald-700 mb-1.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        &ldquo;{t(testimonial.textKey)}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label={t('carouselDot')}>
              {testimonials.map((_, i) => (
                <div
                  key={`dot-${i}`}
                  className="h-2 w-2 rounded-full bg-emerald-400 dark:bg-emerald-600"
                  style={{
                    animation: `carousel-dot-pulse 3s ease-in-out ${i * 0.8}s infinite`,
                  }}
                  role="tab"
                  aria-label={t('carouselDot')}
                />
              ))}
            </div>
          </div>
          {/* CSS animations for carousel */}
          <style>{`
            @keyframes carousel-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-33.333%); }
            }
            @keyframes carousel-dot-pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.3); }
            }
          `}</style>
        </div>
      </section>

      {/* Trusted By Section */}
      <section ref={trustedRef} className="w-full px-4 py-12 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
              {t('trustedBy')}
            </p>
            <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
              {trustedCategories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.08 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/30">
                      <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t(cat.labelKey)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Wave decoration + Footer */}
      <div className="relative z-10 mt-auto">
        <div className="w-full overflow-hidden">
          <div className="h-16 md:h-24 bg-gradient-to-b from-transparent to-emerald-50 dark:to-emerald-950/20 relative">
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

    </div>
  );
}
