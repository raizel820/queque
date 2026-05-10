import ar from './ar';
import fr from './fr';
import en from './en';
import type { TranslationKeys } from './ar';

export type { TranslationKeys };
export type Language = 'ar' | 'fr' | 'en';

export const translations: Record<Language, Record<TranslationKeys, string>> = { ar, fr, en };

export const languageNames: Record<Language, string> = {
  ar: 'العربية',
  fr: 'Français',
  en: 'English',
};

export const isRTL = (lang: Language) => lang === 'ar';

export function t(key: TranslationKeys, lang: Language): string {
  return translations[lang]?.[key] ?? translations.ar[key] ?? key;
}
