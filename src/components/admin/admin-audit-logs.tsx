'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
  user?: { fullName: string; username: string };
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REGISTER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  QUEUE_JOIN: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  QUEUE_CALLED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  QUEUE_COMPLETE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  QUEUE_CANCEL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PAYMENT_APPROVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAYMENT_REJECT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PAYMENT_CREATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  AGENCY_CREATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function AdminAuditLogs() {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? data.auditLogs ?? []);
        setTotalLogs(data.total ?? (data.logs ?? data.auditLogs ?? []).length);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.details?.toLowerCase().includes(q) ||
      log.user?.fullName?.toLowerCase().includes(q) ||
      log.user?.username?.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const formatTime = (dateStr: string) => {
    const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US';
    return new Date(dateStr).toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 rounded-2xl" />
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('auditLogsPage')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('auditLogsDesc') || 'Track all system activities and changes'}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchLogs} className="h-10 w-10">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10 h-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('allLogs')}</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            {filteredLogs.length} {t('auditLogs')}
            {totalLogs > PAGE_SIZE && (
              <span className="text-[10px] text-muted-foreground font-normal">
                ({t('showing') || 'showing'} {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalLogs)} {t('of') || 'of'} {totalLogs})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('noResults')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredLogs.map((log, idx) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 activity-item-hover"
                >
                  {/* User avatar */}
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      {(log.user?.fullName || 'System').split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'S'}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 font-mono ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {log.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{log.details}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{log.user?.fullName || 'System'}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{log.entityType}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(log.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalLogs > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => { setPage(p => Math.max(1, p - 1)); fetchLogs(); }}
            className="rounded-xl border-emerald-200 dark:border-emerald-800"
          >
            {t('previous') || 'Previous'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t('page') || 'Page'} {page} / {Math.ceil(totalLogs / PAGE_SIZE)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page * PAGE_SIZE >= totalLogs}
            onClick={() => { setPage(p => p + 1); fetchLogs(); }}
            className="rounded-xl border-emerald-200 dark:border-emerald-800"
          >
            {t('next') || 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}
