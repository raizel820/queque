'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  FlaskConical,
  Scale,
  Landmark,
  ChevronUp,
  Heart,
  Share2,
  Shield,
  Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─── Trusted Categories Data ──────────── */
interface TrustedCategory {
  icon: LucideIcon;
  labelKey: 'trustedClinic' | 'trustedLab' | 'trustedLaw' | 'trustedGov';
}

const trustedCategories: TrustedCategory[] = [
  { icon: Briefcase, labelKey: 'trustedClinic' },
  { icon: FlaskConical, labelKey: 'trustedLab' },
  { icon: Scale, labelKey: 'trustedLaw' },
  { icon: Landmark, labelKey: 'trustedGov' },
];

export function CtaSection() {
  const { t } = useLanguage();
  const trustedRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      {/* ─── Trusted By Section ──────────────────────── */}
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
                    whileHover={{ scale: 1.1, y: -4 }}
                    className="flex flex-col items-center gap-2 cursor-default"
                  >
                    <div className="h-14 w-14 rounded-2xl glass-feature-card flex items-center justify-center">
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

      {/* ─── Wave decoration + Footer ──────────────── */}
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
        <footer className="w-full px-4 pt-8 pb-6 bg-emerald-50 dark:bg-emerald-950/30">
          <div className="max-w-4xl mx-auto">
            {/* Footer top: Logo + social */}
            <div className="flex flex-col items-center gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl overflow-hidden">
                  <img src="/blasti-icon.svg" alt="BLASTI" className="h-full w-full" />
                </div>
                <span className="font-extrabold text-xl tracking-tight" style={{ color: '#059669' }}>
                  {t('appName')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {t('appTagline')}
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Globe, label: 'Website' },
                  { icon: Share2, label: 'Share' },
                  { icon: Heart, label: 'Community' },
                  { icon: Shield, label: 'Security' },
                ].map((social, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer middle: Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 text-center">
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{t('home')}</h4>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">{t('getStarted')}</p>
                  <p className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">{t('howItWorks')}</p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{t('agencies')}</h4>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">{t('trustedClinic')}</p>
                  <p className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">{t('trustedLab')}</p>
                </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{t('settings')}</h4>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">{t('appearance')}</p>
                  <p className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">{t('language')}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="gradient-divider mb-5" />

            {/* Footer bottom */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {t('poweredBy')} Z.ai Technology
              </p>
              <p className="text-xs text-muted-foreground/60">
                {t('appName')} © {new Date().getFullYear()} · {t('rightsReserved')}
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">{t('version')}</p>
            </div>
          </div>
        </footer>
      </div>

      {/* ─── Floating Back-to-Top Button ─────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            className="fixed bottom-6 end-6 z-50 h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-200"
            aria-label="Back to top"
          >
            <ChevronUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
