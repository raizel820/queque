'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/use-language';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Reusable error state component with retry button.
 * Shown when data fetching fails, allowing the user to try again.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
}: ErrorStateProps) {
  const { t } = useLanguage();

  const displayTitle = title || t('errorLoadingData');
  const displayDescription = description || t('errorLoadingData');
  const displayRetryLabel = retryLabel || t('tryAgain');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Error icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="h-20 w-20 rounded-3xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-900/10 flex items-center justify-center mb-6 shadow-inner"
      >
        <AlertTriangle className="h-10 w-10 text-rose-500 dark:text-rose-400" />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-bold text-foreground mb-2"
      >
        {displayTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-sm mb-6 text-sm leading-relaxed"
      >
        {displayDescription}
      </motion.p>

      {/* Retry button */}
      {onRetry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={onRetry}
            className="min-h-[44px] px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {displayRetryLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
