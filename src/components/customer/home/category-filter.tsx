'use client';

import { motion } from 'framer-motion';
import type { TranslationKeys } from '@/i18n';
import { categoryKeys } from './home-types';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  t: (key: TranslationKeys) => string;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  t,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
      {categoryKeys.map((cat) => {
        const Icon = cat.icon;
        const isActive = selectedCategory === cat.value;
        return (
          <motion.button
            key={cat.value}
            onClick={() => onSelectCategory(cat.value)}
            layout
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all min-h-9 active:scale-95 relative ${
              isActive
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                : 'bg-white/60 dark:bg-gray-800/60 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50'
            }`}
          >
            <motion.span
              initial={false}
              animate={{ scale: isActive ? 1.1 : 1, rotate: isActive ? 10 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Icon className="h-3.5 w-3.5" />
            </motion.span>
            {t(cat.key)}
            {/* Animated selection indicator */}
            {isActive && (
              <motion.div
                layoutId="categoryIndicator"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
