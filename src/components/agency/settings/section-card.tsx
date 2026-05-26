'use client';

import type { TranslationKeys } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SettingsSection } from './types';

interface SectionCardProps {
  section: SettingsSection;
  sectionIdx: number;
  isExpanded: boolean;
  onToggle: () => void;
  t: (key: TranslationKeys) => string;
  children: React.ReactNode;
}

export function SectionCard({
  section,
  sectionIdx,
  isExpanded,
  onToggle,
  t,
  children,
}: SectionCardProps) {
  const Icon = section.icon;
  const isDanger = section.danger;

  return (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIdx * 0.04 }}
    >
      <Card
        className={`border-0 shadow-sm overflow-hidden bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 ${
          isDanger ? 'ring-1 ring-red-200 dark:ring-red-800/50 danger-zone-card' : ''
        }`}
      >
        {/* Collapsible Header */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between p-4 transition-colors duration-200 text-start ${
            isDanger
              ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 hover:from-red-100/50 dark:hover:from-red-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                isDanger
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-emerald-100 dark:bg-emerald-900/30'
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 ${
                  isDanger
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              />
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${
                  isDanger
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-foreground'
                }`}
              >
                {t(section.titleKey as TranslationKeys)}
              </p>
              {isDanger && (
                <p className="text-[10px] text-red-500/70 dark:text-red-400/60">
                  {t('irreversibleActions') || 'Irreversible actions'}
                </p>
              )}
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <ChevronDown
              className={`h-5 w-5 ${
                isDanger ? 'text-red-400' : 'text-muted-foreground'
              }`}
            />
          </motion.div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <Separator className="mb-4" />
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
