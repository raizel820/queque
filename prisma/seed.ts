import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const db = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Clean up existing data (order matters for FK constraints) ─────────────────
  console.log('🧹 Cleaning existing data...');
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.smsLog.deleteMany();
  await db.globalAnnouncement.deleteMany();
  await db.announcement.deleteMany();
  await db.review.deleteMany();
  await db.reservation.deleteMany();
  await db.transaction.deleteMany();
  await db.favorite.deleteMany();
  await db.counter.deleteMany();
  await db.agencyStaff.deleteMany();
  await db.branch.deleteMany();
  await db.queueSettings.deleteMany();
  await db.service.deleteMany();
  await db.smsPurchase.deleteMany();
  await db.smsSettings.deleteMany();
  await db.paymentSettings.deleteMany();
  await db.fAQ.deleteMany();
  await db.agency.deleteMany();
  await db.user.deleteMany();

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 1. Create Admin User ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('👤 Creating admin user...');

  const admin = await db.user.create({
    data: {
      username: 'admin',
      fullName: 'Platform Admin',
      passwordHash: hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      language: 'ar',
      email: 'admin@blasti.dz',
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 2. Create Demo Agency (owned by admin) ───────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🏢 Creating demo agency...');

  const agency = await db.agency.create({
    data: {
      name: 'BLASTI Demo Agency',
      nameAr: 'بلاصتي وكالة تجريبية',
      nameFr: 'BLASTI Agence Démo',
      customCode: 'DEMO001',
      category: 'AGENCY',
      address: 'M\'Sila, Algeria',
      city: 'M\'Sila',
      wilaya: '28',
      phone: '+213 00 00 00 00',
      email: 'demo@blasti.dz',
      description: 'Welcome to your BLASTI demo agency! This is a fresh setup — customize everything from the agency dashboard.',
      descriptionAr: 'مرحباً بك في وكالتك التجريبية! هذا إعداد جديد — قم بتخصيص كل شيء من لوحة التحكم.',
      descriptionFr: 'Bienvenue dans votre agence démo BLASTI! Configuration fraîche — personnalisez tout depuis le tableau de bord.',
      averageServiceTime: 10,
      maxActiveReservations: 50,
      autoPauseWhenFull: false,
      isSponsored: false,
      subscriptionTier: 'BASIC',
      subscriptionStatus: 'TRIAL',
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      isQueueOpen: true,
      isActive: true,
      kioskModeEnabled: false,
      ownerId: admin.id,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 3. Create Main Branch ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🌿 Creating main branch...');

  const mainBranch = await db.branch.create({
    data: {
      name: 'Main Branch',
      nameAr: 'الفرع الرئيسي',
      nameFr: 'Branche Principale',
      address: 'M\'Sila, Algeria',
      phone: '+213 00 00 00 00',
      isActive: true,
      isMain: true,
      agencyId: agency.id,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 4. Create Default Counter ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('🔢 Creating default counter...');

  const counter1 = await db.counter.create({
    data: {
      number: 1,
      name: 'Counter 1',
      nameAr: 'الشباك 1',
      nameFr: 'Guichet 1',
      isActive: true,
      branchId: mainBranch.id,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 5. Create Default Service ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📋 Creating default service...');

  await db.service.create({
    data: {
      agencyId: agency.id,
      name: 'General Service',
      nameAr: 'خدمة عامة',
      nameFr: 'Service Général',
      description: 'Default general service queue',
      prefix: 'A',
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 6. Create Queue Settings ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('⚙️ Creating queue settings...');

  await db.queueSettings.create({
    data: {
      agencyId: agency.id,
      currentServingNumber: 0,
      lastIssuedNumber: 0,
      isPaused: false,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 7. Create Admin as Agency Staff (OWNER role) ────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('👨‍💼 Creating admin as agency staff...');

  await db.agencyStaff.create({
    data: {
      userId: admin.id,
      agencyId: agency.id,
      branchId: mainBranch.id,
      role: 'OWNER',
      permissions: JSON.stringify({
        canManageQueue: true,
        canManageServices: true,
        canManageStaff: true,
        canViewAnalytics: true,
        canManageBranches: true,
        canManageWorkingHours: true,
        canExportData: true,
        canManageProfile: true,
      }),
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 8. Create SMS Settings (disabled by default) ────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('📱 Creating SMS settings...');

  await db.smsSettings.create({
    data: {
      provider: 'algeria_sms',
      apiUrl: '',
      apiKey: '',
      senderName: 'BLASTI',
      enabled: false,
      smsPerReminder: 1,
      maxSmsPerDay: 5,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 9. Create Payment Settings (disabled by default) ────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('💳 Creating payment settings...');

  await db.paymentSettings.create({
    data: {
      ccpEnabled: false,
      bankEnabled: false,
      electronicEnabled: false,
      ccpAccount: '',
      ccpKey: '',
      bankName: '',
      bankAccount: '',
      bankRib: '',
      ewalletNumber: '',
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 10. Create FAQ Entries ──────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('❓ Creating FAQ entries...');

  const faqs = [
    {
      question: 'How do I join a queue?',
      questionAr: 'كيف أنضم إلى الطابور؟',
      questionFr: 'Comment rejoindre la file d\'attente?',
      answer: 'Search for the agency, select the service you need, and tap "Join Queue". You\'ll get a ticket number and estimated wait time.',
      answerAr: 'ابحث عن الوكالة، اختر الخدمة التي تحتاجها، واضغط "انضمام للطابور". ستحصل على رقم تذكرة ووقت الانتظار المتوقع.',
      answerFr: 'Recherchez l\'agence, sélectionnez le service dont vous avez besoin, et appuyez sur "Rejoindre la file". Vous recevrez un numéro de ticket et un temps d\'attente estimé.',
      category: 'QUEUE',
      order: 1,
    },
    {
      question: 'How do I cancel my reservation?',
      questionAr: 'كيف ألغي حجزي؟',
      questionFr: 'Comment annuler ma réservation?',
      answer: 'Go to "My Queue" and tap "Cancel" on your active ticket. You can cancel at any time before being called.',
      answerAr: 'اذهب إلى "طابوري" واضغط "إلغاء" على التذكرة النشطة. يمكنك الإلغاء في أي وقت قبل أن يُنادى دورك.',
      answerFr: 'Allez dans "Ma file" et appuyez sur "Annuler" sur votre ticket actif. Vous pouvez annuler à tout moment avant d\'être appelé.',
      category: 'QUEUE',
      order: 2,
    },
    {
      question: 'What subscription plans are available?',
      questionAr: 'ما هي خطط الاشتراك المتاحة؟',
      questionFr: 'Quels plans d\'abonnement sont disponibles?',
      answer: 'BLASTI offers three plans: Basic (free, 1 branch, 50 reservations/day), Premium (5 branches, unlimited reservations), and Enterprise (unlimited everything with priority support).',
      answerAr: 'بلاصتي تقدم ثلاث خطط: أساسي (مجاني، فرع واحد، 50 حجز/يوم)، مميز (5 فروع، حجز غير محدود)، ومؤسسي (غير محدود مع دعم أولوي).',
      answerFr: 'BLASTI propose trois plans: Basique (gratuit, 1 branche, 50 réservations/jour), Premium (5 branches, réservations illimitées), et Entreprise (illimité avec support prioritaire).',
      category: 'SUBSCRIPTION',
      order: 3,
    },
    {
      question: 'How do I pay for a subscription?',
      questionAr: 'كيف أدفع الاشتراك؟',
      questionFr: 'Comment payer un abonnement?',
      answer: 'Go to Subscription in your agency dashboard, choose a plan, and select your payment method (CCP, bank transfer, or e-wallet). Follow the instructions to complete the payment.',
      answerAr: 'اذهب إلى الاشتراك في لوحة تحكم الوكالة، اختر خطة، واختر طريقة الدفع (بريد، تحويل بنكي، أو محفظة إلكترونية). اتبع التعليمات لإتمام الدفع.',
      answerFr: 'Allez dans Abonnement dans votre tableau de bord d\'agence, choisissez un plan, et sélectionnez votre méthode de paiement (CCP, virement bancaire, ou e-portefeuille).',
      category: 'PAYMENT',
      order: 4,
    },
    {
      question: 'How do SMS notifications work?',
      questionAr: 'كيف تعمل إشعارات الرسائل القصيرة؟',
      questionFr: 'Comment fonctionnent les notifications SMS?',
      answer: 'When enabled, BLASTI sends SMS reminders when your turn is approaching and when it\'s your turn. Agency owners can configure SMS settings from the dashboard.',
      answerAr: 'عند التفعيل، بلاصتي ترسل تذكيرات بالرسائل القصيرة عندما يقترب دورك وعندما يحين دورك. يمكن لملاك الوكالات تهيئة الإعدادات من لوحة التحكم.',
      answerFr: 'Une fois activés, BLASTI envoie des rappels SMS lorsque votre tour approche et quand c\'est votre tour. Les propriétaires d\'agences peuvent configurer les paramètres SMS.',
      category: 'SMS',
      order: 5,
    },
    {
      question: 'What is the no-show policy?',
      questionAr: 'ما هي سياسة عدم الحضور؟',
      questionFr: 'Quelle est la politique d\'absence?',
      answer: 'If you don\'t show up when your number is called, your ticket will be marked as no-show. You can reclaim your position within a limited time from the app.',
      answerAr: 'إذا لم تحضر عندما يُنادى رقمك، ستُعلّم تذكرتك بعدم الحضور. يمكنك استعادة موقعك خلال وقت محدود من التطبيق.',
      answerFr: 'Si vous ne vous présentez pas quand votre numéro est appelé, votre ticket sera marqué comme absent. Vous pouvez récupérer votre position dans un délai limité.',
      category: 'QUEUE',
      order: 6,
    },
    {
      question: 'How do I create an agency account?',
      questionAr: 'كيف أنشئ حساب وكالة؟',
      questionFr: 'Comment créer un compte d\'agence?',
      answer: 'Register with the "Agency" tab, then create your agency from the dashboard. You can add branches, services, and staff members.',
      answerAr: 'سجّل من تبويب "الوكالة"، ثم أنشئ وكالتك من لوحة التحكم. يمكنك إضافة فروع وخدمات وموظفين.',
      answerFr: 'Inscrivez-vous avec l\'onglet "Agence", puis créez votre agence depuis le tableau de bord. Vous pouvez ajouter des branches, services et employés.',
      category: 'GENERAL',
      order: 7,
    },
  ];

  for (const faq of faqs) {
    await db.fAQ.create({ data: faq });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 11. No initial announcements (clean slate) ─────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  // Announcements are NOT created — admin can create them from the dashboard

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 13. Create Customer Test User ────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('👤 Creating customer test user...');

  const customer = await db.user.create({
    data: {
      username: 'customer1',
      fullName: 'أحمد محمد',
      passwordHash: hashPassword('customer123'),
      role: 'CUSTOMER',
      language: 'ar',
      phoneNumber: '+213 555 000 001',
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── 14. No initial audit logs (clean slate) ────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
  // Audit logs are NOT created — they'll be generated organically as users interact

  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   👤 Admin user: admin / admin123');
  console.log(`   👤 Customer user: customer1 / customer123`);
  console.log(`   🏢 Demo agency: ${agency.name} (${agency.customCode})`);
  console.log(`   🌿 Main branch: ${mainBranch.name}`);
  console.log(`   🔢 Counter: ${counter1.name}`);
  console.log('   📋 Service: General Service');
  console.log('   ⚙️ Queue settings: initialized (0/0)');
  console.log('   📱 SMS settings: disabled');
  console.log('   💳 Payment settings: disabled');
  console.log(`   ❓ FAQs: ${faqs.length} entries`);
  console.log('   📢 Announcements: none (clean slate)');
  console.log('   📝 Audit logs: none (clean slate)');
  console.log('');
  console.log('   🧹 All counts start at 0 — this is a fresh app with no usage data!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
