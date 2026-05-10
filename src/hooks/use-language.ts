'use client';

import { useAppStore } from '@/store/use-app-store';
import { t as translate, type TranslationKeys, type Language } from '@/i18n';
import { useSyncExternalStore } from 'react';

// Simple external store for language changes outside of Zustand (pre-login)
let currentLang: Language = 'ar';
const langListeners = new Set<() => void>();

function getLangSnapshot(): Language {
  return currentLang;
}

function subscribeToLang(callback: () => void): () => void {
  langListeners.add(callback);
  return () => langListeners.delete(callback);
}

export function setLanguage(lang: Language) {
  currentLang = lang;
  langListeners.forEach(l => l());
}

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('queuewise-lang') as Language | null;
  if (stored) currentLang = stored;
}

export function useLanguage() {
  const user = useAppStore((s) => s.user);
  
  const getSnapshot = () => {
    if (user?.language) return user.language;
    return currentLang;
  };

  const getServerSnapshot = () => 'ar' as Language;

  const effectiveLang = useSyncExternalStore(subscribeToLang, getSnapshot, getServerSnapshot);

  const t = (key: TranslationKeys) => translate(key, effectiveLang);

  return { lang: effectiveLang, t };
}
