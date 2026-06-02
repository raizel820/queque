'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ActivityItem } from './types';
import { getActivityColor, getInitials, formatRelativeTime } from './utils';

interface AdminLatestUsersProps {
  activities: ActivityItem[];
  t: (key: string) => string;
  lang: string;
}

export function AdminLatestUsers({ activities, t, lang }: AdminLatestUsersProps) {
  const userActivities = activities.filter(
    a => a.action.toUpperCase().includes('REGISTER') || a.action.toUpperCase().includes('CREATE')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.17 }}
    >
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-600" />
              {t('latestUsers')}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              {t('recent')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {userActivities.slice(0, 5).map((activity, idx) => {
              const colorInfo = getActivityColor(activity.action);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className={`h-9 w-9 rounded-xl ${colorInfo.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xs font-bold ${colorInfo.text}`}>{getInitials(activity.details)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activity.details}</p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeTime(activity.createdAt, lang)}</p>
                  </div>
                  <Badge className={`text-[8px] h-5 ${colorInfo.bg} ${colorInfo.text} border-0`}>
                    {activity.entity}
                  </Badge>
                </motion.div>
              );
            })}
            {userActivities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
