'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Plus,
  Search,
  Ban,
  CheckCircle2,
  Trash2,
  Loader2,
  Edit3,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { TranslationKeys } from '@/i18n';

interface Agency {
  id: string;
  name: string;
  category: string;
  plan: string;
  status: string;
  createdAt: string;
}

const statusOptions = [
  { value: 'ALL', key: 'all' as TranslationKeys },
  { value: 'ACTIVE', key: 'active' as TranslationKeys },
  { value: 'SUSPENDED', key: 'inactive' as TranslationKeys },
];

const categoryOptions: { value: string; key: TranslationKeys }[] = [
  { value: 'CLINIC', key: 'catClinic' },
  { value: 'AGENCY', key: 'catAgency' },
  { value: 'LAW_FIRM', key: 'catLawFirm' },
  { value: 'LABORATORY', key: 'catLaboratory' },
  { value: 'GOVERNMENT', key: 'catGovernment' },
  { value: 'OTHER', key: 'catOther' },
];

export function AdminAgencies() {
  const { t } = useLanguage();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('CLINIC');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agencies');
      if (res.ok) {
        const data = await res.json();
        setAgencies(data.agencies ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'suspend' | 'activate' | 'delete') => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch(`/api/admin/agencies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(t('success'));
        fetchAgencies();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t('requiredField'));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), category: newCategory }),
      });
      if (res.ok) {
        toast.success(t('success'));
        setCreateOpen(false);
        setNewName('');
        fetchAgencies();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setCreating(false);
    }
  };

  const filteredAgencies = agencies.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = !query || a.name.toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  const getCategoryLabel = (cat: string) => {
    const found = categoryOptions.find((c) => c.value === cat.toUpperCase());
    return found ? t(found.key) : cat;
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('agencyManagement')}</h1>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4 me-1.5" />
          {t('createAgency')}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 h-10 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-10 ${
                statusFilter === opt.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Agencies List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : filteredAgencies.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('noData')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAgencies.map((agency, idx) => (
            <motion.div
              key={agency.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {agency.name}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {getCategoryLabel(agency.category)}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {agency.plan === 'PREMIUM' ? t('premiumPlan') : t('basicPlan')}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              agency.status === 'ACTIVE'
                                ? 'text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                                : 'text-[10px] bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                            }
                          >
                            {agency.status === 'ACTIVE' ? t('active') : t('inactive')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:ms-auto">
                      {agency.status === 'ACTIVE' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
                          onClick={() => handleAction(agency.id, 'suspend')}
                          disabled={!!actionLoading}
                        >
                          <Ban className="h-3.5 w-3.5 me-1" />
                          {t('suspendAgency')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                          onClick={() => handleAction(agency.id, 'activate')}
                          disabled={!!actionLoading}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                          {t('active')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        onClick={() => handleAction(agency.id, 'delete')}
                        disabled={!!actionLoading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Agency Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createAgency')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('agencyName')}</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('agencyName')}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('agencyCategory')}</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 me-1.5" />}
              {t('createAgency')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
