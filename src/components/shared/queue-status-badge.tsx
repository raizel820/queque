'use client';

import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import type { TranslationKeys } from '@/i18n';
import { motion } from 'framer-motion';

interface QueueStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { color: string; translationKey: TranslationKeys; animate?: string }> = {
  WAITING: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    translationKey: 'statusWaiting',
    animate: 'pulse',
  },
  CALLED: {
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-emerald-500/20',
    translationKey: 'statusCalled',
    animate: 'glow',
  },
  SERVED: { color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800', translationKey: 'statusServed' },
  COMPLETED: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', translationKey: 'statusCompleted' },
  CANCELLED: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', translationKey: 'statusCancelled' },
  NO_SHOW: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800', translationKey: 'statusNoShow' },
};

export function QueueStatusBadge({ status }: QueueStatusBadgeProps) {
  const { lang, t } = useLanguage();
  const config = statusConfig[status] ?? {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    translationKey: 'status' as TranslationKeys,
  };

  return (
    <Badge
      variant="outline"
      className={`${config.color} px-2.5 py-0.5 text-xs font-semibold ${
        config.animate === 'pulse' ? 'animate-pulse' : ''
      } ${
        config.animate === 'glow'
          ? 'animate-[badge-glow_2s_ease-in-out_infinite]'
          : ''
      }`}
    >
      {config.animate === 'pulse' && (
        <motion.span
          className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-500 me-1"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {config.animate === 'glow' && (
        <motion.span
          className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 me-1"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {t(config.translationKey)}
    </Badge>
  );
}
