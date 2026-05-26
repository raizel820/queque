'use client';

import { useLanguage } from '@/hooks/use-language';
import { CustomToggle } from './custom-toggle';
import type { AgencySettingsData, UpdateSettingFn } from './types';

interface SettingsGeneralProps {
  settings: AgencySettingsData | null;
  updateSetting: UpdateSettingFn;
}

export function SettingsGeneral({ settings, updateSetting }: SettingsGeneralProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground -mt-1 mb-2">
        {t('generalSettingsDesc') || 'Control your queue availability and basic settings'}
      </p>
      <CustomToggle
        checked={settings?.isQueueOpen ?? false}
        onCheckedChange={(v) => updateSetting('isQueueOpen', v)}
        label={settings?.isQueueOpen ? t('queueOpen') : t('queueClosedStatus')}
        description={settings?.isQueueOpen ? t('openNow') : t('closed')}
      />
    </div>
  );
}
