'use client';

import { useLanguage } from '@/hooks/use-language';
import { CustomToggle } from './custom-toggle';

export interface AgencySettingsData {
  avgServiceTime: number;
  maxReservations: number;
  isQueueOpen: boolean;
  services: Array<{
    id: string;
    name: string;
    nameAr?: string;
    nameFr?: string;
    prefix: string;
  }>;
  workingHoursStart: string;
  workingHoursEnd: string;
  autoPauseWhenFull: boolean;
}

interface GeneralSettingsProps {
  settings: AgencySettingsData | null;
  updateSetting: <K extends keyof AgencySettingsData>(key: K, value: AgencySettingsData[K]) => void;
}

export function GeneralSettings({ settings, updateSetting }: GeneralSettingsProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground -mt-1 mb-2">{t('generalSettingsDesc') || 'Control your queue availability and basic settings'}</p>
      <CustomToggle
        checked={settings?.isQueueOpen ?? false}
        onCheckedChange={(v) => updateSetting('isQueueOpen', v)}
        label={settings?.isQueueOpen ? t('queueOpen') : t('queueClosedStatus')}
        description={settings?.isQueueOpen ? t('openNow') : t('closed')}
      />
    </div>
  );
}
