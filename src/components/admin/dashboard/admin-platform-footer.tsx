'use client';

import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { formatTime } from './utils';

interface AdminPlatformFooterProps {
  t: (key: string) => string;
  lang: string;
}

export function AdminPlatformFooter({ t, lang }: AdminPlatformFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="text-center pb-2"
    >
      <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal border-dashed">
        {t('platformVersion')}: v1.0.0 · {t('lastUpdated')}: {formatTime(new Date().toISOString(), lang)}
      </Badge>
    </motion.div>
  );
}
