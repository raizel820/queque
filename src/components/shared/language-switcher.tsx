'use client';

import { useAppStore, updateDocumentDirection } from '@/store/use-app-store';
import { languageNames, type Language } from '@/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { user, setUser } = useAppStore();
  const currentLang = user?.language ?? 'ar';

  const handleLanguageChange = (lang: Language) => {
    updateDocumentDirection(lang);
    if (user) {
      setUser({ ...user, language: lang });
    } else {
      // Set a temporary language preference
      updateDocumentDirection(lang);
      // Store in localStorage for pre-login
      if (typeof window !== 'undefined') {
        localStorage.setItem('queuewise-lang', lang);
      }
    }
    // Dispatch a custom event for non-authenticated state
    window.dispatchEvent(new CustomEvent('language-change', { detail: lang }));
  };

  // Listen for non-auth language changes
  if (typeof window !== 'undefined' && !user) {
    const stored = localStorage.getItem('queuewise-lang') as Language | null;
    if (stored && stored !== currentLang) {
      updateDocumentDirection(stored);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.entries(languageNames) as [Language, string][]).map(
          ([code, name]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={currentLang === code ? 'bg-accent font-medium' : ''}
            >
              {name}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
