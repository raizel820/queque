'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { useLanguage } from '@/hooks/use-language';
import { useUpload } from '@/hooks/use-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  ChevronLeft,
  ChevronRight,
  Building2,
  Shield,
  MessageSquare,
  Landmark,
  Wallet,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Clock,
  ListChecks,
  CircleDollarSign,
  Receipt,
  AlertCircle,
  PartyPopper,
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

// Plan comparison data (NO ENTERPRISE)
const PLAN_COMPARISON = {
  maxQueues: { basic: '5', premium: '15' },
  maxServices: { basic: '3', premium: '10' },
  maxStaff: { basic: '2', premium: '5' },
  smsCreditsMonthly: { basic: '50', premium: '200' },
  analytics: { basic: 'basic', premium: 'full' },
  apiAccess: { basic: false, premium: false },
  prioritySupport: { basic: false, premium: false },
  customBranding: { basic: false, premium: false },
};

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

// ─── Payment Dialog Component ───
function PaymentDialog({
  open,
  onOpenChange,
  selectedPlan,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: string;
  onSuccess: () => void;
}) {
  const { user } = useAppStore();
  const { t, lang } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState('CCP');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedInstructions, setExpandedInstructions] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState(1); // 1=method, 2=receipt, 3=review
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const receiptUpload = useUpload({
    type: 'receipt',
    maxSize: 5 * 1024 * 1024,
    onError: (error) => {
      toast.error(error);
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPaymentStep(1);
      setPaymentMethod('CCP');
      setReceiptFile(null);
      setReceiptPreview(null);
      setExpandedInstructions(null);
      setShowSuccessAnimation(false);
    }
  }, [open]);

  const getPlanName = (plan: string) => {
    if (plan === 'PREMIUM') return t('premiumPlan');
    return t('basicPlan');
  };

  const getPlanPrice = (plan: string) => {
    if (plan === 'PREMIUM') return t('premiumPrice');
    return t('basicPrice');
  };

  const getPlanAmount = (plan: string) => {
    if (plan === 'PREMIUM') return '3,000';
    return '2,000';
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === 'CCP') return t('ccpTransfer');
    if (method === 'BANK_TRANSFER') return t('bankTransfer');
    return t('electronicPayment');
  };

  const paymentMethods = [
    {
      id: 'CCP',
      label: t('ccpTransfer'),
      instructions: t('ccpInstructions'),
      icon: Landmark,
      description: lang === 'ar' ? 'تحويل عبر بريد الجزائر' : lang === 'fr' ? 'Virement via Poste Algérienne' : 'Transfer via Algerian Post',
    },
    {
      id: 'BANK_TRANSFER',
      label: t('bankTransfer'),
      instructions: t('bankInstructions'),
      icon: Building2,
      description: lang === 'ar' ? 'تحويل مصرفي مباشر' : lang === 'fr' ? 'Virement bancaire direct' : 'Direct bank transfer',
    },
    {
      id: 'ELECTRONIC',
      label: t('electronicPayment'),
      instructions: t('eWalletInstructions'),
      icon: Wallet,
      description: lang === 'ar' ? 'باريدي موب أو محفظة إلكترونية' : lang === 'fr' ? 'BaridiMob ou e-wallet' : 'BaridiMob or e-wallet',
    },
  ];

  const dialogSteps = [
    { step: 1, label: t('stepPaymentMethod'), icon: CreditCard },
    { step: 2, label: t('stepReceipt'), icon: Upload },
    { step: 3, label: t('stepReview'), icon: CheckCircle2 },
  ];

  const getFileSize = () => {
    if (!receiptFile) return '';
    const size = receiptFile.size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.some((type) => file.type.startsWith(type))) {
      toast.error(t('receiptNote'));
      return;
    }
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  }, [t]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitPayment = async () => {
    if (!receiptFile) {
      toast.error(t('uploadReceipt'));
      return;
    }
    setSubmitting(true);
    try {
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
      if (user?.agencyId) payForm.append('agencyId', user.agencyId);

      const res = await fetch('/api/agency/subscription/pay', {
        method: 'POST',
        body: payForm,
      });

      if (res.ok) {
        setShowSuccessAnimation(true);
        toast.success(t('submitPayment'));
        handleRemoveFile();
        receiptUpload.reset();
        // Auto close after success animation
        setTimeout(() => {
          setShowSuccessAnimation(false);
          onOpenChange(false);
          onSuccess();
        }, 3000);
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

  const canGoNext = () => {
    if (paymentStep === 1) return !!paymentMethod;
    if (paymentStep === 2) return !!receiptFile;
    return true;
  };

  const handleNext = () => {
    if (paymentStep < 3 && canGoNext()) {
      setPaymentStep(paymentStep + 1);
    } else if (paymentStep === 3) {
      handleSubmitPayment();
    }
  };

  const handleBack = () => {
    if (paymentStep > 1) setPaymentStep(paymentStep - 1);
  };

  // Plan info for header
  const planIcon = selectedPlan === 'PREMIUM' ? Star : Building2;
  const PlanIcon = planIcon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" showCloseButton={!submitting}>
        {/* ─── Dialog Header with Plan Info ─── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-5 text-white">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute bottom-2 -left-4 h-16 w-16 rounded-full bg-white/5" />

          {!showSuccessAnimation ? (
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  {t('paymentDialogTitle')}
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-sm">
                  {t('paymentDialogDesc')}
                </DialogDescription>
              </DialogHeader>
              {/* Selected plan badge */}
              <div className="mt-3 flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl p-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <PlanIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{getPlanName(selectedPlan)}</p>
                  <p className="text-xs text-emerald-100">{getPlanPrice(selectedPlan)}</p>
                </div>
                <div className="text-end">
                  <p className="text-xl font-extrabold text-white">{getPlanAmount(selectedPlan)}</p>
                  <p className="text-[10px] text-emerald-100">{t('currency')}/{t('perMonth')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
                >
                  <Check className="h-8 w-8 text-white" strokeWidth={3} />
                </motion.div>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-bold text-white mb-1"
              >
                {t('success')}!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-emerald-100 text-center"
              >
                {t('paymentReviewInfo')}
              </motion.p>
            </div>
          )}
        </div>

        {/* ─── Step Indicator ─── */}
        {!showSuccessAnimation && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              {dialogSteps.map((item, idx) => {
                const StepIcon = item.icon;
                const isActive = paymentStep >= item.step;
                const isCurrent = paymentStep === item.step;
                const isCompleted = paymentStep > item.step;
                return (
                  <div key={item.step} className="flex items-center flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <StepIcon className="h-3.5 w-3.5" />
                        )}
                      </motion.div>
                      <span className={`text-[11px] font-medium transition-colors duration-300 hidden sm:block ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    {idx < dialogSteps.length - 1 && (
                      <div className="relative h-0.5 flex-1 mx-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: isCompleted ? '100%' : isCurrent ? '50%' : '0%' }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Step Content ─── */}
        {!showSuccessAnimation && (
          <div className="px-5 py-4 min-h-[320px]">
            <AnimatePresence mode="wait">
              {/* Step 1: Payment Method */}
              {paymentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                      {lang === 'ar' ? 'اختر طريقة الدفع' : lang === 'fr' ? 'Choisir la méthode de paiement' : 'Choose Payment Method'}
                    </Label>
                    <div className="space-y-2.5">
                      {paymentMethods.map((method) => {
                        const MethodIcon = method.icon;
                        const isSelected = paymentMethod === method.id;
                        const isExpanded = expandedInstructions === method.id;

                        return (
                          <div key={method.id} className="space-y-1.5">
                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setPaymentMethod(method.id)}
                              className={`relative cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-300 ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:border-emerald-300 dark:hover:border-emerald-700'
                              }`}
                            >
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 end-2 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
                                >
                                  <Check className="h-3 w-3 text-white" />
                                </motion.div>
                              )}
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  <MethodIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground">{method.label}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{method.description}</p>
                                </div>
                              </div>
                            </motion.div>

                            {/* Expand/Collapse instructions */}
                            <button
                              type="button"
                              onClick={() => setExpandedInstructions(isExpanded ? null : method.id)}
                              className={`w-full text-xs flex items-center justify-center gap-1 py-1 rounded-lg transition-colors ${
                                isSelected
                                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:hover:bg-gray-800/30'
                              }`}
                            >
                              {t('paymentInstructions')}
                              <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="h-3 w-3" />
                              </motion.span>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Receipt Upload */}
              {paymentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    {t('uploadReceipt')}
                  </Label>

                  {receiptFile && receiptPreview ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-xl border border-border overflow-hidden"
                    >
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
                    </motion.div>
                  ) : receiptFile ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        {receiptFile.type === 'application/pdf' ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
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
                    </motion.div>
                  ) : (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ${
                        isDragOver
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 scale-[1.01]'
                          : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'
                      }`}
                    >
                      <label className="flex flex-col items-center justify-center gap-3 p-8 cursor-pointer">
                        <motion.div
                          animate={isDragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                          className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors ${
                            isDragOver
                              ? 'bg-emerald-200 dark:bg-emerald-800/50'
                              : 'bg-emerald-100 dark:bg-emerald-900/30'
                          }`}
                        >
                          <Upload className={`h-7 w-7 transition-colors ${
                            isDragOver ? 'text-emerald-700 dark:text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'
                          }`} />
                        </motion.div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">
                            {isDragOver
                              ? (lang === 'ar' ? 'أفلت الملف هنا' : lang === 'fr' ? 'Déposez le fichier ici' : 'Drop file here')
                              : t('uploadReceipt')
                            }
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{t('receiptNote')}</p>
                          <div className="flex items-center justify-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <ImageIcon className="h-3 w-3" /> JPG, PNG
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <FileText className="h-3 w-3" /> PDF
                            </span>
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {receiptUpload.uploading && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {lang === 'ar' ? 'جاري الرفع...' : lang === 'fr' ? 'Téléchargement...' : 'Uploading...'}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{receiptUpload.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${receiptUpload.progress}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Receipt Upload Success Indicator */}
                  {receiptFile && !receiptUpload.uploading && (
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

                  {/* Info box */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      {t('receiptNote')}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review & Submit */}
              {paymentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Order Summary Card */}
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-b from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 p-4">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                        {lang === 'ar' ? 'ملخص الطلب' : lang === 'fr' ? 'Résumé de la commande' : 'Order Summary'}
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{t('selectPlan')}</span>
                          <span className="text-sm font-medium text-foreground">{getPlanName(selectedPlan)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {lang === 'ar' ? 'طريقة الدفع' : lang === 'fr' ? 'Mode de paiement' : 'Payment Method'}
                          </span>
                          <span className="text-sm font-medium text-foreground">{getPaymentMethodLabel(paymentMethod)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{t('uploadReceipt')}</span>
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('receiptUploadedSuccess')}
                          </span>
                        </div>
                        <Separator className="bg-emerald-200/50 dark:bg-emerald-800/30" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {lang === 'ar' ? 'المجموع' : 'Total'}
                          </span>
                          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                            {getPlanAmount(selectedPlan)} {t('currency')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment review info */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
                      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        {t('paymentReviewInfo')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ─── Dialog Footer with Navigation ─── */}
        {!showSuccessAnimation && (
          <DialogFooter className="px-5 pb-5 pt-2 gap-2 sm:gap-0 border-t border-border/50">
            <div className="flex items-center gap-2 w-full">
              {paymentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={submitting}
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''} me-1`} />
                  {t('back')}
                </Button>
              )}
              <Button
                className={`bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold ${
                  paymentStep === 1 ? 'w-full' : 'flex-1'
                }`}
                onClick={handleNext}
                disabled={submitting || !canGoNext()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : paymentStep === 3 ? (
                  <Check className="h-4 w-4 me-2" />
                ) : (
                  <ChevronRight className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''} me-1`} />
                )}
                {paymentStep === 3 ? t('confirm') : t('next')}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Subscription Component ───
export function AgencySubscription() {
  const { user } = useAppStore();
  const { t, lang } = useLanguage();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('BASIC');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // FAQ expand state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    fetchSubscription();
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch(`/api/faqs?category=SUBSCRIPTION&lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
      }
    } catch {
      // silently fail, FAQs are not critical
    }
  };

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const params = user?.agencyId ? `?agencyId=${user.agencyId}` : '';
      const res = await fetch(`/api/agency/subscription${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
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

  const getPlanName = (plan: string) => {
    if (plan === 'PREMIUM') return t('premiumPlan');
    return t('basicPlan');
  };

  const getPlanPrice = (plan: string) => {
    if (plan === 'PREMIUM') return t('premiumPrice');
    return t('basicPrice');
  };

  const getPlanAmount = (plan: string) => {
    if (plan === 'PREMIUM') return '3,000';
    return '2,000';
  };

  const getPaymentMethodLabel = (method: string) => {
    if (method === 'CCP') return t('ccpTransfer');
    if (method === 'BANK_TRANSFER') return t('bankTransfer');
    return t('electronicPayment');
  };

  // Plans array (NO ENTERPRISE)
  const plans = [
    {
      id: 'BASIC',
      name: t('basicPlan'),
      price: t('basicPrice'),
      priceShort: '2,000 DZD',
      features: t('basicFeatures').split(' • '),
      highlight: false,
      gradientFrom: 'from-emerald-400',
      gradientTo: 'to-teal-500',
      icon: Building2,
      description: lang === 'ar' ? 'للأعمال الصغيرة' : lang === 'fr' ? 'Pour petites entreprises' : 'For small businesses',
    },
    {
      id: 'PREMIUM',
      name: t('premiumPlan'),
      price: t('premiumPrice'),
      priceShort: '3,000 DZD',
      features: t('premiumFeatures').split(' • '),
      highlight: true,
      badge: t('popular'),
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-teal-600',
      icon: Star,
      description: lang === 'ar' ? 'للأعمال المتنامية' : lang === 'fr' ? 'Pour entreprises en croissance' : 'For growing businesses',
    },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ─── Header Section with Gradient ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white shadow-lg"
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute bottom-4 -left-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('subscription')}</h1>
                <p className="text-emerald-100 text-sm mt-0.5">
                  {t('currentPlan')}: <span className="font-semibold text-white">{getPlanName(data?.currentPlan || 'BASIC')}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm">
                {data?.status === 'ACTIVE' ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('active')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {t('pending')}
                  </span>
                )}
              </Badge>
              {data?.expiresAt && (
                <span className="text-xs text-emerald-100 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('date')}: {formatDate(data.expiresAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Plan Cards (2 columns) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {plans.map((plan, idx) => {
          const isSelected = selectedPlan === plan.id;
          const isCurrent = data?.currentPlan === plan.id;
          const PlanIcon = plan.icon;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <Card
                className={`relative h-full transition-all duration-300 overflow-hidden border-2 flex flex-col ${
                  isSelected
                    ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 bg-white dark:bg-gray-900/90'
                    : isCurrent
                      ? 'border-emerald-300 dark:border-emerald-700 shadow-sm bg-white dark:bg-gray-900/80'
                      : 'border-transparent shadow-sm hover:shadow-md bg-white dark:bg-gray-900/80'
                }`}
              >
                {/* Glow effect when selected */}
                {isSelected && (
                  <motion.div
                    layoutId="plan-glow"
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-emerald-500/5 to-teal-500/5 pointer-events-none"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Gradient header stripe */}
                <div className={`h-2 bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo}`} />

                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute top-4 end-4">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm">
                      <Sparkles className="h-3 w-3 text-white" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">{plan.badge}</span>
                    </div>
                  </div>
                )}

                <CardContent className="p-5 flex-1 flex flex-col">
                  {/* Plan icon & name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${plan.gradientFrom} ${plan.gradientTo} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <PlanIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4 pb-4 border-b border-border/50">
                    <p className="text-3xl font-extrabold text-foreground">
                      {plan.priceShort}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('perMonth')}</p>
                  </div>

                  {/* Current plan indicator */}
                  {isCurrent && !isSelected && (
                    <div className="mb-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('currentPlan')}
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  <div className="mt-5">
                    {isCurrent && data?.status === 'ACTIVE' ? (
                      <Button
                        className="w-full h-11 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-default rounded-xl"
                        disabled
                      >
                        <CheckCircle2 className="h-4 w-4 me-2" />
                        {t('currentPlan')}
                      </Button>
                    ) : (
                      <Button
                        className={`w-full h-11 font-semibold rounded-xl shadow-lg transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20'
                            : 'bg-white dark:bg-gray-800 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        }`}
                        onClick={() => {
                          setSelectedPlan(plan.id);
                          setShowPaymentDialog(true);
                        }}
                      >
                        <ArrowRight className="h-4 w-4 me-2" />
                        {t('goToPayment')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Plan Comparison Table ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:shadow-gray-900/50 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              {t('planComparison')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                    <th className="text-start py-3 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 min-w-[130px]">{t('name')}</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <div className="flex flex-col items-center gap-0.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {t('basicPlan')}
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <div className="flex flex-col items-center gap-0.5">
                        <Star className="h-3.5 w-3.5" />
                        {t('premiumPlan')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: t('maxQueues'), values: [PLAN_COMPARISON.maxQueues.basic, PLAN_COMPARISON.maxQueues.premium] },
                    { key: t('maxServices'), values: [PLAN_COMPARISON.maxServices.basic, PLAN_COMPARISON.maxServices.premium] },
                    { key: t('maxStaff'), values: [PLAN_COMPARISON.maxStaff.basic, PLAN_COMPARISON.maxStaff.premium] },
                    { key: t('smsCreditsMonthly'), values: [PLAN_COMPARISON.smsCreditsMonthly.basic, PLAN_COMPARISON.smsCreditsMonthly.premium] },
                    { key: t('analytics'), values: [t('basicPlan').toLowerCase(), t('full' as any)] },
                    { key: t('apiAccess'), values: [false, false] },
                    { key: t('prioritySupport'), values: [false, false] },
                    { key: t('customBranding'), values: [false, false] },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground font-medium">{row.key}</td>
                      {row.values.map((val, colIdx) => (
                        <td key={colIdx} className="text-center py-2.5 px-4">
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

      {/* ─── FAQ Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:shadow-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              {t('faq')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {faqs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">{t('faqNoItems') || 'No FAQs available.'}</p>
              </div>
            ) : (
            <div className="space-y-2">
              {faqs.map((item, i) => (
                <div key={item.id}>
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-start"
                  >
                    <span className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground flex-1">{item.question}</span>
                    <motion.span
                      animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
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
                        <p className="text-sm text-muted-foreground ps-12 pe-3 pb-3 leading-relaxed">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Transaction History ─── */}
      {data?.recentTransactions && data.recentTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-900/80 dark:shadow-gray-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                {t('transactions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.recentTransactions.map((tx) => {
                  const isApproved = tx.status === 'APPROVED';
                  const isPending = tx.status === 'PENDING';

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-border/30"
                    >
                      {/* Status icon */}
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isApproved
                          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                          : isPending
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {isApproved ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : isPending ? (
                          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{getPlanName(tx.plan)}</p>
                          <Badge
                            variant="outline"
                            className={
                              isApproved
                                ? 'text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                                : isPending
                                  ? 'text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200'
                                  : 'text-[10px] bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
                            }
                          >
                            {isApproved ? t('approved') : isPending ? t('pending') : t('rejected')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(tx.createdAt)} &middot; {getPaymentMethodLabel(tx.method)}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-end flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">{tx.amount} {t('currency')}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Payment Dialog ─── */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        selectedPlan={selectedPlan}
        onSuccess={fetchSubscription}
      />
    </div>
  );
}
