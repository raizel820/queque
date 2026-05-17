'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { useUpload } from '@/hooks/use-upload';
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
  Info,
  CheckCircle2,
  ChevronDown,
  Zap,
  Building2,
  Shield,
  Globe,
  Users,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Plan comparison data
const PLAN_COMPARISON = {
  maxQueues: { basic: '5', premium: '15', enterprise: 'Unlimited' },
  maxServices: { basic: '3', premium: '10', enterprise: 'Unlimited' },
  maxStaff: { basic: '2', premium: '5', enterprise: 'Unlimited' },
  smsCreditsMonthly: { basic: '50', premium: '200', enterprise: '500' },
  analytics: { basic: 'basic', premium: 'full', enterprise: 'full' },
  apiAccess: { basic: false, premium: false, enterprise: true },
  prioritySupport: { basic: false, premium: false, enterprise: true },
  customBranding: { basic: false, premium: false, enterprise: true },
};

const FAQ_ITEMS = [
  { qKey: 'faqActivation', aKey: 'faqActivationAnswer' },
  { qKey: 'faqChangePlan', aKey: 'faqChangePlanAnswer' },
  { qKey: 'faqExpiry', aKey: 'faqExpiryAnswer' },
  { qKey: 'faqFreeTrial', aKey: 'faqFreeTrialAnswer' },
  { qKey: 'faqRefund', aKey: 'faqRefundAnswer' },
];

