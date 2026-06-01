import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, authErrorResponse } from '@/lib/auth-guard';

const SEED_FAQS = [
  {
    question: 'How long does activation take?',
    questionFr: "Combien de temps prend l'activation ?",
    questionAr: 'كم يستغرق التفعيل؟',
    answer: 'Your account is typically activated within 1-2 business days after payment verification.',
    answerFr: 'Votre compte est généralement activé sous 1-2 jours ouvrables après vérification du paiement.',
    answerAr: 'يتم تفعيل حسابك عادة خلال 1-2 يوم عمل بعد التحقق من الدفع.',
    category: 'SUBSCRIPTION',
    order: 0,
  },
  {
    question: 'Can I change plans?',
    questionFr: 'Puis-je changer de forfait ?',
    questionAr: 'هل يمكنني تغيير الباقة؟',
    answer: 'Yes, you can upgrade at any time. The price difference will be prorated.',
    answerFr: 'Oui, vous pouvez passer à un forfait supérieur à tout moment. La différence sera calculée au prorata.',
    answerAr: 'نعم، يمكنك الترقية في أي وقت. سيتم احتساب فرق السعر بشكل نسبي.',
    category: 'SUBSCRIPTION',
    order: 1,
  },
  {
    question: 'What happens when my subscription expires?',
    questionFr: "Que se passe-t-il quand l'abonnement expire ?",
    questionAr: 'ماذا يحدث عند انتهاء الاشتراك؟',
    answer: 'Your account reverts to the free tier. All data is preserved for 30 days.',
    answerFr: 'Votre compte revient au forfait gratuit. Toutes les données sont conservées pendant 30 jours.',
    answerAr: 'يعود حسابك إلى الباقة المجانية. يتم الاحتفاظ بجميع البيانات لمدة 30 يوماً.',
    category: 'SUBSCRIPTION',
    order: 2,
  },
  {
    question: 'Is there a free trial?',
    questionFr: 'Y a-t-il un essai gratuit ?',
    questionAr: 'هل توجد فترة تجريبية مجانية؟',
    answer: 'Yes! All new accounts get a 14-day free trial of the Premium plan.',
    answerFr: "Oui ! Tous les nouveaux comptes bénéficient d'un essai gratuit de 14 jours du forfait Premium.",
    answerAr: 'نعم! جميع الحسابات الجديدة تحصل على تجربة مجانية لمدة 14 يوماً من باقة بريميوم.',
    category: 'SUBSCRIPTION',
    order: 3,
  },
  {
    question: 'Can I get a refund?',
    questionFr: 'Puis-je obtenir un remboursement ?',
    questionAr: 'هل يمكنني استرداد المبلغ؟',
    answer: "Refunds are available within 7 days of purchase if the service hasn't been used.",
    answerFr: "Le remboursement est disponible sous 7 jours après l'achat si le service n'a pas été utilisé.",
    answerAr: 'الاسترداد متاح خلال 7 أيام من الشراء إذا لم يتم استخدام الخدمة.',
    category: 'SUBSCRIPTION',
    order: 4,
  },
];

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Check if FAQs already exist
    const existingCount = await db.fAQ.count();
    if (existingCount > 0) {
      return NextResponse.json({ message: 'FAQs already seeded', count: existingCount });
    }

    const created = await db.$transaction(
      SEED_FAQS.map((faq) => db.fAQ.create({ data: faq }))
    );

    return NextResponse.json({ message: 'FAQs seeded successfully', count: created.length });
  } catch (error) {
    return authErrorResponse(error);
  }
}
