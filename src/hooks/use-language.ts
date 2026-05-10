'use client';

import { useAppStore } from '@/store/use-app-store';
import { t as translate, type TranslationKeys, type Language } from '@/i18n';
import { useState, useEffect } from 'react';

export function useLanguage() {
  const user = useAppStore((s) => s.user);
  const [lang, setLang] = useState<Language>('ar');

  useEffect(() => {
    if (user?.language) {
      setLang(user.language);
    } else {
      const stored = localStorage.getItem('queuewise-lang') as Language | null;
      if (stored) {
        setLang(stored);
      }
    }
  }, [user?.language]);

  const handleLanguageEvent = (e: Event) => {
    setLang((e as CustomEvent).detail as Language);
  };

  useEffect(() => {
    window.addEventListener('language-change', handleLanguageEvent);
    return () => window.removeEventListener('language-change', handleLanguageEvent);
  }, []);

  const t = (key: TranslationKeys) => translate(key, lang);

  return { lang, t };
}