export function AgencySubscription() {
  const { user } = useAppStore();
  const { t, lang } = useLanguage();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('BASIC');
  const [paymentMethod, setPaymentMethod] = useState('CCP');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const receiptUpload = useUpload({
    type: 'receipt',
    maxSize: 5 * 1024 * 1024,
    onError: (error) => {
      toast.error(error);
    },
  });

  // FAQ expand state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Payment instructions expand state
  const [expandedInstructions, setExpandedInstructions] = useState<string | null>(null);

  // Derive current step for the progress stepper
  const currentStep = !selectedPlan || selectedPlan === data?.currentPlan
    ? 1
    : !receiptFile
      ? 2
      : 3;

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
    const params = user?.agencyId ? `?agencyId=${user.agencyId}` : '';
    const res = await fetch(`/api/agency/subscription${params}`);
    if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }

    setReceiptFile(file);

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
      // Upload receipt using useUpload hook (Vercel Blob in production, local in dev)
      const uploadResult = await receiptUpload.upload(receiptFile, {
        agencyId: user?.agencyId || '',
      });

      if (!uploadResult.url) {
        toast.error(uploadResult.error || t('error'));
        return;
      }

      const receiptUrl = uploadResult.url;

      const payForm = new FormData();
      payForm.append('plan', selectedPlan);
      payForm.append('method', paymentMethod);
      payForm.append('receiptUrl', receiptUrl);
      if (user?.agencyId) {
        payForm.append('agencyId', user.agencyId);
      }

      const res = await fetch('/api/agency/subscription/pay', {
        method: 'POST',
        body: payForm,
      });

      if (res.ok) {
        toast.success(t('submitPayment'));
        setSelectedPlan(data?.currentPlan || 'BASIC');
        handleRemoveFile();
        receiptUpload.reset();
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
      const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US';
      return new Date(dateStr).toLocaleDateString(locale, {
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

  // Plans array
  const plans = [
    {
      id: 'BASIC',
      name: t('basicPlan'),
      price: t('basicPrice'),
      features: t('basicFeatures').split(' • '),
      highlight: false,
      gradientFrom: 'from-gray-400',
      gradientTo: 'to-slate-500',
      icon: Building2,
    },
    {
      id: 'PREMIUM',
      name: t('premiumPlan'),
      price: t('premiumPrice'),
      features: t('premiumFeatures').split(' • '),
      highlight: true,
      badge: t('popular'),
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-teal-500',
      icon: Star,
    },
    {
      id: 'ENTERPRISE',
      name: t('enterprisePlan'),
      price: t('enterprisePrice'),
      features: t('enterpriseFeatures').split(' • '),
      highlight: true,
      badge: t('mostValue'),
      gradientFrom: 'from-slate-800',
      gradientTo: 'to-slate-900',
      isEnterprise: true,
      icon: Shield,
    },
  ];

  // Payment methods with instructions
  const paymentMethods = [
    {
      id: 'CCP',
      label: t('ccpTransfer'),
      instructions: t('ccpInstructions'),
      icon: '🏦',
    },
    {
      id: 'BANK_TRANSFER',
      label: t('bankTransfer'),
      instructions: t('bankInstructions'),
      icon: '🏦',
    },
    {
      id: 'ELECTRONIC',
      label: t('electronicPayment'),
      instructions: t('eWalletInstructions'),
      icon: '📱',
    },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl hidden sm:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <h1 className="text-2xl font-bold text-foreground">{t('subscription')}</h1>

      {/* Progress Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-0 py-2"
      >
        {[
          { step: 1, label: t('stepSelectPlan') },
          { step: 2, label: t('stepUploadReceipt') },
          { step: 3, label: t('stepSubmit') },
        ].map((item, idx) => (
          <div key={item.step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep >= item.step
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                }`}
              >
                {currentStep > item.step ? <Check className="h-3.5 w-3.5" /> : item.step}
              </div>
              <span className={`text-[10px] mt-1 hidden sm:block ${currentStep >= item.step ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </div>
            {idx < 2 && (
              <div className={`h-0.5 w-8 sm:w-16 mx-1 rounded-full transition-colors duration-300 ${currentStep > item.step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        ))}
      </motion.div>

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
                    {data?.currentPlan === 'PREMIUM' ? t('premiumPlan') : data?.currentPlan === 'ENTERPRISE' ? t('enterprisePlan') : t('basicPlan')}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        {plans.map((plan, idx) => {
          const isSelected = selectedPlan === plan.id;
          const isCurrent = data?.currentPlan === plan.id && !isSelected;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.05 }}
            >
              <motion.div
                animate={plan.highlight && isSelected ? { y: [0, -4, 0] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Card
                  className={`border-0 h-full cursor-pointer transition-all duration-300 overflow-hidden ${
                    plan.isEnterprise
                      ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-white'
                      : 'bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50'
                  } ${
                    isSelected
                      ? plan.isEnterprise
                        ? 'ring-2 ring-emerald-400 shadow-xl'
                        : 'ring-2 ring-emerald-500 shadow-xl'
                      : isCurrent
                        ? 'ring-2 ring-emerald-300 dark:ring-emerald-700 shadow-sm'
                        : 'hover:shadow-md shadow-sm'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {/* Gradient header stripe */}
                  <div className={`h-1.5 bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo}`} />

                  {/* Badge */}
                  {plan.badge && (
                    <div className={`px-3 py-1.5 text-center relative overflow-hidden ${
                      plan.isEnterprise
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
                        : 'bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500'
                    }`}>
                      <span className="text-xs font-semibold text-white flex items-center justify-center gap-1">
                        {plan.isEnterprise ? <Zap className="h-3 w-3" /> : <Star className="h-3 w-3 fill-amber-200" />}
                        {plan.badge}
                        {plan.isEnterprise ? <Zap className="h-3 w-3" /> : <Star className="h-3 w-3 fill-amber-200" />}
                      </span>
                    </div>
                  )}

                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-lg ${plan.isEnterprise ? 'text-white' : 'text-foreground'}`}>{plan.name}</h3>
                        {isSelected && (
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center shadow-sm ${plan.isEnterprise ? 'bg-emerald-600' : 'bg-emerald-600'}`}>
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                        {isCurrent && !isSelected && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${plan.isEnterprise ? 'text-emerald-300 bg-emerald-900/30' : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'}`}>{t('currentPlan')}</span>
                        )}
                      </div>
                    </div>
                    <p className={`text-2xl font-bold mb-4 ${plan.isEnterprise ? 'text-white' : 'text-foreground'}`}>{plan.price}</p>
                    <ul className="space-y-2.5">
                      {plan.features.map((f, i) => (
                        <li key={i} className={`flex items-center gap-2.5 text-sm ${plan.isEnterprise ? 'text-slate-300' : 'text-muted-foreground'}`}>
                          <svg viewBox="0 0 20 20" className="h-4 w-4 flex-shrink-0">
                            <circle cx="10" cy="10" r="9" className={plan.isEnterprise ? 'fill-emerald-900/50 stroke-emerald-700' : 'fill-emerald-50 dark:fill-emerald-900/30 stroke-emerald-200 dark:stroke-emerald-800'} strokeWidth="1" />
                            <path d="M6 10l3 3 5-6" className={plan.isEnterprise ? 'stroke-emerald-400' : 'stroke-emerald-600 dark:stroke-emerald-400'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Plan Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              {t('planComparison')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-3 px-3 text-xs font-semibold text-muted-foreground min-w-[120px]">{t('name')}</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">{t('basicPlan')}</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">{t('premiumPlan')}</th>
                    <th className="text-center py-3 px-3 text-xs font-semibold text-muted-foreground">{t('enterprisePlan')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: t('maxQueues'), values: [PLAN_COMPARISON.maxQueues.basic, PLAN_COMPARISON.maxQueues.premium, PLAN_COMPARISON.maxQueues.enterprise] },
                    { key: t('maxServices'), values: [PLAN_COMPARISON.maxServices.basic, PLAN_COMPARISON.maxServices.premium, PLAN_COMPARISON.maxServices.enterprise] },
                    { key: t('maxStaff'), values: [PLAN_COMPARISON.maxStaff.basic, PLAN_COMPARISON.maxStaff.premium, PLAN_COMPARISON.maxStaff.enterprise] },
                    { key: t('smsCreditsMonthly'), values: [PLAN_COMPARISON.smsCreditsMonthly.basic, PLAN_COMPARISON.smsCreditsMonthly.premium, PLAN_COMPARISON.smsCreditsMonthly.enterprise] },
                    { key: t('analytics'), values: [t('basicPlan').toLowerCase() + '/std', t('full'), t('full')] },
                    { key: t('apiAccess'), values: [false, false, true] },
                    { key: t('prioritySupport'), values: [false, false, true] },
                    { key: t('customBranding'), values: [false, false, true] },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2.5 px-3 text-xs text-muted-foreground font-medium">{row.key}</td>
                      {row.values.map((val, colIdx) => (
                        <td key={colIdx} className="text-center py-2.5 px-3">
                          {typeof val === 'boolean' ? (
                            val ? (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800">
                                <X className="h-3.5 w-3.5 text-gray-400" />
                              </span>
                            )
                          ) : (
                            <span className="text-xs font-medium text-foreground">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
              {paymentMethods.map((method) => (
                <div key={method.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="text-sm cursor-pointer flex items-center gap-2">
                      <span>{method.icon}</span>
                      {method.label}
                    </Label>
                  </div>
                  {/* Expandable Payment Instructions */}
                  <AnimatePresence>
                    {expandedInstructions === method.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="me-9 mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
                          <div className="flex items-start gap-2 mb-2">
                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t('paymentInstructions')}</p>
                              <p className="text-[11px] text-amber-600 dark:text-amber-300 mt-0.5">{t('paymentInstructionsDesc')}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{method.instructions}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Expand/Collapse button */}
                  <button
                    type="button"
                    onClick={() => setExpandedInstructions(expandedInstructions === method.id ? null : method.id)}
                    className="ms-9 text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {t('paymentInstructions')}
                    <motion.span
                      animate={{ rotate: expandedInstructions === method.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </motion.span>
                  </button>
                </div>
              ))}
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

            {/* Receipt Upload Success Indicator */}
            {receiptFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('receiptUploadedSuccess')}</p>
                  <p className="text-xs text-muted-foreground truncate">{receiptFile.name} &middot; {getFileSize()}</p>
                </div>
              </motion.div>
            )}

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

            {/* Payment Status Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30"
            >
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {t('paymentReviewInfo')}
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:border-gray-800/50 dark:backdrop-blur-sm dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              {t('faq')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i}>
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-start"
                  >
                    <span className="text-sm font-medium text-foreground">{t(item.qKey)}</span>
                    <motion.span
                      animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-muted-foreground px-3 pb-3 leading-relaxed">{t(item.aKey)}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      {data?.recentTransactions && data.recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
                        {tx.plan === 'PREMIUM' ? t('premiumPlan') : tx.plan === 'ENTERPRISE' ? t('enterprisePlan') : t('basicPlan')}
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
