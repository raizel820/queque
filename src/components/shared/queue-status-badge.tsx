'use client';

import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import type { TranslationKeys } from '@/i18n';

interface QueueStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { color: string; translationKey: TranslationKeys }> = {
  WAITING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', translationKey: 'statusWaiting' },
  CALLED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', translationKey: 'statusCalled' },
  SERVED: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', translationKey: 'statusServed' },
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
    <Badge variant="outline" className={config.color}>
      {t(config.translationKey)}
    </Badge>
  );
}
