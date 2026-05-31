'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, ScanLine } from 'lucide-react';
import type { TranslationKeys } from '@/i18n';

interface AgencyCodeInputProps {
  agencyCode: string;
  setAgencyCode: (v: string) => void;
  onJoinByCode: () => void;
  onOpenQrScanner: () => void;
  t: (key: TranslationKeys) => string;
}

export function AgencyCodeInput({
  agencyCode,
  setAgencyCode,
  onJoinByCode,
  onOpenQrScanner,
  t,
}: AgencyCodeInputProps) {
  return (
    <div className="flex gap-2 mb-5">
      <Input
        placeholder={t('enterAgencyCode')}
        value={agencyCode}
        onChange={(e) => setAgencyCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onJoinByCode()}
        className="h-11 text-sm rounded-xl input-emerald-glow"
        dir="ltr"
      />
      <Button
        variant="outline"
        className="h-11 px-3 rounded-xl border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        onClick={onOpenQrScanner}
        aria-label={t('scanQrCode')}
      >
        <ScanLine className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        className="h-11 px-4 rounded-xl border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        onClick={onJoinByCode}
      >
        <QrCode className="h-4 w-4 me-1.5" />
        {t('joinQueue')}
      </Button>
    </div>
  );
}
