'use client';

import {
  UserCircle,
  Phone,
  Check,
  Circle,
} from 'lucide-react';

interface ActivityIconProps {
  action: string;
}

export function ActivityIcon({ action }: ActivityIconProps) {
  const actionUpper = action.toUpperCase();
  if (actionUpper.includes('LOGIN')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <UserCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  if (actionUpper.includes('QUEUE_CALL') || actionUpper.includes('CALL')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
        <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  if (actionUpper.includes('PAYMENT_APPROVE') || actionUpper.includes('APPROVE')) {
    return (
      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
        <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
      <Circle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    </div>
  );
}
