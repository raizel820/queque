'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Crown,
  Check,
  Star,
  Upload,
  CreditCard,
  Loader2,
  X,
  FileText,
  ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  amount: number;
  plan: string;
  method: string;
  status: string;
  createdAt: string;
}

interface SubscriptionData {
  currentPlan: string;
  status: string;
  expiresAt?: string;
  recentTransactions: Transaction[];
}

export function AgencySubscription() {
  const { t } = useLanguage();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('BASIC');
  const [paymentMethod, setPaymentMethod] = useState('CCP');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agency/subscription');
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }

    setReceiptFile(file);

    // Generate preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitPayment = async () => {
    if (!receiptFile) {
      toast.error(t('uploadReceipt'));
      return;
    }

    setSubmitting(true);
    try {
      // First upload the file
      const uploadForm = new FormData();
      uploadForm.append('file', receiptFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json();
        toast.error(uploadData.error || t('error'));
        return;
      }

      const uploadData = await uploadRes.json();
      const receiptUrl = uploadData.url;

      // Then submit payment with the receipt URL
      const payForm = new FormData();
      payForm.append('plan', selectedPlan);
      payForm.append('method', paymentMethod);
      payForm.append('receiptUrl', receiptUrl);

      const res = await fetch('/api/agency/subscription/pay', {
        method: 'POST',
        body: payForm,
      });

      if (res.ok) {
        toast.success(t('submitPayment'));
        setSelectedPlan(data?.currentPlan || 'BASIC');
        handleRemoveFile();
        fetchSubscription();
      } else {
        const d = await res.json();
        toast.error(d.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-DZ', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getFileIcon = () => {
    if (!receiptFile) return null;
    if (receiptFile.type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (receiptFile.type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    return <FileText className="h-5 w-5" />;
  };

  const getFileSize = () => {
    if (!receiptFile) return '';
    const size = receiptFile.size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <h1 className="text-2xl font-bold text-foreground">{t('subscription')}</h1>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('currentPlan')}</p>
                  <p className="text-lg font-bold text-foreground">
                    {data?.currentPlan === 'PREMIUM' ? t('premiumPlan') : t('basicPlan')}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  data?.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
                }
              >
                {data?.status === 'ACTIVE' ? t('active') : t('pending')}
              </Badge>
            </div>
            {data?.expiresAt && (
              <p className="text-xs text-muted-foreground">
                {t('date')}: {formatDate(data.expiresAt)}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            id: 'BASIC',
            name: t('basicPlan'),
            price: t('basicPrice'),
            features: t('basicFeatures').split(' • '),
            highlight: false,
          },
          {
            id: 'PREMIUM',
            name: t('premiumPlan'),
            price: t('premiumPrice'),
            features: t('premiumFeatures').split(' • '),
            highlight: true,
          },
        ].map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + idx * 0.05 }}
          >
            <Card
              className={`border-0 shadow-sm h-full cursor-pointer transition-all bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50 ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-emerald-500 shadow-lg'
                  : 'hover:shadow-md'
              } ${plan.highlight && selectedPlan === plan.id ? 'ring-emerald-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.highlight && (
                <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-center">
                  <span className="text-xs font-semibold text-white flex items-center justify-center gap-1">
                    <Star className="h-3 w-3" />
                    Popular
                  </span>
                </div>
              )}
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                  {selectedPlan === plan.id && (
                    <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mb-4">{plan.price}</p>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              {t('submitPayment')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Method */}
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex gap-4">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="CCP" id="ccp" />
                <Label htmlFor="ccp" className="text-sm">{t('ccpTransfer')}</Label>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <RadioGroupItem value="BANK" id="bank" />
                <Label htmlFor="bank" className="text-sm">{t('bankTransfer')}</Label>
              </div>
            </RadioGroup>

            {/* Upload Receipt */}
            <div className="space-y-2">
              <Label>{t('uploadReceipt')}</Label>

              {receiptFile && receiptPreview ? (
                <div className="relative rounded-xl border border-border overflow-hidden">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="max-h-48 w-full object-contain bg-gray-50 dark:bg-gray-900"
                  />
                  <button
                    onClick={handleRemoveFile}
                    className="absolute top-2 end-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : receiptFile ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-gray-50 dark:bg-gray-900">
                  {getFileIcon()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{receiptFile.name}</p>
                    <p className="text-xs text-muted-foreground">{getFileSize()}</p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="h-7 w-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{t('uploadReceipt')}</p>
                    <p className="text-xs text-muted-foreground">{t('receiptNote')}</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl"
              onClick={handleSubmitPayment}
              disabled={submitting || !receiptFile}
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5 me-2" />
              )}
              {t('submitPayment')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      {data?.recentTransactions && data.recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('transactions')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.plan === 'PREMIUM' ? t('premiumPlan') : t('basicPlan')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)} · {tx.method}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-semibold text-foreground">{tx.amount} {t('currency')}</p>
                      <Badge
                        variant="outline"
                        className={
                          tx.status === 'APPROVED'
                            ? 'text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                            : tx.status === 'PENDING'
                            ? 'text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
                            : 'text-[10px] bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                        }
                      >
                        {tx.status === 'APPROVED' ? t('approved') : tx.status === 'PENDING' ? t('pending') : t('rejected')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
