import { Info, Clock, Settings, Gauge, Users, AlertTriangle } from 'lucide-react';

export interface AgencyService {
  id: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  prefix: string;
}

export interface AgencySettingsData {
  avgServiceTime: number;
  maxReservations: number;
  isQueueOpen: boolean;
  services: AgencyService[];
  workingHoursStart: string;
  workingHoursEnd: string;
  autoPauseWhenFull: boolean;
}

export interface SettingsSection {
  id: string;
  icon: React.ElementType;
  titleKey: string;
  danger?: boolean;
}

export const SECTIONS: SettingsSection[] = [
  { id: 'general', icon: Info, titleKey: 'settings' },
  { id: 'hours', icon: Clock, titleKey: 'workingHours' },
  { id: 'services', icon: Settings, titleKey: 'manageServices' },
  { id: 'capacity', icon: Gauge, titleKey: 'queueCapacity' },
  { id: 'staff', icon: Users, titleKey: 'staffManagement' },
  { id: 'danger', icon: AlertTriangle, titleKey: 'deleteAccount', danger: true },
];

export type UpdateSettingFn = <K extends keyof AgencySettingsData>(
  key: K,
  value: AgencySettingsData[K]
) => void;
