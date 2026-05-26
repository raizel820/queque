'use client';

import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Clock,
  Bell,
  ArrowRight,
  TicketCheck,
  Building2,
  Users,
  Zap,
} from 'lucide-react';

/* ─── Hero Particles ──────────── */
// Deterministic pseudo-random based on seed to avoid hydration mismatch
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function HeroParticles() {
  // Use deterministic values derived from index to prevent SSR/client hydration mismatch
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: seededRandom(i * 2) * 100,
    y: seededRandom(i * 2 + 1) * 100,
    size: seededRandom(i * 3 + 5) * 3 + 1,
    duration: seededRandom(i * 3 + 10) * 8 + 6,
    delay: seededRandom(i * 3 + 15) * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-400/25 dark:bg-emerald-500/15"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, -10, -25, 0],
            x: [0, 10, -5, 8, 0],
            opacity: [0.2, 0.5, 0.3, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Phone Mockup SVG Illustration ──────────── */
function PhoneMockup() {
  const { t } = useLanguage();
  return (
    <motion.div
      className="hidden lg:flex items-center justify-center relative"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <motion.div
        animate={{ y: [0, -12, -6, -16, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
        style={{ perspective: '800px' }}
      >
        {/* Glow behind phone */}
        <div className="absolute -inset-8 bg-gradient-to-br from-emerald-400/20 to-teal-400/10 dark:from-emerald-500/10 dark:to-teal-500/5 rounded-[3rem] blur-2xl" />
        
        {/* Phone body */}
        <div className="relative w-56 h-[420px] rounded-[2.5rem] bg-gradient-to-b from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 p-2 shadow-2xl shadow-emerald-500/10">
          {/* Screen */}
          <div className="w-full h-full rounded-[2rem] bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden relative">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 dark:bg-gray-700 rounded-b-2xl z-10" />
            
            {/* Status bar */}
            <div className="h-10 flex items-end justify-center pb-1">
              <span className="text-[8px] text-gray-400 font-medium">9:41</span>
            </div>

            {/* App UI inside phone */}
            <div className="px-3 pt-1">
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="h-5 w-5 rounded-md overflow-hidden">
                  <img src="/blasti-icon.svg" alt="BLASTI" className="h-full w-full" />
                </div>
                <span className="text-[8px] font-bold" style={{ color: '#059669' }}>BLASTI</span>
              </div>

              {/* Queue ticket card */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 mb-2.5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="text-[7px] text-emerald-100 mb-0.5">رقمك في الطابور</p>
                <p className="text-2xl font-black text-white">A-042</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-0.5">
                    <Users className="w-2.5 h-2.5 text-emerald-200" />
                    <span className="text-[7px] text-emerald-100">3 أمامك</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-emerald-200" />
                    <span className="text-[7px] text-emerald-100">~15 دقيقة</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/80 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '70%' }}
                    transition={{ duration: 2, delay: 1.5 }}
                  />
                </div>
              </div>

              {/* Mini list items */}
              <div className="space-y-1.5">
                {[
                  { label: 'عيادة النور', num: 'A-039', status: 'يُخدم الآن' },
                  { label: 'عيادة النور', num: 'A-040', status: 'التالي' },
                  { label: 'عيادة النور', num: 'A-041', status: 'في الانتظار' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white/80 dark:bg-gray-800/80 p-1.5 border border-gray-100 dark:border-gray-700/50"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 2 + i * 0.2 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold text-white ${i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        {item.num}
                      </div>
                      <span className="text-[7px] text-gray-600 dark:text-gray-400">{item.status}</span>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-400 animate-pulse' : i === 1 ? 'bg-teal-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom nav bar */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 flex items-center justify-around px-4">
              {[
                { icon: <Building2 className="w-3 h-3" />, active: false },
                { icon: <TicketCheck className="w-3 h-3" />, active: true },
                { icon: <Bell className="w-3 h-3" />, active: false },
                { icon: <Users className="w-3 h-3" />, active: false },
              ].map((nav, i) => (
                <div key={i} className={`flex items-center justify-center w-6 h-6 rounded-lg ${nav.active ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                  {nav.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Hero Section Props ──────────── */
interface HeroSectionProps {
  onRegister: () => void;
  onLogin: () => void;
}

/* ─── Hero Section ──────────── */
export function HeroSection({ onRegister, onLogin }: HeroSectionProps) {
  const { t } = useLanguage();

  return (
    <section className="flex-1 flex flex-col items-center justify-center px-4 py-6 md:py-12 relative z-10">
      <HeroParticles />

      <div className="text-center max-w-2xl mx-auto lg:flex lg:items-center lg:gap-12 lg:max-w-5xl lg:text-start">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1"
        >
          {/* Floating Hero Icon */}
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex mb-4 lg:mb-6"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 blur-xl"
              />
              {/* Rotating ring around icon */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-3 rounded-[1.75rem] border border-dashed border-emerald-300/30 dark:border-emerald-600/20"
              />
              <div className="relative h-18 w-18 md:h-24 md:w-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <Zap className="h-9 w-9 md:h-12 md:w-12 text-white" />
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

          {/* Enhanced gradient title with dramatic 3D text effect */}
          <motion.h1
            className="text-3xl md:text-5xl lg:text-7xl font-black tracking-tight mb-4 md:mb-6 leading-[1.1] relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Shadow layer for 3D depth */}
            <span className="hero-title-3d" aria-hidden="true">
              {t('heroTitle')}
            </span>
            {/* Main gradient text */}
            <span className="hero-gradient-title">
              {t('heroTitle')}
            </span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {/* Primary CTA with enhanced sweep and glow */}
            <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.97 }}>
              <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 cta-pulse-glow">
                <Button
                  size="lg"
                  className="relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-8 md:px-10 py-6 md:py-7 text-base md:text-lg rounded-2xl shadow-xl shadow-emerald-500/30 min-h-12 md:min-h-14 hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 w-full sm:w-auto overflow-hidden group"
                  onClick={onRegister}
                >
                  {/* Sweep shine effect */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative flex items-center">
                    {t('getStarted')}
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-flex ms-2"
                    >
                      <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                    </motion.span>
                  </span>
                </Button>
              </div>
            </motion.div>
            {/* Secondary CTA with glow border effect */}
            <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                variant="outline"
                className="relative font-bold px-8 md:px-10 py-6 md:py-7 text-base md:text-lg rounded-2xl min-h-12 md:min-h-14 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-300 border-2 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 w-full sm:w-auto overflow-hidden group cta-pulse-glow"
                onClick={onLogin}
              >
                {/* Subtle sweep effect */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent" />
                <span className="relative">{t('login')}</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Phone Mockup - visible on desktop */}
        <PhoneMockup />
      </div>
    </section>
  );
}
