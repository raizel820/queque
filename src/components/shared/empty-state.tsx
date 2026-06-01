'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/use-language';
import { isRTL } from '@/i18n';
import { Lightbulb, X } from 'lucide-react';
import { useState } from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tip?: string;
}

/**
 * Reusable empty state component with illustration, message, and optional action button.
 * Includes an optional "Quick Tip" that can be dismissed.
 */
export function EmptyState({ icon, title, description, actionLabel, onAction, tip }: EmptyStateProps) {
  const { t, lang } = useLanguage();
  const rtl = isRTL(lang);
  const [showTip, setShowTip] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6 shadow-inner"
      >
        {icon}
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-gray-800 mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 max-w-sm mb-6 text-sm leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Action button */}
      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="min-h-[48px] px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {actionLabel}
        </motion.button>
      )}

      {/* Quick Tip */}
      {tip && showTip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-sm w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 relative"
        >
          <button
            onClick={() => setShowTip(false)}
            className="absolute top-2 end-2 h-6 w-6 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors"
          >
            <X className="h-3.5 w-3.5 text-amber-600" />
          </button>
          <div className={`flex items-start gap-2 ${rtl ? 'flex-row-reverse' : ''}`}>
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className={`text-start ${rtl ? 'text-end' : ''}`}>
              <p className="text-xs font-semibold text-amber-700 mb-1">{t('quickTip')}</p>
              <p className="text-xs text-amber-600 leading-relaxed">{tip}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
