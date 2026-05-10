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
  CreditCard,
  Check,
  X,
  Eye,
  Loader2,
  Image as ImageIcon,
  Building2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PendingPayment {
  id: string;
  agencyName: string;
  amount: number;
  plan: string;
  method: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
}

export function AdminTransactions() {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Receipt preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions?status=PENDING');
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.transactions ?? []).map((tx: Record<string, unknown>) => {
          const agency = tx.agency as Record<string, string> | undefined;
          return {
            id: tx.id,
            agencyName: agency?.name || 'Unknown Agency',
            amount: tx.amount as number,
            plan: tx.plan as string,
            method: tx.paymentMethod as string,
            status: tx.status as string,
            receiptUrl: (tx.receiptUrl as string) || undefined,
            createdAt: tx.createdAt as string,
          };
        });
        setPayments(mapped);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (res.ok) {
        toast.success(t('approveTransaction'));
        fetchPayments();
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

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) {
      toast.error(t('requiredField'));
      return;
    }
    setActionLoading(rejectId);
    try {
      const res = await fetch(`/api/admin/transactions/${rejectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason }),
      });
      if (res.ok) {
        toast.success(t('rejectTransaction'));
        setRejectDialogOpen(false);
        setRejectId(null);
        setRejectReason('');
        fetchPayments();
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectId(id);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const openPreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <h1 className="text-2xl font-bold text-foreground">{t('pendingPayments')}</h1>

      {payments.length === 0 ? (
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardContent className="py-16 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('noData')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment, idx) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Agency Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {payment.agencyName}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {payment.plan === 'PREMIUM' ? t('premiumPlan') : t('basicPlan')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{payment.method}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount + Actions */}
                    <div className="flex items-center gap-3 sm:ms-auto">
                      <div className="text-end me-2">
                        <p className="text-lg font-bold text-foreground">
                          {payment.amount.toLocaleString()} {t('currency')}
                        </p>
                      </div>

                      {payment.receiptUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-3"
                          onClick={() => openPreview(payment.receiptUrl!)}
                        >
                          <ImageIcon className="h-4 w-4 me-1.5" />
                          <span className="hidden sm:inline">{t('viewDetails')}</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(payment.id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === payment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 me-1.5" />
                        )}
                        {t('approveTransaction')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        onClick={() => openRejectDialog(payment.id)}
                        disabled={!!actionLoading}
                      >
                        <X className="h-4 w-4 me-1.5" />
                        {t('rejectTransaction')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('rejectTransaction')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('rejectionReason')}</Label>
              <textarea
                className="w-full min-h-24 p-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('rejectionReason')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={actionLoading === rejectId}
            >
              {actionLoading === rejectId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4 me-1.5" />
              )}
              {t('rejectTransaction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('paymentProof')}</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Receipt"
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            ) : (
              <p className="text-muted-foreground">{t('noData')}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
