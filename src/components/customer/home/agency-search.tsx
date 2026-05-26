'use client';

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, History, TicketCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TranslationKeys } from '@/i18n';
import type { AgencyListItem } from './home-types';
import { getAgencyName } from './home-types';

interface AgencySearchProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchFocused: boolean;
  setSearchFocused: (v: boolean) => void;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  recentSearches: string[];
  searchSuggestions: AgencyListItem[];
  filteredCount: number;
  onSearchSelect: (term: string) => void;
  onRemoveRecentSearch: (term: string) => void;
  onClearAllRecentSearches: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  searchSectionRef: React.RefObject<HTMLDivElement | null>;
  t: (key: TranslationKeys) => string;
  lang: string;
}

export function AgencySearch({
  searchQuery,
  setSearchQuery,
  searchFocused,
  setSearchFocused,
  showSuggestions,
  setShowSuggestions,
  recentSearches,
  searchSuggestions,
  filteredCount,
  onSearchSelect,
  onRemoveRecentSearch,
  onClearAllRecentSearches,
  onSearchKeyDown,
  searchSectionRef,
  t,
  lang,
}: AgencySearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchBlur = () => {
    setTimeout(() => {
      setSearchFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div ref={searchSectionRef} className="relative mb-4">
      <motion.div
        className="absolute start-4 top-1/2 -translate-y-1/2 z-10"
        animate={searchQuery === '' && !searchFocused ? { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] } : { scale: 1, opacity: 1 }}
        transition={searchQuery === '' && !searchFocused ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <Search className="h-5 w-5 text-muted-foreground" />
      </motion.div>
      <Input
        ref={searchInputRef}
        placeholder={t('searchAgency')}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => {
          setSearchFocused(true);
          setShowSuggestions(true);
        }}
        onBlur={handleSearchBlur}
        onKeyDown={onSearchKeyDown}
        className="ps-11 pe-20 h-12 text-base rounded-xl bg-white dark:bg-gray-900/80 shadow-sm border-gray-200 dark:border-gray-800 dark:backdrop-blur-sm"
      />
      {/* Search result count & clear button */}
      <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {searchQuery.trim() && !showSuggestions && (
          <span className="text-[10px] text-muted-foreground font-medium">
            {filteredCount} {t('searchResultsCount')}
          </span>
        )}
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSearchFocused(false); setShowSuggestions(false); }}
            className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('clearSearch')}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      {/* Search Suggestions Dropdown */}
      {(searchFocused || showSuggestions) && (searchSuggestions.length > 0 || (searchQuery === '' && recentSearches.length > 0)) && (
        <div className="absolute top-full mt-1 start-0 end-0 z-[60] bg-white dark:bg-gray-900 border border-border rounded-xl shadow-lg overflow-hidden">
          {searchQuery === '' && recentSearches.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">{t('recentSearches')}</span>
                </div>
                <button
                  onClick={onClearAllRecentSearches}
                  className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  {t('clearAll')}
                </button>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => onSearchSelect(term)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-start"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{term}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveRecentSearch(term); }}
                    className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </button>
              ))}
            </>
          ) : searchSuggestions.length > 0 ? (
            <>
              <div className="px-3 py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground">{t('suggestions')}</span>
              </div>
              {searchSuggestions.map((agency) => (
                <button
                  key={agency.id}
                  onClick={() => onSearchSelect(getAgencyName(agency, lang))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors text-start"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <TicketCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{getAgencyName(agency, lang)}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{agency.address}</p>
                  </div>
                </button>
              ))}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
